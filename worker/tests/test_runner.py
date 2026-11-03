import hashlib
import json
from pathlib import Path

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
        for file_id, value in self.files.items():
            if value["name"] == name:
                assert value["content"] == content
                return file_id, hashlib.sha256(content).hexdigest()
        self.next_id += 1
        file_id = f"drive-file-{self.next_id}"
        self.files[file_id] = {"name": name, "content": content, "mime_type": mime_type}
        return file_id, hashlib.sha256(content).hexdigest()


def make_pdf(path):
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(output))
    pdf.drawString(72, 720, "Industrial catalog page one")
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
