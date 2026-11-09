"""Build immutable issue snapshots from resolved domain data.

Does not call Google services. Pure data transformation for the PDF renderer.
"""
from __future__ import annotations
from typing import Any


def build_snapshot(
    document_type: str,
    title: str,
    items: list[dict[str, Any]],
    *,
    subtitle: str = "",
    brand: dict[str, Any] | None = None,
    paper: dict[str, Any] | None = None,
    export_profile: dict[str, Any] | None = None,
    contact: dict[str, Any] | None = None,
    conflicts: list[dict[str, Any]] | None = None,
    include_cover: bool | None = None,
    include_index: bool | None = None,
) -> dict[str, Any]:
    """Construct a version-1 issue snapshot."""
    if document_type not in {"TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG", "COMPANY_PROFILE"}:
        raise ValueError("DOCUMENT_TYPE_UNSUPPORTED")
    if not items:
        raise ValueError("ISSUE_SCOPE_EMPTY")
    snap: dict[str, Any] = {
        "snapshot_version": "1",
        "document_type": document_type,
        "title": title,
        "subtitle": subtitle,
        "items": items,
        "brand": brand or {"palette": {"primary": "#173F5F", "text": "#17212B"}},
        "paper": paper or {"page": {"size": "A4", "orientation": "portrait", "margins_mm": {"top": 18, "right": 12, "bottom": 16, "left": 12}}, "background": {"color": "#FFFFFF"}},
        "export_profile": export_profile or {"output_class": "DIGITAL_PDF", "minimum_dpi_warning": 150, "minimum_dpi_block": 72},
        "contact": contact or {},
        "conflicts": conflicts or [],
    }
    if include_cover is not None:
        snap["include_cover"] = include_cover
    if include_index is not None:
        snap["include_index"] = include_index
    return snap
