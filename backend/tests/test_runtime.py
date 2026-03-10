"""
tests/test_runtime.py
======================
Tests for the runtime command execution API.

Tests:
  - POST /api/v1/runtime/command (valid and invalid)
  - GET /api/v1/runtime/task/{task_id}
  - Policy engine validation
  - Queue dispatch
  - Sandbox executor
"""

import time

import pytest

# ─── Policy Engine ────────────────────────────────────────────────────────────


def test_policy_engine_allows_valid_command():
    from app.runtime.policy_engine import enforce, reset_rate_limits

    reset_rate_limits()
    result = enforce("scrape_website", client_id="test-policy-allow")
    assert result["command"] == "scrape_website"
    assert isinstance(result["sandbox_required"], bool)


def test_policy_engine_rejects_unknown_command():
    from app.runtime.command_validator import ValidationError
    from app.runtime.policy_engine import enforce

    with pytest.raises(ValidationError):
        enforce("hack_the_planet", client_id="test-policy-reject")


def test_policy_engine_rate_limit():
    from app.runtime.policy_engine import PolicyViolation, enforce, reset_rate_limits

    reset_rate_limits()
    # Exhaust the limit quickly
    client = "test-rate-limit-client"
    for _ in range(60):
        enforce("health_check", client_id=client, rate_limit=60)
    with pytest.raises(PolicyViolation):
        enforce("health_check", client_id=client, rate_limit=60)
    reset_rate_limits()


# ─── Command Validator ────────────────────────────────────────────────────────


def test_validator_normalises_command():
    from app.runtime.command_validator import validate_command

    cmd, tgt, params = validate_command("  SCRAPE_WEBSITE  ", "example.com")
    assert cmd == "scrape_website"
    assert tgt == "example.com"
    assert isinstance(params, dict)


def test_validator_rejects_bad_command():
    from app.runtime.command_validator import ValidationError, validate_command

    with pytest.raises(ValidationError):
        validate_command("", None)


def test_validator_requires_sandbox():
    from app.runtime.command_validator import requires_sandbox

    assert requires_sandbox("scrape_website") is True
    assert requires_sandbox("health_check") is False


# ─── Task State Store ─────────────────────────────────────────────────────────


def test_task_state_store_create_and_get():
    from app.queue.task_state_store import TaskStateStore

    store = TaskStateStore()
    task = store.create(command="health_check", target=None)
    assert task.task_id
    assert task.status == "queued"

    fetched = store.get(task.task_id)
    assert fetched is not None
    assert fetched.task_id == task.task_id


def test_task_state_store_update_status():
    from app.queue.task_state_store import TaskState, TaskStateStore

    store = TaskStateStore()
    task = store.create(command="health_check")
    store.update_status(task.task_id, TaskState.STATUS_RUNNING)
    assert store.get(task.task_id).status == "running"


def test_task_state_store_add_log():
    from app.queue.task_state_store import TaskStateStore

    store = TaskStateStore()
    task = store.create(command="health_check")
    store.add_log(task.task_id, "hello world")
    logs = store.get(task.task_id).logs
    assert any("hello world" in log for log in logs)


def test_task_state_store_list_recent():
    from app.queue.task_state_store import TaskStateStore

    store = TaskStateStore()
    for i in range(5):
        store.create(command=f"health_check_{i}")
    recent = store.list_recent(limit=3)
    assert len(recent) == 3


# ─── Error Manager ────────────────────────────────────────────────────────────


def test_error_manager_circuit_breaker():
    from app.runtime.error_manager import is_circuit_open, record_failure, reset_all

    reset_all()
    cmd = "test_cb_command"
    assert not is_circuit_open(cmd)

    # Trigger 5 failures to open the circuit
    for _ in range(5):
        record_failure(cmd)

    assert is_circuit_open(cmd)

    # Success after reset
    reset_all()
    assert not is_circuit_open(cmd)


def test_error_manager_success_resets_failures():
    from app.runtime.error_manager import (
        get_circuit_status,
        record_failure,
        record_success,
        reset_all,
    )

    reset_all()
    cmd = "test_reset_command"
    record_failure(cmd)
    record_failure(cmd)
    record_success(cmd)
    status = get_circuit_status(cmd)
    assert status is not None
    assert status["failures"] == 0


# ─── Retry Policy ─────────────────────────────────────────────────────────────


def test_retry_success_on_first_attempt():
    from app.runtime.retry_policy import retry

    calls = []

    def fn():
        calls.append(1)
        return "ok"

    result = retry(fn, max_retries=3, base_delay=0)
    assert result == "ok"
    assert len(calls) == 1


def test_retry_succeeds_after_failures():
    from app.runtime.retry_policy import retry

    calls = []

    def fn():
        calls.append(1)
        if len(calls) < 3:
            raise ValueError("fail")
        return "success"

    result = retry(fn, max_retries=3, base_delay=0)
    assert result == "success"
    assert len(calls) == 3


def test_retry_exhausted():
    from app.runtime.retry_policy import RetryExhausted, retry

    def fn():
        raise RuntimeError("always fails")

    with pytest.raises(RetryExhausted):
        retry(fn, max_retries=2, base_delay=0)


# ─── Sandbox Executor ─────────────────────────────────────────────────────────


def test_sandbox_executor_runs_fn():
    from app.sandbox.sandbox_executor import SandboxExecutor

    executor = SandboxExecutor(task_id="test-sandbox-1")

    def my_fn(**kwargs):
        return {"success": True, "value": 42}

    result = executor.run(fn=my_fn, kwargs={}, timeout=10)
    assert result["success"] is True
    assert result["value"] == 42


def test_sandbox_executor_captures_exception():
    from app.sandbox.sandbox_executor import SandboxExecutor

    executor = SandboxExecutor(task_id="test-sandbox-2")

    def failing_fn(**kwargs):
        raise ValueError("deliberate error")

    result = executor.run(fn=failing_fn, kwargs={}, timeout=10)
    assert result["success"] is False
    assert "deliberate error" in result["error"]


def test_sandbox_executor_timeout():
    from app.sandbox.sandbox_executor import SandboxExecutor, SandboxTimeoutError

    executor = SandboxExecutor(task_id="test-sandbox-timeout")

    def slow_fn(**kwargs):
        time.sleep(10)  # Much longer than timeout=1; no need for 60s
        return {}

    with pytest.raises(SandboxTimeoutError):
        executor.run(fn=slow_fn, kwargs={}, timeout=1)


# ─── Filesystem Guard ─────────────────────────────────────────────────────────


def test_filesystem_guard_safe_path():
    from app.sandbox.filesystem_guard import is_safe, safe_path

    root = safe_path("test_file.txt")
    assert root.exists() or not root.exists()  # Path resolved without error
    assert is_safe("test_file.txt")


def test_filesystem_guard_rejects_traversal():
    from app.sandbox.filesystem_guard import safe_path

    with pytest.raises(PermissionError):
        safe_path("../../etc/passwd")


# ─── Network Guard ────────────────────────────────────────────────────────────


def test_network_guard_allows_normal_url():
    from app.sandbox.network_guard import is_allowed

    assert is_allowed("https://example.com") is True


def test_network_guard_blocks_metadata_endpoint():
    from app.sandbox.network_guard import is_allowed

    assert is_allowed("http://169.254.169.254/latest/meta-data") is False


# ─── Runtime Controller ───────────────────────────────────────────────────────


def test_runtime_controller_submit_and_get():
    from app.runtime.policy_engine import reset_rate_limits
    from app.runtime.runtime_controller import RuntimeController

    reset_rate_limits()
    ctrl = RuntimeController()
    task_id, status = ctrl.submit_command(
        command="health_check", client_id="test-ctrl-submit"
    )
    assert status == "queued"
    assert task_id

    task = ctrl.get_task(task_id)
    assert task is not None
    assert task["task_id"] == task_id


def test_runtime_controller_get_nonexistent():
    from app.runtime.runtime_controller import RuntimeController

    ctrl = RuntimeController()
    assert ctrl.get_task("nonexistent-id") is None


# ─── API Endpoints ────────────────────────────────────────────────────────────


def test_runtime_command_endpoint_valid(client):
    from app.runtime.policy_engine import reset_rate_limits

    reset_rate_limits()
    resp = client.post(
        "/api/v1/runtime/command",
        json={"command": "health_check", "target": None, "parameters": {}},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "task_id" in data
    assert data["status"] == "queued"


def test_runtime_command_endpoint_invalid_command(client):
    resp = client.post(
        "/api/v1/runtime/command",
        json={"command": "do_something_evil", "parameters": {}},
    )
    assert resp.status_code == 422


def test_runtime_command_endpoint_missing_command(client):
    resp = client.post("/api/v1/runtime/command", json={"parameters": {}})
    assert resp.status_code == 422


def test_runtime_task_status_not_found(client):
    resp = client.get("/api/v1/runtime/task/nonexistent-task-id")
    assert resp.status_code == 404


def test_runtime_task_status_found(client):
    from app.runtime.policy_engine import reset_rate_limits

    reset_rate_limits()
    # Create a task first
    resp = client.post(
        "/api/v1/runtime/command",
        json={"command": "health_check", "parameters": {}},
    )
    assert resp.status_code == 200
    task_id = resp.json()["task_id"]

    # Poll status
    status_resp = client.get(f"/api/v1/runtime/task/{task_id}")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["task_id"] == task_id
    assert data["status"] in ("queued", "running", "completed", "failed")


# ─── System Endpoints ─────────────────────────────────────────────────────────


def test_system_health_endpoint(client):
    resp = client.get("/api/v1/system/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "checks" in data


def test_system_metrics_endpoint(client):
    resp = client.get("/api/v1/system/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert "queue_size" in data


def test_system_tasks_endpoint(client):
    resp = client.get("/api/v1/system/tasks")
    assert resp.status_code == 200
    data = resp.json()
    assert "tasks" in data
    assert isinstance(data["tasks"], list)
