from __future__ import annotations
import json
from pathlib import Path
import pytest
from catalog_worker.pdf_renderer import PDFRenderError, render_pdf

def base_snapshot(**overrides):
    snap = {
        "snapshot_version": "1",
        "document_type": "PRODUCT_CATALOG",
        "title": "Synthetic Catalog",
        "subtitle": "Phase 6 validation",
        "brand": {"palette": {"primary": "#0A3D62", "text": "#1A1A1A"}, "fonts": {}},
        "paper": {"page": {"size": "A4", "orientation": "portrait", "margins_mm": {"top": 16, "right": 12, "bottom": 16, "left": 12}}, "background": {"color": "#FFFFFF"}},
        "export_profile": {"output_class": "DIGITAL_PDF", "minimum_dpi_warning": 100, "minimum_dpi_block": 60},
        "items": [
            {
                "name": "Pump A",
                "name_ar": "مضخة أ",
                "model_number": "PA-01",
                "description": "English description.",
                "description_ar": "وصف عربي للمنتج.",
                "specifications": [
                    {"key": "Power", "label_ar": "القدرة", "value": "5.5", "value_ar": "5.5", "unit": "kW"},
                    {"key": "Voltage", "label_ar": "الجهد", "value": "380", "unit": "V"}
                ]
            },
            {
                "name": "Pump B",
                "model_number": "PB-02",
                "description": "Second product.",
                "specifications": [{"key": "Flow", "value": "100", "unit": "m3/h"}]
            }
        ],
        "contact": {"company_name": "DEV Test Co", "phone": "+966-11-0000000"}
    }
    snap.update(overrides)
    return snap

def test_product_catalog_generates_multiple_pages(tmp_path: Path):
    output = tmp_path / "catalog.pdf"
    report = render_pdf(base_snapshot(), output)
    assert output.read_bytes().startswith(b"%PDF-")
    assert report["page_count"] >= 2
    assert report["document_type"] == "PRODUCT_CATALOG"

def test_technical_datasheet_single_item(tmp_path: Path):
    snap = base_snapshot(document_type="TECHNICAL_DATASHEET")
    snap["items"] = [snap["items"][0]]
    output = tmp_path / "tds.pdf"
    report = render_pdf(snap, output)
    assert report["page_count"] >= 1
    assert report["document_type"] == "TECHNICAL_DATASHEET"

def test_master_catalog_multiple_items(tmp_path: Path):
    snap = base_snapshot(document_type="MASTER_CATALOG")
    output = tmp_path / "master.pdf"
    report = render_pdf(snap, output)
    assert report["page_count"] >= 2

def test_arabic_text_does_not_crash(tmp_path: Path):
    snap = base_snapshot()
    output = tmp_path / "arabic.pdf"
    report = render_pdf(snap, output)
    assert output.exists()
    assert report["pdf_sha256"]

def test_rejects_print_ready(tmp_path: Path):
    snap = base_snapshot()
    snap["export_profile"]["output_class"] = "PRINT_READY_PDF"
    with pytest.raises(PDFRenderError):
        render_pdf(snap, tmp_path / "x.pdf")

def test_rejects_empty_scope(tmp_path: Path):
    snap = base_snapshot(items=[])
    with pytest.raises(PDFRenderError):
        render_pdf(snap, tmp_path / "empty.pdf")

def test_snapshot_file_roundtrip(tmp_path: Path):
    from catalog_worker.pdf_renderer import render_snapshot_file
    snap = base_snapshot()
    snap_path = tmp_path / "snap.json"
    snap_path.write_text(json.dumps(snap, ensure_ascii=False), encoding="utf-8")
    out = tmp_path / "out.pdf"
    report_path = tmp_path / "report.json"
    result = render_snapshot_file(snap_path, out, report_path=report_path)
    assert out.exists()
    assert report_path.exists()
    assert result["pdf_sha256"] == json.loads(report_path.read_text())["pdf_sha256"]
