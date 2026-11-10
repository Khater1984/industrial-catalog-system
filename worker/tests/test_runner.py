import hashlib
import json
from io import BytesIO
from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from catalog_worker import runner


class FakeDrive:
    def __init__(self, job, pdf_bytes):
        self.job = job
        self.pdf_bytes = pdf_bytes
        self.files = {}
        self.next_id = 0
        self.run_folder = "folder-run"

    def download(self, file_id, destination):
        path = Path(destination)
        path.parent.mkdir(parents=True, exist_ok=True)
        if file_id == "job-file-id-123456":
            path.write_text(json.dumps(self.job), encoding="utf-8")
        elif file_id == "source-pdf":
            path.write_bytes(self.pdf_bytes)
        else:
            path.write_bytes(self.files[file_id]["content"])
        return path

    def metadata(self, file_id):
        return {"id": file_id, "parents": [self.run_folder]}

    def list_children(self, parent_id):
        return [
            {"id": file_id, "name": value["name"]}
            for file_id, value in self.files.items()
        ]

    def upload_file(self, parent_id, name, path, mime_type):
        return self.upload_bytes(parent_id, name, Path(path).read_bytes(), mime_type)

    def upload_bytes(self, parent_id, name, content, mime_type, immutable=True):
        file_id, digest, _ = self.upload_bytes_with_status(
            parent_id, name, content, mime_type, immutable=immutable
        )
        return file_id, digest

    def upload_bytes_with_status(self, parent_id, name, content, mime_type, immutable=True):
        digest = hashlib.sha256(content).hexdigest()
        for file_id, value in self.files.items():
            if value["name"] == name:
                assert value["content"] == content
                return file_id, digest, "REUSED"
        self.next_id += 1
        file_id = f"drive-file-{self.next_id}"
        self.files[file_id] = {"name": name, "content": content, "mime_type": mime_type}
        return file_id, digest, "UPLOADED"


def idempotency_key(run_id, logical_job_id, source_sha, attempt=1, parent=None, retry=None):
    identity = "|".join([logical_job_id, run_id, str(attempt), parent or "", retry or "", source_sha])
    return hashlib.sha256(identity.encode()).hexdigest()


def make_pdf(path):
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(output))
    pdf.drawString(72, 720, "Industrial catalog page one")
    pdf.showPage()
    pdf.save()
    return output.read_bytes()


def make_pdf_with_image(path):
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    image = BytesIO()
    Image.new("RGB", (4, 3), (30, 90, 160)).save(image, format="PNG")
    image.seek(0)
    pdf = canvas.Canvas(str(output))
    pdf.drawImage(ImageReader(image), 72, 700, width=40, height=30)
    pdf.showPage()
    pdf.save()
    return output.read_bytes()


def test_drive_runner_processes_and_uploads_immutable_artifacts(tmp_path):
    pdf_bytes = make_pdf(tmp_path / "source.pdf")
    source_sha = hashlib.sha256(pdf_bytes).hexdigest()
    job = {
        "contract_version": "1",
        "run_id": "run_test_001",
        "logical_job_id": "job_test_001",
        "catalog_id": "cat_test_001",
        "source_pdf_file_id": "source-pdf",
        "source_sha256": source_sha,
        "idempotency_key": idempotency_key("run_test_001", "job_test_001", source_sha),
        "attempt_number": 1,
        "run_folder_id": "folder-run",
        "extraction_profile": "embedded-text-v1",
    }
    drive = FakeDrive(job, pdf_bytes)
    result = runner.run_from_drive(
        job_file_id="job-file-id-123456", drive=drive, output_root=tmp_path / "work",
    )

    assert result["accepted"] is True
    assert result["run_status"] == "COMPLETED"
    manifest_id = result["result_manifest_file_id"]
    manifest = json.loads(drive.files[manifest_id]["content"])
    assert manifest["manifest_version"] == 2
    assert manifest["manifest_sha256"]
    assert len(manifest["pages"]) == 1
    page = manifest["pages"][0]
    assert page["artifact_file_id"] in drive.files
    assert page["artifact_file_sha256"] == hashlib.sha256(
        drive.files[page["artifact_file_id"]]["content"]
    ).hexdigest()


def test_source_hash_mismatch_publishes_terminal_failure_manifest(tmp_path):
    pdf_bytes = make_pdf(tmp_path / "source.pdf")
    job = {
        "contract_version": "1", "run_id": "run_test_002",
        "logical_job_id": "job_test_002", "catalog_id": "cat_test_002",
        "source_pdf_file_id": "source-pdf", "source_sha256": "0" * 64,
        "idempotency_key": idempotency_key("run_test_002", "job_test_002", "0" * 64),
        "attempt_number": 1, "run_folder_id": "folder-run",
    }
    drive = FakeDrive(job, pdf_bytes)
    result = runner.run_from_drive(
        job_file_id="job-file-id-123456", drive=drive, output_root=tmp_path / "work",
    )
    assert result["run_status"] == "FAILED"
    manifest = json.loads(drive.files[result["result_manifest_file_id"]]["content"])
    assert manifest["error_code"] == "SOURCE_HASH_MISMATCH"
    assert manifest["failed_units"] == 1


def test_repeated_delivery_reuses_the_same_immutable_result_manifest(tmp_path):
    pdf_bytes = make_pdf(tmp_path / "source.pdf")
    job = {
        "contract_version": "1", "run_id": "run_test_003",
        "logical_job_id": "job_test_003", "catalog_id": "cat_test_003",
        "source_pdf_file_id": "source-pdf",
        "source_sha256": hashlib.sha256(pdf_bytes).hexdigest(),
        "idempotency_key": idempotency_key("run_test_003", "job_test_003", hashlib.sha256(pdf_bytes).hexdigest()),
        "attempt_number": 1, "run_folder_id": "folder-run",
    }
    drive = FakeDrive(job, pdf_bytes)
    first = runner.run_from_drive(
        job_file_id="job-file-id-123456", drive=drive, output_root=tmp_path / "work",
    )
    second = runner.run_from_drive(
        job_file_id="job-file-id-123456", drive=drive, output_root=tmp_path / "work",
    )
    assert second["result_manifest_file_id"] == first["result_manifest_file_id"]
    assert second["result_manifest_sha256"] == first["result_manifest_sha256"]
    assert second["run_status"] == "COMPLETED"



def test_drive_runner_extracts_and_uploads_images_when_enabled(tmp_path, monkeypatch):
    pdf_bytes = make_pdf_with_image(tmp_path / "source-with-image.pdf")
    source_sha = hashlib.sha256(pdf_bytes).hexdigest()
    job = {
        "contract_version": "1",
        "run_id": "run_test_images_001",
        "logical_job_id": "job_test_images_001",
        "catalog_id": "cat_test_images_001",
        "source_pdf_file_id": "source-pdf",
        "source_sha256": source_sha,
        "idempotency_key": idempotency_key("run_test_images_001", "job_test_images_001", source_sha),
        "attempt_number": 1,
        "run_folder_id": "folder-run",
        "extraction_profile": "embedded-text-v1",
    }
    drive = FakeDrive(job, pdf_bytes)
    monkeypatch.setattr(runner, "image_extraction_enabled", lambda: True)

    result = runner.run_from_drive(
        job_file_id="job-file-id-123456",
        drive=drive,
        output_root=tmp_path / "work-images",
    )

    assert result["run_status"] == "COMPLETED"
    manifest = json.loads(drive.files[result["result_manifest_file_id"]]["content"])
    image_state = manifest["image_extraction"]
    assert image_state["enabled"] is True
    assert image_state["status"] == "COMPLETED"
    assert image_state["image_count"] == 1
    assert image_state["uploaded_count"] == 1
    assert image_state["reused_count"] == 0
    assert image_state["stored_count"] == 1

    image_manifest_file = drive.files[image_state["manifest_file_id"]]
    image_manifest = json.loads(image_manifest_file["content"])
    assert image_manifest["image_count"] == 1
    uploaded_image = image_manifest["images"][0]
    image_file = drive.files[uploaded_image["drive_file_id"]]
    assert hashlib.sha256(image_file["content"]).hexdigest() == uploaded_image["sha256"]
    assert uploaded_image["drive_sha256"] == uploaded_image["sha256"]

    drive_manifest_file = drive.files[image_state["drive_manifest_file_id"]]
    drive_manifest = json.loads(drive_manifest_file["content"])
    assert drive_manifest["overall_status"] == "COMPLETED"
    assert drive_manifest["images"][0]["drive_file_id"] == uploaded_image["drive_file_id"]
    assert drive_manifest["images"][0]["upload_status"] == "UPLOADED"


def test_drive_runner_records_images_disabled_by_default(tmp_path, monkeypatch):
    pdf_bytes = make_pdf(tmp_path / "source-no-image.pdf")
    source_sha = hashlib.sha256(pdf_bytes).hexdigest()
    job = {
        "contract_version": "1",
        "run_id": "run_test_images_002",
        "logical_job_id": "job_test_images_002",
        "catalog_id": "cat_test_images_002",
        "source_pdf_file_id": "source-pdf",
        "source_sha256": source_sha,
        "idempotency_key": idempotency_key("run_test_images_002", "job_test_images_002", source_sha),
        "attempt_number": 1,
        "run_folder_id": "folder-run",
    }
    drive = FakeDrive(job, pdf_bytes)
    monkeypatch.setattr(runner, "image_extraction_enabled", lambda: False)

    result = runner.run_from_drive(
        job_file_id="job-file-id-123456",
        drive=drive,
        output_root=tmp_path / "work-images-disabled",
    )

    manifest = json.loads(drive.files[result["result_manifest_file_id"]]["content"])
    assert manifest["image_extraction"] == {
        "enabled": False,
        "status": "DISABLED",
        "image_count": 0,
        "uploaded_count": 0,
    }



def test_github_cli_fallback_publishes_terminal_failure_manifest(tmp_path):
    from catalog_worker.github_actions_cli import _publish_terminal_failure

    pdf_bytes = make_pdf(tmp_path / "source-fallback.pdf")
    source_sha = hashlib.sha256(pdf_bytes).hexdigest()
    job = {
        "run_id": "run_test_fallback",
        "logical_job_id": "job_test_fallback",
        "catalog_id": "cat_test_fallback",
        "source_sha256": source_sha,
        "attempt_number": 1,
        "run_folder_id": "folder-run",
    }
    drive = FakeDrive(job, pdf_bytes)

    result = _publish_terminal_failure(
        drive, job, RuntimeError("DRIVE_UPLOAD_FAILED: simulated transport error"), tmp_path / "fallback"
    )

    assert result is not None
    assert result["run_status"] == "FAILED"
    manifest = json.loads(drive.files[result["result_manifest_file_id"]]["content"])
    assert manifest["error_code"] == "DRIVE_UPLOAD_FAILED"
    assert manifest["run_id"] == "run_test_fallback"
