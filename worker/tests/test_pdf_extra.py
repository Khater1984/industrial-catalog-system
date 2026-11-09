from __future__ import annotations
from pathlib import Path
import pytest
from catalog_worker.pdf_renderer import render_pdf, PDFRenderError, _safe_asset
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


def test_final_conflicts_are_blocked_even_without_opt_in_flag(tmp_path: Path):
    snap = build_snapshot("TECHNICAL_DATASHEET", "T", [{"name": "X", "description": "d"}], document_status="FINAL")
    snap["conflicts"] = [{"normalized_key": "voltage"}]
    snap.pop("block_on_conflict", None)
    with pytest.raises(PDFRenderError, match="CONFLICTS_BLOCK_FINAL_ISSUE"):
        render_pdf(snap, tmp_path / "must-not-exist.pdf")
    with pytest.raises(SnapshotValidationError, match="CONFLICTS_BLOCK_FINAL_ISSUE"):
        validate_snapshot(snap)


def test_relative_asset_path_resolves_against_asset_root(tmp_path: Path):
    asset_root = tmp_path / "assets"
    asset_root.mkdir()
    font = asset_root / "font.ttf"
    font.write_bytes(b"test")
    assert _safe_asset("font.ttf", asset_root) == font.resolve()


def test_asset_path_cannot_escape_asset_root(tmp_path: Path):
    asset_root = tmp_path / "assets"
    asset_root.mkdir()
    outside = tmp_path / "outside.png"
    outside.write_bytes(b"test")
    with pytest.raises(PDFRenderError, match="ASSET_PATH_OUTSIDE_ROOT"):
        _safe_asset("../outside.png", asset_root)
