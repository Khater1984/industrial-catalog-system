"""Validate issue snapshots before rendering."""
from __future__ import annotations
from typing import Any

class SnapshotValidationError(ValueError):
    pass

def validate_snapshot(snapshot: dict[str, Any]) -> list[str]:
    """Return list of warnings. Raise on hard errors."""
    warnings: list[str] = []
    if not isinstance(snapshot, dict):
        raise SnapshotValidationError("SNAPSHOT_NOT_OBJECT")
    if snapshot.get("snapshot_version") != "1":
        raise SnapshotValidationError("SNAPSHOT_VERSION_UNSUPPORTED")
    doc_type = snapshot.get("document_type")
    if doc_type not in {"TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG", "COMPANY_PROFILE"}:
        raise SnapshotValidationError("DOCUMENT_TYPE_UNSUPPORTED")
    items = snapshot.get("items")
    if not isinstance(items, list) or not items:
        raise SnapshotValidationError("ISSUE_SCOPE_EMPTY")
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            raise SnapshotValidationError(f"ITEM_{i}_NOT_OBJECT")
        if not (item.get("name") or item.get("name_ar") or item.get("description") or item.get("specifications") or item.get("images")):
            warnings.append(f"Item {i} has minimal content.")
    is_final = str(snapshot.get("document_status") or "ORIGINAL").upper() == "FINAL"
    if is_final and any(item.get("validation_errors") for item in items):
        raise SnapshotValidationError("SPECIFICATION_VALIDATION_ERRORS_BLOCK_FINAL")
    conflicts = snapshot.get("conflicts") or []
    if conflicts and str(snapshot.get("document_status") or "ORIGINAL").upper() == "FINAL":
        raise SnapshotValidationError("CONFLICTS_BLOCK_FINAL_ISSUE")
    if conflicts:
        warnings.append(f"{len(conflicts)} ADR-040 conflicts present.")
    return warnings
