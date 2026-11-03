import json
from pathlib import Path

import pytest
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

from catalog_worker.resumable import WorkerError, process_resumable_catalog_job, sha256_file


def make_pdf(path: Path, pages: list[str]) -> None:
    pdf = canvas.Canvas(str(path))
    for text in pages:
        pdf.drawString(72, 720, text)
        pdf.showPage()
    pdf.save()


def job_for(path: Path, **changes) -> dict:
    data = {
        "run_id": "run_v21_001", "logical_job_id": "logical_v21_001",
        "catalog_id": "catalog_v21_001", "source_pdf_path": str(path),
        "source_sha256": sha256_file(path), "attempt_number": 1,
    }
    data.update(changes)
    return data


def test_extracts_pages_and_writes_manifest(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Pump HP-10", "Motor 5.5 kW"])
    result = process_resumable_catalog_job(job_for(source), tmp_path / "out")
    assert result["run_type"] == "CATALOG_EXTRACTION"
    assert result["run_status"] == "COMPLETED"
    assert result["completed_units"] == result["page_count"] == 2
    assert result["newly_processed_units"] == 2
    page = json.loads((tmp_path / "out/pages/page-00001.json").read_text())
    assert page["unit_type"] == "CATALOG_PAGE"
    assert "Pump HP-10" in page["extracted_text"]


def test_same_run_resume_preserves_unit_ids_and_artifacts(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["One", "Two"])
    job = job_for(source)
    first = process_resumable_catalog_job(job, tmp_path / "out")
    second = process_resumable_catalog_job(job, tmp_path / "out")
    assert [p["run_unit_id"] for p in first["pages"]] == [p["run_unit_id"] for p in second["pages"]]
    assert second["newly_processed_units"] == 0
    assert second["reused_units"] == 2


def test_changed_input_cannot_resume_same_logical_job(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Original"])
    job = job_for(source)
    process_resumable_catalog_job(job, tmp_path / "out")
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(dict(job, extraction_profile="changed"), tmp_path / "out")
    assert error.value.code == "JOB_INPUT_MISMATCH"


def test_corrupt_artifact_is_rejected_not_overwritten(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Original"])
    out = tmp_path / "out"
    process_resumable_catalog_job(job_for(source), out)
    path = out / "pages/page-00001.json"
    payload = json.loads(path.read_text())
    payload["extracted_text"] = "tampered"
    path.write_text(json.dumps(payload))
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job_for(source), out)
    assert error.value.code == "CHECKPOINT_OUTPUT_CORRUPT"


def test_manifest_checksum_is_verified(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Original"])
    out = tmp_path / "out"
    process_resumable_catalog_job(job_for(source), out)
    path = out / "result-manifest.json"
    manifest = json.loads(path.read_text())
    manifest["completed_units"] = 999
    path.write_text(json.dumps(manifest))
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job_for(source), out)
    assert error.value.code == "RESULT_MANIFEST_CORRUPT"


def test_retry_requires_new_run_and_parent(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Retry"])
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job_for(source, attempt_number=2), tmp_path / "bad")
    assert error.value.code == "INVALID_RUN_LINEAGE"
    result = process_resumable_catalog_job(
        job_for(source, run_id="run_v21_002", attempt_number=2, parent_run_id="run_v21_001"),
        tmp_path / "retry",
    )
    assert result["parent_run_id"] == "run_v21_001"


@pytest.mark.parametrize("field,value", [
    ("run_id", "../escape"), ("logical_job_id", ".."), ("catalog_id", "x/y")
])
def test_identifiers_cannot_escape_output_tree(tmp_path, field, value):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Safe"])
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job_for(source, **{field: value}), tmp_path / "out")
    assert error.value.code == "INVALID_JOB_MANIFEST"


def test_rejects_hash_mismatch(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Hash"])
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job_for(source, source_sha256="0" * 64), tmp_path / "out")
    assert error.value.code == "SOURCE_HASH_MISMATCH"


def test_rejects_encrypted_pdf(tmp_path):
    plain = tmp_path / "plain.pdf"
    make_pdf(plain, ["Secret"])
    reader, writer = PdfReader(str(plain)), PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt("password")
    encrypted = tmp_path / "encrypted.pdf"
    with encrypted.open("wb") as stream:
        writer.write(stream)
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job_for(encrypted), tmp_path / "out")
    assert error.value.code == "PDF_ENCRYPTED"


def test_deterministic_idempotency_key(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Key"])
    job = job_for(source)
    a = process_resumable_catalog_job(job, tmp_path / "a")
    b = process_resumable_catalog_job(job, tmp_path / "b")
    assert a["idempotency_key"] == b["idempotency_key"]
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(dict(job, idempotency_key="random"), tmp_path / "c")
    assert error.value.code == "IDEMPOTENCY_KEY_MISMATCH"
