from __future__ import annotations
from pathlib import Path
from catalog_worker.pdf_renderer import render_pdf
from catalog_worker.snapshot_builder import build_snapshot

def test_family_grouping_master_catalog(tmp_path: Path):
    items = [
        {"name": "Pump A", "family": "Pumps", "description": "A"},
        {"name": "Pump B", "family": "Pumps", "description": "B"},
        {"name": "Valve X", "family": "Valves", "description": "X"},
    ]
    snap = build_snapshot("MASTER_CATALOG", "Master", items, group_by_family=True)
    out = tmp_path / "fam.pdf"
    report = render_pdf(snap, out)
    assert report["page_count"] >= 2
    assert report["items_rendered"] == 3

def test_provenance_column(tmp_path: Path):
    items = [{"name": "T", "specifications": [{"key": "V", "value": "220", "unit": "V", "provenance": "SOURCE"}]}]
    snap = build_snapshot("TECHNICAL_DATASHEET", "TDS", items, show_provenance=True)
    out = tmp_path / "prov.pdf"
    report = render_pdf(snap, out)
    assert report["page_count"] >= 1

def test_exclude_unpublished(tmp_path: Path):
    items = [
        {"name": "Public", "description": "ok", "publishable": True},
        {"name": "Hidden", "description": "no", "publishable": False},
    ]
    snap = build_snapshot("PRODUCT_CATALOG", "Cat", items, exclude_unpublished=True)
    out = tmp_path / "filt.pdf"
    report = render_pdf(snap, out)
    assert report["items_rendered"] == 1

def test_revision_and_date_in_report(tmp_path: Path):
    items = [{"name": "X", "description": "d"}]
    snap = build_snapshot("TECHNICAL_DATASHEET", "T", items, revision="2.1", issue_date="2026-11-09", document_status="FINAL")
    out = tmp_path / "rev.pdf"
    report = render_pdf(snap, out)
    assert report["revision"] == "2.1"
    assert report["issue_date"] == "2026-11-09"
    assert report["document_status"] == "FINAL"
