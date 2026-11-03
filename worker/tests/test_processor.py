import json
from pathlib import Path

import pytest
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

from catalog_worker.processor import WorkerError, process_catalog_job, sha256_file


def make_pdf(path: Path, pages: list[str]) -> None:
    pdf = canvas.Canvas(str(path))
    for text in pages:
        pdf.drawString(72, 720, text)
        pdf.showPage()
    pdf.save()


def make_job(pdf_path: Path) -> dict:
    return {
        "protocol_version": "1",
        "run_id": "run_test_001",
        "logical_job_id": "job_test_001",
        "catalog_id": "cat_test_001",
        "source_pdf_path": str(pdf_path),
        "source_sha256": sha256_file(pdf_path),
    }


def test_extracts_each_page_and_writes_manifest(tmp_path: Path):
    pdf = tmp_path / "catalog.pdf"
    make_pdf(pdf, ["Hydraulic Pump Model HP-10", "Motor power 5.5 kW"])
    result = process_catalog_job(make_job(pdf), tmp_path / "out")

    assert result["run_status"] == "COMPLETED"
    assert result["page_count"] == 2
    assert result["completed_units"] == 2
    assert result["newly_processed_units"] == 2
    assert result["reused_units"] == 0

    first = json.loads((tmp_path / "out/pages/page-00001.json").read_text())
    second = json.loads((tmp_path / "out/pages/page-00002.json").read_text())
    assert "Hydraulic Pump Model HP-10" in first["extracted_text"]
    assert "Motor power 5.5 kW" in second["extracted_text"]
    assert first["unit_type"] == "CATALOG_PAGE"
    assert first["input_sha256"]
    assert first["output_sha256"]

    saved_manifest = json.loads((tmp_path / "out/result-manifest.json").read_text())
    assert saved_manifest["manifest_sha256"] == result["manifest_sha256"]


def test_rerun_reuses_verified_page_checkpoints(tmp_path: Path):
    pdf = tmp_path / "catalog.pdf"
    make_pdf(pdf, ["Page one", "Page two"])
    job = make_job(pdf)
    out = tmp_path / "out"

    first = process_catalog_job(job, out)
    second = process_catalog_job(job, out)

    assert first["newly_processed_units"] == 2
    assert second["newly_processed_units"] == 0
    assert second["reused_units"] == 2
    assert all(page["unit_status"] == "REUSED" for page in second["pages"])


def test_rejects_source_hash_mismatch(tmp_path: Path):
    pdf = tmp_path / "catalog.pdf"
    make_pdf(pdf, ["Valid PDF"])
    job = make_job(pdf)
    job["source_sha256"] = "0" * 64

    with pytest.raises(WorkerError, match="does not match") as error:
        process_catalog_job(job, tmp_path / "out")
    assert error.value.code == "SOURCE_HASH_MISMATCH"


def test_rejects_non_pdf_input(tmp_path: Path):
    source = tmp_path / "not-a-pdf.pdf"
    source.write_text("not a PDF")
    job = make_job(source)

    with pytest.raises(WorkerError) as error:
        process_catalog_job(job, tmp_path / "out")
    assert error.value.code == "INVALID_PDF_SIGNATURE"


def test_rejects_encrypted_pdf(tmp_path: Path):
    source = tmp_path / "plain.pdf"
    make_pdf(source, ["Secret page"])
    reader = PdfReader(str(source))
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt("test-password")
    encrypted = tmp_path / "encrypted.pdf"
    with encrypted.open("wb") as stream:
        writer.write(stream)

    with pytest.raises(WorkerError) as error:
        process_catalog_job(make_job(encrypted), tmp_path / "out")
    assert error.value.code == "PDF_ENCRYPTED"


def test_detects_corrupt_existing_checkpoint(tmp_path: Path):
    pdf = tmp_path / "catalog.pdf"
    make_pdf(pdf, ["Page one"])
    out = tmp_path / "out"
    process_catalog_job(make_job(pdf), out)

    checkpoint = out / "pages/page-00001.json"
    payload = json.loads(checkpoint.read_text())
    payload["extracted_text"] = "tampered"
    checkpoint.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(WorkerError) as error:
        process_catalog_job(make_job(pdf), out)
    assert error.value.code == "CHECKPOINT_OUTPUT_CORRUPT"
