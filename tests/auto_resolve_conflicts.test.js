"use strict";
/**
 * tests/auto_resolve_conflicts.test.js
 * =====================================
 * Tests for the autonomous merge conflict resolution script.
 * Validates each resolution strategy using synthetic conflict blocks.
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const RESOLVER = path.join(__dirname, "../scripts/auto_resolve_conflicts.py");
const PYTHON = process.env.PYTHON || "python3";

// ---------------------------------------------------------------------------
// Helper: create a temp file with synthetic conflict markers
// ---------------------------------------------------------------------------
function makeTempConflictFile(ext, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "conflict_test_"));
  const fp = path.join(dir, `conflict_test${ext}`);
  fs.writeFileSync(fp, content, "utf8");
  return { fp, dir };
}

function resolveFile(fp, strategy = null) {
  const args = [RESOLVER, "--repo-root", path.dirname(fp)];
  if (strategy) {
    args.push("--strategy", strategy);
  }
  const result = execFileSync(PYTHON, args, { encoding: "utf8" });
  return { output: result, resolved: fs.readFileSync(fp, "utf8") };
}

// ---------------------------------------------------------------------------
// Test: "theirs" strategy
// ---------------------------------------------------------------------------
test("resolver: theirs strategy picks incoming changes", () => {
  const { fp, dir } = makeTempConflictFile(
    ".txt",
    [
      "<<<<<<< HEAD",
      "ours line",
      "=======",
      "theirs line",
      ">>>>>>> feature-branch",
      "",
    ].join("\n")
  );

  const { resolved } = resolveFile(fp, "theirs");
  assert.ok(resolved.includes("theirs line"), "Should contain theirs line");
  assert.ok(!resolved.includes("ours line"), "Should NOT contain ours line");
  assert.ok(!resolved.includes("<<<<<<<"), "Should have no conflict markers");

  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Test: "ours" strategy
// ---------------------------------------------------------------------------
test("resolver: ours strategy preserves current branch", () => {
  const { fp, dir } = makeTempConflictFile(
    ".yml",
    [
      "<<<<<<< HEAD",
      "current: value",
      "=======",
      "incoming: value",
      ">>>>>>> main",
      "",
    ].join("\n")
  );

  const { resolved } = resolveFile(fp, "ours");
  assert.ok(resolved.includes("current: value"), "Should contain ours value");
  assert.ok(!resolved.includes("incoming: value"), "Should NOT contain theirs value");
  assert.ok(!resolved.includes("<<<<<<<"), "Should have no conflict markers");

  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Test: "union" strategy (.gitignore)
// ---------------------------------------------------------------------------
test("resolver: union strategy keeps lines from both sides", () => {
  const { fp, dir } = makeTempConflictFile(
    ".gitignore",
    [
      "node_modules/",
      "<<<<<<< HEAD",
      "dist/",
      "=======",
      "build/",
      ">>>>>>> main",
      "*.log",
      "",
    ].join("\n")
  );

  const { resolved } = resolveFile(fp, "union");
  assert.ok(resolved.includes("dist/"), "Should contain ours pattern");
  assert.ok(resolved.includes("build/"), "Should contain theirs pattern");
  assert.ok(resolved.includes("node_modules/"), "Should preserve surrounding lines");
  assert.ok(!resolved.includes("<<<<<<<"), "Should have no conflict markers");

  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Test: "json" strategy merges objects deeply
// ---------------------------------------------------------------------------
test("resolver: json strategy deep-merges objects", () => {
  const { fp, dir } = makeTempConflictFile(
    ".json",
    [
      "<<<<<<< HEAD",
      JSON.stringify({ version: "1.0.0", name: "xps", extra: "ours" }),
      "=======",
      JSON.stringify({ version: "1.1.0", name: "xps", newField: "theirs" }),
      ">>>>>>> main",
      "",
    ].join("\n")
  );

  const { resolved } = resolveFile(fp, "json");
  let parsed;
  try {
    parsed = JSON.parse(resolved.trim());
  } catch {
    assert.fail(`Resolved JSON is invalid: ${resolved}`);
  }
  // version: theirs wins on scalar conflict
  assert.equal(parsed.version, "1.1.0", "theirs version should win");
  assert.equal(parsed.name, "xps", "shared field should be preserved");
  assert.equal(parsed.newField, "theirs", "theirs new field should be included");
  assert.ok(!resolved.includes("<<<<<<<"), "Should have no conflict markers");

  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Test: multiple conflict blocks in one file
// ---------------------------------------------------------------------------
test("resolver: handles multiple conflict blocks in one file", () => {
  const { fp, dir } = makeTempConflictFile(
    ".txt",
    [
      "header",
      "<<<<<<< HEAD",
      "block1 ours",
      "=======",
      "block1 theirs",
      ">>>>>>> main",
      "middle",
      "<<<<<<< HEAD",
      "block2 ours",
      "=======",
      "block2 theirs",
      ">>>>>>> main",
      "footer",
      "",
    ].join("\n")
  );

  const { resolved } = resolveFile(fp, "theirs");
  assert.ok(resolved.includes("block1 theirs"), "block1 resolved");
  assert.ok(resolved.includes("block2 theirs"), "block2 resolved");
  assert.ok(resolved.includes("header"), "header preserved");
  assert.ok(resolved.includes("middle"), "middle preserved");
  assert.ok(resolved.includes("footer"), "footer preserved");
  assert.ok(!resolved.includes("<<<<<<<"), "No conflict markers remain");

  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Test: dry-run does not modify files
// ---------------------------------------------------------------------------
test("resolver: dry-run does not modify files", () => {
  const content = [
    "<<<<<<< HEAD",
    "original ours",
    "=======",
    "original theirs",
    ">>>>>>> main",
    "",
  ].join("\n");

  const { fp, dir } = makeTempConflictFile(".txt", content);

  execFileSync(
    PYTHON,
    [RESOLVER, "--repo-root", path.dirname(fp), "--dry-run"],
    { encoding: "utf8" }
  );

  const afterDryRun = fs.readFileSync(fp, "utf8");
  assert.equal(afterDryRun, content, "File should be unchanged after dry-run");

  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Test: file with no conflicts returns cleanly
// ---------------------------------------------------------------------------
test("resolver: clean file with no conflicts exits 0", () => {
  const { fp, dir } = makeTempConflictFile(".js", 'const x = "clean";\n');

  let exitCode = 0;
  try {
    execFileSync(
      PYTHON,
      [RESOLVER, "--repo-root", path.dirname(fp)],
      { encoding: "utf8" }
    );
  } catch (err) {
    exitCode = err.status;
  }
  assert.equal(exitCode, 0, "Should exit 0 for clean files");
  assert.equal(
    fs.readFileSync(fp, "utf8"),
    'const x = "clean";\n',
    "File should be unmodified"
  );

  fs.rmSync(dir, { recursive: true, force: true });
});
