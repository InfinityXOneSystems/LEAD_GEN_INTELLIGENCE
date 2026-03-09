"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Play, Save, FileCode } from "lucide-react";
import toast from "react-hot-toast";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const STARTER_FILES: Record<string, string> = {
  "scrape-config.json": JSON.stringify(
    {
      jobs: [
        { query: "epoxy flooring contractors", state: "TX", city: "" },
        { query: "roofing contractors", state: "FL", city: "Miami" },
      ],
      scraper: { concurrency: 5, delay_ms: 1000 },
    },
    null,
    2,
  ),
  "lead-filters.json": JSON.stringify(
    {
      min_score: 60,
      required_fields: ["email", "phone"],
      industries: ["epoxy", "roofing", "flooring"],
      states: ["TX", "FL", "CA"],
    },
    null,
    2,
  ),
  "outreach-template.txt": `Hi {owner_name},\n\nI came across {company_name} and was impressed by your work.\n\nWould love to connect!\n\nBest,\nThe LeadGen Team`,
};

export default function EditorPage() {
  const [selectedFile, setSelectedFile] = useState("scrape-config.json");
  const [files, setFiles] = useState(STARTER_FILES);

  const handleSave = () => {
    toast.success(`Saved ${selectedFile}`);
  };

  const handleRun = () => {
    try {
      const content = files[selectedFile];
      if (selectedFile.endsWith(".json")) {
        JSON.parse(content);
        toast.success("JSON is valid ✓");
      } else {
        toast.success("File looks good ✓");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(`Syntax error: ${err.message}`);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Config Editor</h1>
          <p className="text-gray-500 text-sm mt-1">
            Edit pipeline configuration files
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRun} className="btn-secondary">
            <Play className="w-4 h-4" />
            Validate
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* File Browser */}
        <div className="w-48 shrink-0 card p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Files
          </p>
          {Object.keys(files).map((fname) => (
            <button
              key={fname}
              onClick={() => setSelectedFile(fname)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors ${
                selectedFile === fname
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{fname}</span>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
          <MonacoEditor
            height="100%"
            language={selectedFile.endsWith(".json") ? "json" : "plaintext"}
            value={files[selectedFile]}
            onChange={(val) =>
              setFiles((f) => ({ ...f, [selectedFile]: val ?? "" }))
            }
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}
