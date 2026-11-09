from __future__ import annotations
from pathlib import Path
import pytest
from catalog_worker.pdf_renderer import render_pdf, PDFRenderError
from catalog_worker.snapshot_validator import validate_snapshot, SnapshotValidationError
from catalog_worker.snapshot_builder import build_snapshot

def test_dedicated_cover_adds_page(tmp_path: Path):
    items = [{"name": "Pump", "description": "Test"}]
    snap = build_snapshot("PRODUCT_CATALOG", "Catalog", items)
    snap["dedicated_cover"] = True
    out = tmp_path / "cover.pdf"
    report = render_pdf(snap, out)
    assert report["page_count"] >= 2

def test_conflict_block_on_final(tmp_path: Path):
    items = [{"name": "X", "description": "d"}]
    snap = build_snapshot("TECHNICAL_DATASHEET", "T", items, document_status="FINAL")
    snap["conflicts"] = [{"normalized_key": "v"}]
    snap["block_on_conflict"] = True
    out = tmp_path / "blocked.pdf"
    with pytest.raises(PDFRenderError):
        render_pdf(snap, out)

def test_validator_rejects_empty():
    with pytest.raises(SnapshotValidationError):
        validate_snapshot({"snapshot_version": "1", "document_type": "PRODUCT_CATALOG", "items": []})

def test_validator_warns_on_conflicts():
    snap = build_snapshot("TECHNICAL_DATASHEET", "T", [{"name": "A", "description": "d"}])
    snap["conflicts"] = [{"k": "v"}]
    warnings = validate_snapshot(snap)
    assert any("conflicts" in w for w in warnings)
