from __future__ import annotations
from pathlib import Path
from pypdf import PdfReader
from catalog_worker.pdf_renderer import render_pdf
from catalog_worker.snapshot_builder import build_snapshot

def _extract_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)

def test_technical_data_sheet_contains_specs(tmp_path: Path):
    items = [{
        "name": "Centrifugal Pump",
        "name_ar": "مضخة طرد مركزي",
        "description": "High efficiency pump",
        "specifications": [
            {"key": "Power", "value": "5.5", "unit": "kW"},
            {"key": "Voltage", "value": "380", "unit": "V"},
        ],
    }]
    snap = build_snapshot("TECHNICAL_DATASHEET", "Pump TDS", items)
    out = tmp_path / "tds.pdf"
    report = render_pdf(snap, out)
    assert report["page_count"] >= 1
    text = _extract_text(out)
    assert "Pump" in text or "5.5" in text or "kW" in text
    assert out.read_bytes().startswith(b"%PDF-")

def test_product_catalog_multi_item_pages(tmp_path: Path):
    items = [
        {"name": "Pump A", "description": "First", "family": "Pumps"},
        {"name": "Pump B", "description": "Second", "family": "Pumps"},
        {"name": "Valve X", "description": "Third", "family": "Valves"},
    ]
    snap = build_snapshot("PRODUCT_CATALOG", "Catalog", items, include_index=True)
    out = tmp_path / "cat.pdf"
    report = render_pdf(snap, out)
    assert report["page_count"] >= 2
    assert report["items_rendered"] == 3

def test_master_catalog_family_grouping(tmp_path: Path):
    items = [
        {"name": "A1", "family": "FamilyA", "description": "d"},
        {"name": "B1", "family": "FamilyB", "description": "d"},
    ]
    snap = build_snapshot("MASTER_CATALOG", "Master", items, group_by_family=True)
    out = tmp_path / "master.pdf"
    report = render_pdf(snap, out)
    assert report["page_count"] >= 2

def test_exclude_unpublished(tmp_path: Path):
    items = [
        {"name": "Visible", "description": "ok", "publishable": True},
        {"name": "Hidden", "description": "no", "publishable": False},
    ]
    snap = build_snapshot("PRODUCT_CATALOG", "Cat", items, exclude_unpublished=True)
    out = tmp_path / "filt.pdf"
    report = render_pdf(snap, out)
    assert report["items_rendered"] == 1

def test_arabic_text_does_not_crash(tmp_path: Path):
    items = [{"name_ar": "منتج عربي", "description_ar": "وصف مختصر"}]
    snap = build_snapshot("TECHNICAL_DATASHEET", "ورقة بيانات", items)
    out = tmp_path / "ar.pdf"
    report = render_pdf(snap, out)
    assert report["page_count"] >= 1
    assert out.exists()
