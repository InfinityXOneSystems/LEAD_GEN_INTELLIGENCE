"""
infinity_library/library.py
============================
Infinity Library — Universal knowledge store for the XPS Intelligence platform.

Stores:
  - Research insights from the Research Agent
  - Scraped intelligence from Vision Cortex
  - Invention ideas from Simulation/Prediction agents
  - Experiment results from the Sandbox

Provides:
  - In-memory key-value store (always available)
  - JSON file persistence (lightweight)
  - Vector search via Qdrant (when available)

Usage::

    lib = InfinityLibrary()
    lib.store("research", "flooring_market_2024", {"insight": "Growing demand..."})
    results = lib.search("flooring market trends")
    entry = lib.retrieve("research", "flooring_market_2024")
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
import time
import uuid
from pathlib import Path
from threading import Lock
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_DEFAULT_STORAGE_PATH = Path(__file__).parent / "storage" / "library.json"

# Valid namespaces
NAMESPACES = [
    "research",
    "intelligence",
    "inventions",
    "experiments",
    "strategies",
    "leads",
    "documents",
    "general",
]


class LibraryEntry:
    """A single entry in the Infinity Library."""

    def __init__(
        self,
        namespace: str,
        key: str,
        value: Any,
        tags: Optional[List[str]] = None,
        source: Optional[str] = None,
    ) -> None:
        self.entry_id = str(uuid.uuid4())
        self.namespace = namespace
        self.key = key
        self.value = value
        self.tags = tags or []
        self.source = source
        self.created_at = time.time()
        self.updated_at = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entry_id": self.entry_id,
            "namespace": self.namespace,
            "key": self.key,
            "value": self.value,
            "tags": self.tags,
            "source": self.source,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LibraryEntry":
        entry = cls(
            namespace=data["namespace"],
            key=data["key"],
            value=data["value"],
            tags=data.get("tags", []),
            source=data.get("source"),
        )
        entry.entry_id = data.get("entry_id", entry.entry_id)
        entry.created_at = data.get("created_at", entry.created_at)
        entry.updated_at = data.get("updated_at", entry.updated_at)
        return entry


class InfinityLibrary:
    """
    Universal knowledge store with in-memory storage and JSON persistence.

    Thread-safe for concurrent agent access.
    """

    def __init__(self, storage_path: Optional[Path] = None) -> None:
        self._storage_path = storage_path or _DEFAULT_STORAGE_PATH
        self._entries: Dict[str, Dict[str, LibraryEntry]] = {ns: {} for ns in NAMESPACES}
        self._lock = Lock()
        self._load()
        logger.info("[InfinityLibrary] Initialised — %d entries loaded", self._count())

    # ------------------------------------------------------------------
    # CRUD operations
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
        namespace: str,
        key: str,
        value: Any,
        tags: Optional[List[str]] = None,
        source: Optional[str] = None,
    ) -> str:
        """Store a value. Returns the entry_id."""
        self._validate_namespace(namespace)
        with self._lock:
            if key in self._entries[namespace]:
                # Update existing entry
                entry = self._entries[namespace][key]
                entry.value = value
                entry.tags = tags or entry.tags
                entry.source = source or entry.source
                entry.updated_at = time.time()
            else:
                # Create new entry
                entry = LibraryEntry(namespace, key, value, tags, source)
                self._entries[namespace][key] = entry

            logger.debug("[InfinityLibrary] Stored %s/%s", namespace, key)
            self._save()
            return entry.entry_id

    def retrieve(self, namespace: str, key: str) -> Optional[Any]:
        """Retrieve a value by namespace and key."""
        self._validate_namespace(namespace)
        with self._lock:
            entry = self._entries[namespace].get(key)
            return entry.value if entry else None

    def delete(self, namespace: str, key: str) -> bool:
        """Delete an entry. Returns True if it existed."""
        self._validate_namespace(namespace)
        with self._lock:
            existed = key in self._entries[namespace]
            if existed:
                del self._entries[namespace][key]
                self._save()
            return existed
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
        namespace: Optional[str] = None,
        tags: Optional[List[str]] = None,
        top_k: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Simple keyword search over stored entries.

        For semantic vector search, connect Qdrant via the MCP gateway.
        """
        query_lower = query.lower()
        results: List[Dict[str, Any]] = []

        namespaces = [namespace] if namespace else list(self._entries.keys())

        with self._lock:
            for ns in namespaces:
                if ns not in self._entries:
                    continue
                for key, entry in self._entries[ns].items():
                    # Match on key, tags, or string-serialised value
                    value_str = str(entry.value).lower()
                    key_match = query_lower in key.lower()
                    value_match = query_lower in value_str
                    tag_match = tags and any(t in entry.tags for t in tags)

                    if key_match or value_match or tag_match:
                        results.append(entry.to_dict())

                    if len(results) >= top_k:
                        return results

        return results[:top_k]

    def list_entries(self, namespace: str) -> List[Dict[str, Any]]:
        """List all entries in a namespace."""
        self._validate_namespace(namespace)
        with self._lock:
            return [e.to_dict() for e in self._entries[namespace].values()]

    def list_namespaces(self) -> List[str]:
        """Return available namespaces."""
        return NAMESPACES.copy()

    def stats(self) -> Dict[str, Any]:
        """Return library statistics."""
        with self._lock:
            ns_counts = {ns: len(entries) for ns, entries in self._entries.items()}
            return {
                "total_entries": self._count(),
                "namespaces": ns_counts,
                "storage_path": str(self._storage_path),
            }

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _save(self) -> None:
        """Persist library to JSON file."""
        try:
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)
            data = {
                ns: {k: e.to_dict() for k, e in entries.items()}
                for ns, entries in self._entries.items()
            }
            with open(self._storage_path, "w") as fh:
                json.dump(data, fh, indent=2)
        except Exception as exc:  # noqa: BLE001
            logger.warning("[InfinityLibrary] Failed to save: %s", exc)

    def _load(self) -> None:
        """Load library from JSON file if it exists."""
        if not self._storage_path.exists():
            return
        try:
            with open(self._storage_path) as fh:
                data = json.load(fh)
            for ns, entries in data.items():
                if ns not in self._entries:
                    self._entries[ns] = {}
                for key, entry_data in entries.items():
                    self._entries[ns][key] = LibraryEntry.from_dict(entry_data)
        except Exception as exc:  # noqa: BLE001
            logger.warning("[InfinityLibrary] Failed to load from disk: %s", exc)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _validate_namespace(self, namespace: str) -> None:
        if namespace not in NAMESPACES:
            # Auto-create namespace rather than hard-fail
            if namespace not in self._entries:
                self._entries[namespace] = {}

    def _count(self) -> int:
        return sum(len(v) for v in self._entries.values())
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
