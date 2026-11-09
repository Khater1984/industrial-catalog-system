from __future__ import annotations
from pathlib import Path
import pytest
from catalog_worker.pdf_renderer import render_pdf, PDFRenderError
from catalog_worker.snapshot_builder import build_snapshot

def test_snapshot_builder_creates_valid_structure():
    items = [{"name": "Pump", "specifications": [{"key": "Power", "value": "5", "unit": "kW"}]}]
    snap = build_snapshot("TECHNICAL_DATASHEET", "Test", items)
    assert snap["snapshot_version"] == "1"
    assert snap["document_type"] == "TECHNICAL_DATASHEET"
    assert len(snap["items"]) == 1

def test_catalog_with_index_generates_extra_pages(tmp_path: Path):
    items = [
        {"name": "A", "description": "First"},
        {"name": "B", "description": "Second"},
        {"name": "C", "description": "Third"},
    ]
    snap = build_snapshot("PRODUCT_CATALOG", "Catalog", items, include_index=True)
    out = tmp_path / "idx.pdf"
    report = render_pdf(snap, out)
    assert report["page_count"] >= 3
    assert out.read_bytes().startswith(b"%PDF-")

def test_conflicts_appear_in_warnings(tmp_path: Path):
    items = [{"name": "X", "specifications": [{"key": "V", "value": "220", "unit": "V"}]}]
    snap = build_snapshot("TECHNICAL_DATASHEET", "TDS", items, conflicts=[{"normalized_key": "voltage"}])
    out = tmp_path / "c.pdf"
    report = render_pdf(snap, out)
    assert report["conflicts_noted"] == 1
    assert any("ADR-040" in w for w in report["warnings"])

def test_builder_rejects_empty():
    with pytest.raises(ValueError):
        build_snapshot("PRODUCT_CATALOG", "X", [])
