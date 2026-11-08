from __future__ import annotations
import json
from pathlib import Path
import pytest
from catalog_worker.pdf_renderer import PDFRenderError, render_pdf, render_snapshot_file

def sample_snapshot():
    return {
        "snapshot_version": "1",
        "document_type": "TECHNICAL_DATASHEET",
        "title": "Synthetic Equipment Datasheet",
        "subtitle": "DEV validation only",
        "brand": {"palette": {"primary": "#123456", "text": "#222222"}, "fonts": {}},
        "paper": {"page": {"size": "A4", "orientation": "portrait", "margins_mm": {"top": 15, "right": 12, "bottom": 15, "left": 12}}, "background": {"color": "#FFFFFF"}},
        "export_profile": {"output_class": "DIGITAL_PDF", "minimum_dpi_warning": 120, "minimum_dpi_block": 72},
        "product": {"name": "Test Pump", "model_number": "TP-100", "description": "Synthetic product description.", "specifications": [{"key": "Power", "value": "5.5", "unit": "kW"}]},
        "contact": {"company_name": "DEV Test"}
    }

def test_renders_valid_pdf_and_preflight_report(tmp_path: Path):
    output = tmp_path / "datasheet.pdf"
    report = render_pdf(sample_snapshot(), output)
    assert output.read_bytes().startswith(b"%PDF-")
    assert report["page_count"] >= 1
    assert len(report["pdf_sha256"]) == 64
    assert report["print_ready_claimed"] is False

def test_blocks_print_ready_until_cmyk_pdfx_workflow_is_supported(tmp_path: Path):
    snap = sample_snapshot()
    snap["export_profile"]["output_class"] = "PRINT_READY_PDF"
    with pytest.raises(PDFRenderError, match="PRINT_READY_REQUIRES_VALIDATED_CMYK_WORKFLOW"):
        render_pdf(snap, tmp_path / "print.pdf")

def test_rejects_unknown_document_type(tmp_path: Path):
    snap = sample_snapshot()
    snap["document_type"] = "UNKNOWN"
    with pytest.raises(PDFRenderError, match="DOCUMENT_TYPE_UNSUPPORTED"):
        render_pdf(snap, tmp_path / "bad.pdf")

def test_snapshot_file_wrapper_writes_preflight_json(tmp_path: Path):
    snapshot = tmp_path / "snapshot.json"
    output = tmp_path / "out.pdf"
    report_file = tmp_path / "preflight.json"
    snapshot.write_text(json.dumps(sample_snapshot()), encoding="utf-8")
    result = render_snapshot_file(snapshot, output, report_path=report_file)
    assert report_file.exists()
    assert json.loads(report_file.read_text())["pdf_sha256"] == result["pdf_sha256"]
