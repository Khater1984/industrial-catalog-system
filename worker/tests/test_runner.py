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
        if file_id == "job-file":
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


def test_drive_runner_processes_uploads_and_notifies(monkeypatch, tmp_path):
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
    callbacks = []
    monkeypatch.setattr(runner, "_post_callback", lambda url, token, payload: callbacks.append((url, token, payload)))

    result = runner.run_from_drive(
        job_file_id="job-file", callback_url="https://script.google.com/macros/s/test/exec",
        callback_token="callback-secret", drive=drive, output_root=tmp_path / "work",
    )

    assert result["accepted"] is True
    assert result["run_status"] == "COMPLETED"
    assert len(callbacks) == 1
    assert callbacks[0][0].startswith("https://")
    assert callbacks[0][1] == "callback-secret"
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


def test_runner_rejects_non_https_callback_before_execution(monkeypatch, tmp_path):
    pdf_bytes = make_pdf(tmp_path / "source.pdf")
    job = {
        "contract_version": "1", "run_id": "run_test_002",
        "logical_job_id": "job_test_002", "catalog_id": "cat_test_002",
        "source_pdf_file_id": "source-pdf",
        "source_sha256": hashlib.sha256(pdf_bytes).hexdigest(),
        "attempt_number": 1, "run_folder_id": "folder-run",
    }
    drive = FakeDrive(job, pdf_bytes)
    import pytest
    with pytest.raises(runner.RunnerError, match="CALLBACK_HTTPS_REQUIRED"):
        runner.run_from_drive(
            job_file_id="job-file", callback_url="http://insecure.example/callback",
            callback_token="secret", drive=drive, output_root=tmp_path / "work",
        )
