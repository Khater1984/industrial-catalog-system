import json
import os
import socket
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


def _attempt_key(data: dict) -> str:
    import hashlib
    identity = "|".join([
        data["logical_job_id"], data["run_id"], str(data["attempt_number"]),
        data.get("parent_run_id") or "", data.get("retry_reason") or "", data["source_sha256"],
    ])
    return hashlib.sha256(identity.encode()).hexdigest()


def job_for(path: Path, **changes) -> dict:
    data = {
        "run_id": "run_v21_001", "logical_job_id": "logical_v21_001",
        "catalog_id": "catalog_v21_001", "source_pdf_path": str(path),
        "source_sha256": sha256_file(path), "attempt_number": 1,
    }
    data.update(changes)
    data["idempotency_key"] = _attempt_key(data)
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


def test_completed_run_replay_is_immutable_and_verifies_artifacts(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["One", "Two"])
    job, out = job_for(source), tmp_path / "out"
    first = process_resumable_catalog_job(job, out)
    manifest_path = out / "result-manifest.json"
    before = manifest_path.read_bytes()
    second = process_resumable_catalog_job(job, out)
    assert second == first
    assert manifest_path.read_bytes() == before


def test_running_run_resumes_existing_page_units(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["One", "Two"])
    job, out = job_for(source), tmp_path / "out"
    first = process_resumable_catalog_job(job, out)
    manifest_path = out / "result-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    from catalog_worker.resumable import _hash_payload
    manifest["run_status"] = "RUNNING"
    manifest["manifest_sha256"] = _hash_payload(manifest, "manifest_sha256")
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    resumed = process_resumable_catalog_job(job, out)
    assert resumed["run_status"] == "COMPLETED"
    assert resumed["newly_processed_units"] == 0
    assert resumed["reused_units"] == 2
    assert [p["run_unit_id"] for p in first["pages"]] == [p["run_unit_id"] for p in resumed["pages"]]


def test_terminal_run_cannot_be_reopened(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["One"])
    job, out = job_for(source), tmp_path / "out"
    process_resumable_catalog_job(job, out)
    manifest_path = out / "result-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    from catalog_worker.resumable import _hash_payload
    manifest["run_status"] = "FAILED"
    manifest["manifest_sha256"] = _hash_payload(manifest, "manifest_sha256")
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job, out)
    assert error.value.code == "TERMINAL_RUN_CANNOT_RESUME"


def test_canonical_json_normalizes_unicode_to_nfc():
    from catalog_worker.resumable import canonical_json_bytes
    assert canonical_json_bytes({"label": "é"}) == canonical_json_bytes({"label": "é"})


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
    missing_reason = job_for(source, run_id="run_v21_002", attempt_number=2, parent_run_id="run_v21_001")
    with pytest.raises(WorkerError) as missing:
        process_resumable_catalog_job(missing_reason, tmp_path / "missing-reason")
    assert missing.value.code == "INVALID_RUN_LINEAGE"
    result = process_resumable_catalog_job(
        job_for(source, run_id="run_v21_002", attempt_number=2,
                parent_run_id="run_v21_001", retry_reason="Transient worker interruption"),
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
    retry = process_resumable_catalog_job(
        job_for(source, run_id="run_v21_002", attempt_number=2,
                parent_run_id="run_v21_001", retry_reason="Retry test"),
        tmp_path / "retry",
    )
    assert retry["idempotency_key"] != a["idempotency_key"]
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(dict(job, idempotency_key="random"), tmp_path / "c")
    assert error.value.code == "IDEMPOTENCY_KEY_MISMATCH"



def test_cross_run_reuse_creates_new_unit_and_links_source(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Page one", "Page two"])
    first_job = job_for(source)
    source_dir = tmp_path / "first-run"
    first = process_resumable_catalog_job(first_job, source_dir)

    second_job = job_for(
        source,
        run_id="run_v21_002",
        attempt_number=2,
        parent_run_id="run_v21_001",
        retry_reason="Worker retry after transient failure",
        reuse_from_run_dir=str(source_dir),
    )
    second_dir = tmp_path / "second-run"
    second = process_resumable_catalog_job(second_job, second_dir)

    assert second["run_status"] == "COMPLETED"
    assert second["reused_units"] == 2
    assert second["newly_processed_units"] == 0
    for old, new in zip(first["pages"], second["pages"]):
        assert old["run_unit_id"] != new["run_unit_id"]
        assert new["unit_status"] == "REUSED"
        assert new["reused_from_run_unit_id"] == old["run_unit_id"]
    # The prior run's immutable artifacts remain byte-for-byte untouched.
    old_page = source_dir / "pages/page-00001.json"
    assert json.loads(old_page.read_text())["run_id"] == "run_v21_001"


def test_idempotency_key_is_unique_per_attempt(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Attempt key"])
    first = process_resumable_catalog_job(job_for(source), tmp_path / "attempt-1")
    second = process_resumable_catalog_job(
        job_for(source, run_id="run_v21_002", attempt_number=2,
                parent_run_id="run_v21_001", retry_reason="Retry"),
        tmp_path / "attempt-2",
    )
    assert first["idempotency_key"] != second["idempotency_key"]



def test_cross_job_reuse_is_rejected(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Catalog data"])
    source_dir = tmp_path / "source-run"
    process_resumable_catalog_job(job_for(source), source_dir)
    different_job = job_for(
        source,
        run_id="run_other_job",
        logical_job_id="different_logical_job",
        reuse_from_run_dir=str(source_dir),
    )
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(different_job, tmp_path / "different-run")
    assert error.value.code == "REUSE_LOGICAL_JOB_MISMATCH"


def test_corrupt_source_artifact_cannot_be_reused(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Catalog data"])
    source_dir = tmp_path / "source-run"
    process_resumable_catalog_job(job_for(source), source_dir)
    source_page = source_dir / "pages/page-00001.json"
    page = json.loads(source_page.read_text())
    page["extracted_text"] = "tampered source text"
    source_page.write_text(json.dumps(page), encoding="utf-8")

    retry = job_for(
        source,
        run_id="run_v21_retry",
        attempt_number=2,
        parent_run_id="run_v21_001",
        retry_reason="Retry after interrupted attempt",
        reuse_from_run_dir=str(source_dir),
    )
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(retry, tmp_path / "retry-run")
    assert error.value.code == "REUSE_SOURCE_CORRUPT"



def test_same_run_cannot_change_attempt_lineage(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Lineage"])
    first = process_resumable_catalog_job(job_for(source), tmp_path / "parent")
    retry_job = job_for(
        source,
        run_id="run_v21_002",
        attempt_number=2,
        parent_run_id="run_v21_001",
        retry_reason="Original retry reason",
    )
    out = tmp_path / "retry"
    process_resumable_catalog_job(retry_job, out)
    changed = dict(retry_job, retry_reason="Changed retry reason")
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(changed, out)
    assert error.value.code == "IDEMPOTENCY_KEY_MISMATCH"


def test_catalog_page_ids_become_stable_unit_keys(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Page A", "Page B"])
    ids = ["catalog_page_A001", "catalog_page_A002"]
    result = process_resumable_catalog_job(job_for(source, catalog_page_ids=ids), tmp_path / "out")
    assert [page["unit_key"] for page in result["pages"]] == ids
    assert [page["catalog_page_id"] for page in result["pages"]] == ids
    first_artifact = json.loads((tmp_path / "out/pages/page-00001.json").read_text())
    assert first_artifact["catalog_page_id"] == ids[0]


def test_catalog_page_ids_must_match_page_count_and_be_unique(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Page A", "Page B"])
    for ids in (["only-one"], ["duplicate", "duplicate"], ["", "second"]):
        with pytest.raises(WorkerError) as error:
            process_resumable_catalog_job(job_for(source, catalog_page_ids=ids), tmp_path / "out")
        assert error.value.code == "INVALID_CATALOG_PAGE_IDS"


def test_cross_run_reuse_creates_new_unit_and_preserves_source_artifact(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Reusable page", "Second page"])
    source_job = job_for(source, catalog_page_ids=["page-id-1", "page-id-2"])
    source_dir = tmp_path / "source-run"
    original = process_resumable_catalog_job(source_job, source_dir)
    original_artifact = source_dir / "pages/page-00001.json"
    original_bytes = original_artifact.read_bytes()

    retry_job = job_for(
        source, run_id="run_v21_002", attempt_number=2,
        parent_run_id="run_v21_001", retry_reason="Reprocess after interrupted delivery",
        catalog_page_ids=["page-id-1", "page-id-2"],
        reuse_from_run_dir=str(source_dir),
    )
    reused = process_resumable_catalog_job(retry_job, tmp_path / "retry-run")
    first_new_page = json.loads((tmp_path / "retry-run/pages/page-00001.json").read_text())

    assert reused["run_id"] != original["run_id"]
    assert reused["reused_units"] == 2
    assert reused["newly_processed_units"] == 0
    assert reused["pages"][0]["run_unit_id"] != original["pages"][0]["run_unit_id"]
    assert first_new_page["unit_status"] == "REUSED"
    assert first_new_page["reused_from_run_unit_id"] == original["pages"][0]["run_unit_id"]
    assert original_artifact.read_bytes() == original_bytes


def test_cross_run_reuse_rejects_different_logical_job(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Not reusable"])
    source_dir = tmp_path / "source-run"
    process_resumable_catalog_job(job_for(source), source_dir)
    retry = job_for(
        source, run_id="run_v21_002", logical_job_id="another-logical-job",
        attempt_number=2, parent_run_id="run_v21_001", retry_reason="Test",
        reuse_from_run_dir=str(source_dir),
    )
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(retry, tmp_path / "retry-run")
    assert error.value.code == "REUSE_LOGICAL_JOB_MISMATCH"



def test_abandoned_same_host_lock_is_reclaimed(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Recover"])
    out = tmp_path / "out"
    lock = out / ".worker.lock"
    lock.mkdir(parents=True)
    (lock / "owner.json").write_text(json.dumps({
        "pid": 2147483647, "host": socket.gethostname(), "at": "2026-01-01T00:00:00+00:00"
    }))
    result = process_resumable_catalog_job(job_for(source), out)
    assert result["run_status"] == "COMPLETED"
    assert not lock.exists()


def test_live_lock_is_not_stolen(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Do not steal"])
    out = tmp_path / "out"
    lock = out / ".worker.lock"
    lock.mkdir(parents=True)
    (lock / "owner.json").write_text(json.dumps({
        "pid": os.getpid(), "host": socket.gethostname(), "at": "2026-11-03T00:00:00+00:00"
    }))
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job_for(source), out)
    assert error.value.code == "RUN_LOCKED"


def test_unverifiable_lock_fails_closed(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Fail closed"])
    out = tmp_path / "out"
    lock = out / ".worker.lock"
    lock.mkdir(parents=True)
    (lock / "owner.json").write_text("{not-json")
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(job_for(source), out)
    assert error.value.code == "RUN_LOCK_UNVERIFIABLE"
    assert lock.exists()


def test_cross_run_reuse_must_use_immediate_parent_attempt(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Page one"])
    source_dir = tmp_path / "attempt-1"
    process_resumable_catalog_job(job_for(source), source_dir)
    wrong_parent = job_for(
        source, run_id="run_v21_003", attempt_number=3,
        parent_run_id="run_v21_002", retry_reason="Retry attempt three",
        reuse_from_run_dir=str(source_dir),
    )
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(wrong_parent, tmp_path / "attempt-3")
    assert error.value.code == "REUSE_SOURCE_NOT_PARENT"


def test_parent_run_id_must_be_safe_identifier(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Lineage"])
    bad = job_for(
        source, run_id="run_v21_002", attempt_number=2,
        parent_run_id="../outside", retry_reason="Invalid parent",
    )
    with pytest.raises(WorkerError) as error:
        process_resumable_catalog_job(bad, tmp_path / "out")
    assert error.value.code == "INVALID_JOB_MANIFEST"



def test_artifact_callback_publishes_each_verified_page_checkpoint(tmp_path):
    source = tmp_path / "catalog.pdf"
    make_pdf(source, ["Checkpoint one", "Checkpoint two", "Checkpoint three"])
    published = []

    def publish(page, artifact_path):
        assert artifact_path.is_file()
        artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
        assert artifact["run_unit_id"] == page["run_unit_id"]
        published.append((page["page_number"], artifact_path.name))

    result = process_resumable_catalog_job(
        job_for(source), tmp_path / "checkpoint-run", artifact_callback=publish
    )
    assert result["run_status"] == "COMPLETED"
    assert published == [
        (1, "page-00001.json"),
        (2, "page-00002.json"),
        (3, "page-00003.json"),
    ]
