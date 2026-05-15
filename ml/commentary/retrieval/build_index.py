"""Lightweight retrieval index scaffold.

This module is intentionally provider-agnostic and can be wired to
sentence-transformers + FAISS in production environments.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RetrievalRecord:
    id: str
    text: str
    tags: list[str]


def build_index(records: list[RetrievalRecord]) -> dict:
    return {
        "size": len(records),
        "records": [record.__dict__ for record in records],
        "backend": "lightweight-inmemory",
    }
