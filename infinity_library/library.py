"""
infinity_library/library.py
============================
Persistent knowledge repository.

Stores:
- Scraped intelligence from vision_cortex
- Invention ideas from agents
- Research insights
- Experiment results
- Generated documents

Supports:
- Semantic search (keyword-based fallback when embeddings unavailable)
- Structured metadata
- Versioned experiment results
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

LIBRARY_ROOT = Path(__file__).parent / "data"

VALID_CONTENT_TYPES = frozenset(
    {
        "intelligence",
        "idea",
        "research",
        "experiment",
        "document",
        "invention_report",
    }
)

INDEX_PATH = LIBRARY_ROOT / "index.json"


class InfinityLibrary:
    """Persistent knowledge repository for the XPS Intelligence platform."""

    def __init__(self, root: Path | None = None) -> None:
        self._root = root or LIBRARY_ROOT
        self._index_path = self._root / "index.json"
        self._root.mkdir(parents=True, exist_ok=True)
        self._index: Dict[str, dict] = self._load_index()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _load_index(self) -> Dict[str, dict]:
        if self._index_path.exists():
            try:
                return json.loads(self._index_path.read_text(encoding="utf-8"))
            except Exception as exc:
                logger.warning("Failed to load index, starting fresh: %s", exc)
        return {}

    def _save_index(self) -> None:
        try:
            self._index_path.write_text(
                json.dumps(self._index, indent=2, default=str), encoding="utf-8"
            )
        except Exception as exc:
            logger.error("Failed to save index: %s", exc)

    def _item_path(self, content_type: str, item_id: str) -> Path:
        return self._root / content_type / f"{item_id}.json"

    def _load_item(self, content_type: str, item_id: str) -> dict | None:
        path = self._item_path(content_type, item_id)
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.error("Failed to load item %s: %s", item_id, exc)
            return None

    def _save_item(self, item: dict) -> bool:
        content_type = item["content_type"]
        item_id = item["id"]
        directory = self._root / content_type
        directory.mkdir(parents=True, exist_ok=True)
        path = self._item_path(content_type, item_id)
        try:
            path.write_text(
                json.dumps(item, indent=2, default=str), encoding="utf-8"
            )
            return True
        except Exception as exc:
            logger.error("Failed to save item %s: %s", item_id, exc)
            return False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def store(
        self,
        content_type: str,
        title: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Store an item in the library.

        Returns the unique item id.
        """
        if content_type not in VALID_CONTENT_TYPES:
            logger.warning(
                "Unknown content_type '%s'; storing anyway.", content_type
            )

        item_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        item: Dict[str, Any] = {
            "id": item_id,
            "content_type": content_type,
            "title": title,
            "content": content,
            "metadata": metadata or {},
            "created_at": now,
            "updated_at": now,
        }

        if not self._save_item(item):
            raise RuntimeError(f"Failed to persist item '{title}'")

        self._index[item_id] = {
            "id": item_id,
            "content_type": content_type,
            "title": title,
            "created_at": now,
            "updated_at": now,
        }
        self._save_index()
        logger.info("Stored %s '%s' as %s", content_type, title, item_id)
        return item_id

    def search(
        self,
        query: str,
        content_type: Optional[str] = None,
        limit: int = 20,
    ) -> List[dict]:
        """Keyword search across stored items.

        Searches title, content, and metadata values.  Returns up to
        *limit* results ordered by recency.
        """
        tokens = query.lower().split()
        results: List[dict] = []

        candidates = (
            [
                entry
                for entry in self._index.values()
                if entry["content_type"] == content_type
            ]
            if content_type
            else list(self._index.values())
        )

        # Sort candidates newest-first so limit trims the oldest
        candidates.sort(key=lambda e: e.get("created_at", ""), reverse=True)

        for entry in candidates:
            item = self._load_item(entry["content_type"], entry["id"])
            if item is None:
                continue

            haystack = " ".join(
                [
                    item.get("title", ""),
                    item.get("content", ""),
                    json.dumps(item.get("metadata", {})),
                ]
            ).lower()

            if all(tok in haystack for tok in tokens):
                results.append(item)

            if len(results) >= limit:
                break

        return results

    def get(self, item_id: str) -> dict | None:
        """Return a single item by id, or None if not found."""
        entry = self._index.get(item_id)
        if entry is None:
            return None
        return self._load_item(entry["content_type"], item_id)

    def list_items(
        self,
        content_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[dict]:
        """List index entries, optionally filtered by content_type."""
        entries = list(self._index.values())
        if content_type:
            entries = [e for e in entries if e["content_type"] == content_type]
        entries.sort(key=lambda e: e.get("created_at", ""), reverse=True)
        return entries[:limit]

    def update(self, item_id: str, updates: dict) -> bool:
        """Update metadata (and optionally title/content) of an existing item.

        Returns True on success, False if the item was not found.
        """
        entry = self._index.get(item_id)
        if entry is None:
            logger.warning("update: item %s not found", item_id)
            return False

        item = self._load_item(entry["content_type"], item_id)
        if item is None:
            return False

        protected = {"id", "content_type", "created_at"}
        for key, value in updates.items():
            if key in protected:
                continue
            if key == "metadata" and isinstance(value, dict):
                item["metadata"].update(value)
            else:
                item[key] = value

        now = datetime.now(timezone.utc).isoformat()
        item["updated_at"] = now
        entry["updated_at"] = now

        if not self._save_item(item):
            return False

        if "title" in updates:
            entry["title"] = updates["title"]

        self._save_index()
        return True

    def stats(self) -> dict:
        """Return aggregate statistics about stored items."""
        counts: Dict[str, int] = {}
        for entry in self._index.values():
            ct = entry.get("content_type", "unknown")
            counts[ct] = counts.get(ct, 0) + 1

        return {
            "total_items": len(self._index),
            "by_content_type": counts,
            "data_root": str(self._root),
        }
