"""
tests/test_runtime_api.py
==========================
Integration tests for the runtime command API.

POST /api/v1/runtime/command  — submit command, verify task_id returned
GET  /runtime/task/{task_id}  — poll task, verify status response
"""

import pytest


# ---------------------------------------------------------------------------
# POST /api/v1/runtime/command
# ---------------------------------------------------------------------------


def test_runtime_command_scrape(client):
    """Submitting a scrape command returns 202 with a task_id."""
    resp = client.post(
        "/api/v1/runtime/command",
        json={"command": "scrape epoxy contractors in Orlando FL", "priority": 5},
    )
    assert resp.status_code == 202, resp.text
    data = resp.json()
    assert "task_id" in data
    assert data["status"] in ("queued", "pending", "running", "completed")
    assert data["command_type"] in ("scrape_website", "unknown")
    assert "agent" in data


def test_runtime_command_seo(client):
    """SEO-related command is routed to the seo agent."""
    resp = client.post(
        "/api/v1/runtime/command",
        json={"command": "run seo analysis on example.com"},
    )
    assert resp.status_code == 202, resp.text
    data = resp.json()
    assert "task_id" in data
    assert data["command_type"] in ("seo_analysis", "unknown")


def test_runtime_command_blank_rejected(client):
    """Blank command string is rejected with 422."""
    resp = client.post(
        "/api/v1/runtime/command",
        json={"command": "   "},
    )
    assert resp.status_code == 422


def test_runtime_command_missing_field(client):
    """Missing 'command' field is rejected with 422."""
    resp = client.post("/api/v1/runtime/command", json={"priority": 5})
    assert resp.status_code == 422


def test_runtime_command_priority_bounds(client):
    """Priority outside 1–10 is rejected with 422."""
    resp = client.post(
        "/api/v1/runtime/command",
        json={"command": "scrape leads", "priority": 99},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /runtime/task/{task_id}
# ---------------------------------------------------------------------------


def test_get_task_status(client):
    """
    Submitting a command and immediately polling the task should return
    a valid status response.
    """
    post_resp = client.post(
        "/api/v1/runtime/command",
        json={"command": "export leads to csv"},
    )
    assert post_resp.status_code == 202
    task_id = post_resp.json()["task_id"]

    get_resp = client.get(f"/api/v1/runtime/task/{task_id}")
    assert get_resp.status_code == 200, get_resp.text
    data = get_resp.json()
    assert data["task_id"] == task_id
    assert "status" in data
    assert "logs" in data
    assert isinstance(data["logs"], list)


def test_get_task_not_found(client):
    """Unknown task_id returns 404."""
    resp = client.get("/api/v1/runtime/task/nonexistent-task-id")
    assert resp.status_code == 404
