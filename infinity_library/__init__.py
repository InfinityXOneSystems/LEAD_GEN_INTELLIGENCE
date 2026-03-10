"""
infinity_library
================
Persistent knowledge repository for the XPS Intelligence platform.

Stores scraped intelligence, invention ideas, research insights,
experiment results, and generated documents with keyword search
and structured metadata support.
"""
from __future__ import annotations

from .library import InfinityLibrary
from .experiment_tracker import ExperimentTracker
from .knowledge_graph import KnowledgeGraph

__all__ = ["InfinityLibrary", "ExperimentTracker", "KnowledgeGraph"]
