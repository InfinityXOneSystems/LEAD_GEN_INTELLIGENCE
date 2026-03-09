"""
app/runtime/command_router.py
==============================
Routes validated commands to the appropriate agent module.
"""

import logging
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)

# Registry: command → handler factory
_HANDLERS: Dict[str, Callable[[], Any]] = {}


def register(command: str, handler_factory: Callable[[], Any]) -> None:
    """Register a handler factory for a command type."""
    _HANDLERS[command] = handler_factory
    logger.debug("registered handler for command: %s", command)


def route(command: str) -> Optional[Any]:
    """
    Return an instantiated handler for *command*, or None if not registered.

    Handlers are created fresh for each invocation (handler_factory is called).
    """
    factory = _HANDLERS.get(command)
    if factory is None:
        logger.warning("no handler registered for command: %s", command)
        return None
    return factory()


def _default_scraper():
    from app.agents.scraper_agent.scraper import ScraperAgentHandler

    return ScraperAgentHandler()


def _default_seo():
    from app.agents.seo_agent.seo import SEOAgentHandler

    return SEOAgentHandler()


def _default_social():
    from app.agents.social_agent.social import SocialAgentHandler

    return SocialAgentHandler()


def _default_browser():
    from app.agents.browser_agent.browser import BrowserAgentHandler

    return BrowserAgentHandler()


def _register_defaults() -> None:
    """Register the built-in agent handlers."""
    scraper_cmds = {
        "scrape_website",
        "scrape_maps",
        "scrape_yelp",
        "scrape_directory",
        "run_scraper",
    }
    for cmd in scraper_cmds:
        register(cmd, _default_scraper)

    register("run_seo_audit", _default_seo)
    register("run_social_scan", _default_social)
    register("run_browser", _default_browser)


def get_registered_commands() -> list:
    return list(_HANDLERS.keys())


def dispatch(
    command: str, task_id: str, target: Optional[str], parameters: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Route and execute *command* synchronously.

    :returns: Result dict from the handler.
    """
    handler = route(command)
    if handler is None:
        return {
            "success": False,
            "error": f"No handler registered for command '{command}'",
        }
    try:
        return handler.execute(task_id=task_id, target=target, parameters=parameters)
    except Exception as exc:
        logger.error("handler raised for command=%s: %s", command, exc)
        return {"success": False, "error": str(exc)}
