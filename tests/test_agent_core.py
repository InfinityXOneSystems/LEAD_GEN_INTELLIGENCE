"""
tests/test_agent_core.py – Unit tests for the agent_core pipeline.

Run with:
    python -m pytest tests/test_agent_core.py -v
or:
    python -m unittest tests/test_agent_core.py
"""

import unittest


class TestValidator(unittest.TestCase):
    """Tests for agent_core.validator."""

    def setUp(self):
        from agent_core.validator import Command, Plan, PlanStep, ExecutionResult
        self.Command = Command
        self.Plan = Plan
        self.PlanStep = PlanStep
        self.ExecutionResult = ExecutionResult

    def test_valid_command(self):
        cmd = self.Command(task="scrape epoxy contractors", industry="epoxy", location="tampa")
        self.assertEqual(cmd.industry, "epoxy")
        self.assertEqual(cmd.location, "tampa")

    def test_command_rejects_empty_task(self):
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            self.Command(task="", industry="epoxy", location="tampa")

    def test_command_rejects_empty_industry(self):
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            self.Command(task="scrape", industry="", location="tampa")

    def test_command_rejects_invalid_location(self):
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            self.Command(task="scrape", industry="epoxy", location="123!!!")

    def test_valid_plan(self):
        cmd = self.Command(task="scrape", industry="epoxy", location="tampa")
        step = self.PlanStep(tool="playwright_scraper", description="Scrape leads")
        plan = self.Plan(command=cmd, steps=[step])
        self.assertEqual(len(plan.steps), 1)

    def test_plan_rejects_empty_steps(self):
        from pydantic import ValidationError
        cmd = self.Command(task="scrape", industry="epoxy", location="tampa")
        with self.assertRaises(ValidationError):
            self.Plan(command=cmd, steps=[])

    def test_execution_result_defaults(self):
        result = self.ExecutionResult(success=True)
        self.assertEqual(result.leads_found, 0)
        self.assertEqual(result.high_value, 0)
        self.assertFalse(result.retried)


class TestGates(unittest.TestCase):
    """Tests for agent_core.gates."""

    def setUp(self):
        from agent_core.gates import (
            GateError, command_gate, tool_gate, plan_gate,
            run_all_gates, ALLOWED_TOOLS,
        )
        from agent_core.validator import Command, Plan, PlanStep
        self.GateError = GateError
        self.command_gate = command_gate
        self.tool_gate = tool_gate
        self.plan_gate = plan_gate
        self.run_all_gates = run_all_gates
        self.ALLOWED_TOOLS = ALLOWED_TOOLS
        self.Command = Command
        self.Plan = Plan
        self.PlanStep = PlanStep

    def test_command_gate_valid(self):
        cmd = self.command_gate({"task": "scrape", "industry": "epoxy", "location": "tampa"})
        self.assertIsInstance(cmd, self.Command)

    def test_command_gate_rejects_empty_task(self):
        with self.assertRaises(self.GateError):
            self.command_gate({"task": "", "industry": "epoxy", "location": "tampa"})

    def test_tool_gate_allows_valid_tool(self):
        # Should not raise
        self.tool_gate("playwright_scraper")

    def test_tool_gate_rejects_unknown_tool(self):
        with self.assertRaises(self.GateError):
            self.tool_gate("dangerous_tool")

    def test_plan_gate_valid(self):
        cmd = self.Command(task="scrape", industry="epoxy", location="tampa")
        step = self.PlanStep(tool="playwright_scraper", description="Scrape")
        plan = self.Plan(command=cmd, steps=[step])
        # Should not raise
        self.plan_gate(plan)

    def test_plan_gate_rejects_disallowed_tool(self):
        cmd = self.Command(task="scrape", industry="epoxy", location="tampa")
        step = self.PlanStep(tool="rm_rf", description="dangerous")
        plan = self.Plan(command=cmd, steps=[step])
        with self.assertRaises(self.GateError):
            self.plan_gate(plan)

    def test_allowed_tools_list(self):
        self.assertIn("playwright_scraper", self.ALLOWED_TOOLS)
        self.assertIn("email_generator", self.ALLOWED_TOOLS)
        self.assertIn("lead_analyzer", self.ALLOWED_TOOLS)
        self.assertIn("calendar_tool", self.ALLOWED_TOOLS)

    def test_run_all_gates_success(self):
        cmd_dict = {"task": "scrape", "industry": "epoxy", "location": "tampa"}
        step = self.PlanStep(tool="playwright_scraper", description="Scrape")
        cmd = self.Command(**cmd_dict)
        plan = self.Plan(command=cmd, steps=[step])
        result = self.run_all_gates(cmd_dict, plan)
        self.assertIsInstance(result, self.Command)

    def test_run_all_gates_blocked_by_tool(self):
        cmd_dict = {"task": "scrape", "industry": "epoxy", "location": "tampa"}
        step = self.PlanStep(tool="bad_tool", description="bad")
        cmd = self.Command(**cmd_dict)
        plan = self.Plan(command=cmd, steps=[step])
        with self.assertRaises(self.GateError):
            self.run_all_gates(cmd_dict, plan)


class TestPlanner(unittest.TestCase):
    """Tests for agent_core.planner."""

    def setUp(self):
        from agent_core.planner import plan_from_text, plan
        self.plan_from_text = plan_from_text
        self.plan = plan

    def test_basic_scrape_command(self):
        p = self.plan_from_text("scrape epoxy contractors tampa florida")
        self.assertEqual(p.command.industry, "epoxy")
        self.assertIn("tampa", p.command.location)
        self.assertTrue(len(p.steps) > 0)
        self.assertEqual(p.steps[0].tool, "playwright_scraper")

    def test_email_keyword_triggers_email_step(self):
        p = self.plan_from_text("find email for roofing contractors ohio")
        tools = [s.tool for s in p.steps]
        self.assertIn("email_generator", tools)

    def test_unknown_command_returns_default_steps(self):
        p = self.plan_from_text("xyz123 gibberish")
        self.assertTrue(len(p.steps) > 0)

    def test_plan_function_returns_plan(self):
        from agent_core.validator import Plan
        p = self.plan("scrape flooring leads chicago")
        self.assertIsInstance(p, Plan)


class TestExecutor(unittest.TestCase):
    """Tests for agent_core.executor."""

    def setUp(self):
        from agent_core.executor import Executor, register_tool
        from agent_core.planner import plan_from_text
        self.Executor = Executor
        self.register_tool = register_tool
        self.plan_from_text = plan_from_text

    def test_gate_blocks_disallowed_command(self):
        from agent_core.validator import Plan, PlanStep, Command
        executor = self.Executor()
        bad_cmd = {"task": "", "industry": "epoxy", "location": "tampa"}
        cmd = Command(task="scrape", industry="epoxy", location="tampa")
        step = PlanStep(tool="playwright_scraper", description="Scrape")
        plan = Plan(command=cmd, steps=[step])
        result = executor.execute(bad_cmd, plan)
        self.assertFalse(result.success)
        self.assertTrue(len(result.errors) > 0)

    def test_gate_blocks_disallowed_tool(self):
        from agent_core.validator import Plan, PlanStep, Command
        executor = self.Executor()
        cmd_dict = {"task": "scrape", "industry": "epoxy", "location": "tampa"}
        cmd = Command(**cmd_dict)
        step = PlanStep(tool="evil_tool", description="evil")
        plan = Plan(command=cmd, steps=[step])
        result = executor.execute(cmd_dict, plan)
        self.assertFalse(result.success)

    def test_custom_tool_handler_returns_leads(self):
        from agent_core.validator import Plan, PlanStep, Command
        # Register a mock scraper that returns leads
        self.register_tool("playwright_scraper", lambda p: {"leads_found": 10, "high_value": 3})
        executor = self.Executor()
        cmd_dict = {"task": "scrape", "industry": "epoxy", "location": "tampa"}
        cmd = Command(**cmd_dict)
        step = PlanStep(tool="playwright_scraper", description="Scrape")
        plan = Plan(command=cmd, steps=[step])
        result = executor.execute(cmd_dict, plan)
        self.assertTrue(result.success)
        self.assertEqual(result.leads_found, 10)
        # Restore default stub
        from agent_core.executor import _default_playwright_scraper
        self.register_tool("playwright_scraper", _default_playwright_scraper)

    def test_retry_on_insufficient_leads(self):
        from agent_core.validator import Plan, PlanStep, Command
        executor = self.Executor()
        cmd_dict = {"task": "scrape", "industry": "epoxy", "location": "tampa"}
        cmd = Command(**cmd_dict)
        step = PlanStep(tool="playwright_scraper", description="Scrape")
        plan = Plan(command=cmd, steps=[step])
        result = executor.execute(cmd_dict, plan)
        # Default stub returns 0 leads → retried must be True
        self.assertTrue(result.retried)


class TestStateManager(unittest.TestCase):
    """Tests for agent_core.state_manager."""

    def setUp(self):
        from agent_core.state_manager import StateManager
        self.StateManager = StateManager

    def test_create_and_get(self):
        sm = self.StateManager()
        sm.create("run-001", {"status": "init"})
        state = sm.get("run-001")
        self.assertIsNotNone(state)
        self.assertEqual(state["status"], "init")

    def test_update(self):
        sm = self.StateManager()
        sm.create("run-002", {"status": "init"})
        sm.update("run-002", {"status": "completed", "leads_found": 7})
        state = sm.get("run-002")
        self.assertEqual(state["status"], "completed")
        self.assertEqual(state["leads_found"], 7)

    def test_get_nonexistent_returns_none(self):
        sm = self.StateManager()
        self.assertIsNone(sm.get("does-not-exist"))

    def test_all_runs(self):
        sm = self.StateManager()
        sm.create("run-003", {"status": "init"})
        sm.create("run-004", {"status": "init"})
        runs = sm.all_runs()
        self.assertIn("run-003", runs)
        self.assertIn("run-004", runs)


if __name__ == "__main__":
    unittest.main()
