import hashlib
import json
from pathlib import Path

import pytest

from catalog_worker.integrity import load_manifest, verify_gate_3
from catalog_worker.resumable import _hash_payload, canonical_json_bytes


class FakeDrive:
    def __init__(self):
        self.items = {}

    def add(self, file_id, name, mime_type, content=b"", parent=None):
        self.items[file_id] = {
            "id": file_id, "name": name, "mimeType": mime_type,
            "content": content, "parents": [parent] if parent else [],
        }

    def metadata(self, file_id):
        if file_id not in self.items:
            raise FileNotFoundError(file_id)
        return {key: self.items[file_id][key] for key in ("id", "name", "mimeType", "parents")}

    def list_children(self, parent_id):
        return [
            {key: item[key] for key in ("id", "name", "mimeType", "parents")}
            for item in self.items.values() if parent_id in item["parents"]
        ]

    def download(self, file_id, destination):
        if file_id not in self.items:
            raise FileNotFoundError(file_id)
        path = Path(destination)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(self.items[file_id]["content"])
        return path


def reseal_manifest(manifest):
    manifest["manifest_sha256"] = _hash_payload(manifest, "manifest_sha256")


def fixture():
    drive = FakeDrive()
    drive.add("root", "DEV_RUNS", "application/vnd.google-apps.folder")
    drive.add("run-folder", "run_001", "application/vnd.google-apps.folder", parent="root")

    artifact = {
        "run_id": "run_001", "catalog_id": "cat_001",
        "run_unit_id": "ru_001", "catalog_page_id": "cp_cat_001_00001",
        "unit_key": "cp_cat_001_00001", "input_sha256": "1" * 64,
        "unit_status": "COMPLETED", "page_number": 1,
        "source_pdf_sha256": "2" * 64, "extracted_text": "page text",
    }
    artifact["output_sha256"] = _hash_payload(artifact, "output_sha256")
    artifact_bytes = canonical_json_bytes(artifact)
    artifact_sha = hashlib.sha256(artifact_bytes).hexdigest()
    drive.add("artifact-1", "page-00001.json", "application/json",
              artifact_bytes, parent="run-folder")

    page = {
        # Mirror runner.py: page summaries omit top-level run_id/catalog_id.
        "unit_key": artifact["unit_key"], "run_unit_id": artifact["run_unit_id"],
        "catalog_page_id": artifact["catalog_page_id"], "page_number": 1,
        "input_sha256": artifact["input_sha256"], "unit_status": "COMPLETED",
        "artifact_file_id": "artifact-1", "artifact_file_sha256": artifact_sha,
        "output_sha256": artifact["output_sha256"],
    }
    manifest = {
        "protocol_version": "1", "manifest_version": 2,
        "run_id": "run_001", "catalog_id": "cat_001",
        "source_sha256": "2" * 64, "run_status": "COMPLETED",
        "pages": [page],
    }
    manifest["manifest_sha256"] = _hash_payload(manifest, "manifest_sha256")
    manifest_bytes = canonical_json_bytes(manifest)
    drive.add("manifest-1", "result-manifest.json", "application/json",
              manifest_bytes, parent="run-folder")

    unit = {
        "Run_ID": "run_001", "Run_Unit_ID": "ru_001",
        "Unit_Key": artifact["unit_key"], "Unit_Status": "COMPLETED",
        "Catalog_Page_ID": artifact["catalog_page_id"],
        "Input_SHA256": artifact["input_sha256"],
        "Output_Manifest_File_ID": "artifact-1",
        "Output_SHA256": artifact["output_sha256"],
    }
    loaded = load_manifest(drive, run_id="run_001", drive_root_folder_id="root")
    return drive, manifest, unit, loaded


def test_load_manifest_uses_actual_apps_script_run_folder_layout():
    _, manifest, _, loaded = fixture()
    assert loaded.source == "run-folder"
    assert loaded.file_id == "manifest-1"
    assert loaded.manifest == manifest


def test_gate3_passes_only_after_content_and_transport_verification():
    drive, _, unit, loaded = fixture()
    result = verify_gate_3(drive, run_id="run_001", units=[unit], manifest_result=loaded)
    assert result.status == "PASS"
    assert result.tier == "A"


def test_explicit_manifest_with_wrong_run_id_is_rejected():
    drive, _, _, _ = fixture()
    loaded = load_manifest(drive, run_id="other_run", drive_root_folder_id=None,
                           explicit_file_id="manifest-1")
    assert loaded.manifest is None
    assert "run_id" in loaded.note


def test_missing_manifest_is_incomplete_not_pass():
    drive, _, unit, _ = fixture()
    from catalog_worker.integrity import ManifestResult
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit],
        manifest_result=ManifestResult(None, None, "not-found", "not found"),
    )
    assert result.status == "INCOMPLETE"


def test_missing_transport_hash_is_incomplete():
    drive, manifest, unit, _ = fixture()
    manifest["pages"][0]["artifact_file_sha256"] = None
    reseal_manifest(manifest)
    from catalog_worker.integrity import ManifestResult
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit],
        manifest_result=ManifestResult(manifest, "manifest-1", "explicit"),
    )
    assert result.status == "INCOMPLETE"


def test_malformed_transport_hash_is_fail():
    drive, manifest, unit, _ = fixture()
    manifest["pages"][0]["artifact_file_sha256"] = "not-a-sha"
    reseal_manifest(manifest)
    from catalog_worker.integrity import ManifestResult
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit],
        manifest_result=ManifestResult(manifest, "manifest-1", "explicit"),
    )
    assert result.status == "FAIL"


def test_artifact_file_id_mismatch_is_fail():
    drive, manifest, unit, _ = fixture()
    manifest["pages"][0]["artifact_file_id"] = "different-file"
    reseal_manifest(manifest)
    from catalog_worker.integrity import ManifestResult
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit],
        manifest_result=ManifestResult(manifest, "manifest-1", "explicit"),
    )
    assert result.status == "FAIL"


def test_duplicate_manifest_unit_key_is_fail():
    drive, manifest, unit, _ = fixture()
    manifest["pages"].append(dict(manifest["pages"][0]))
    reseal_manifest(manifest)
    from catalog_worker.integrity import ManifestResult
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit],
        manifest_result=ManifestResult(manifest, "manifest-1", "explicit"),
    )
    assert result.status == "FAIL"


def test_duplicate_run_unit_key_is_fail():
    drive, _, unit, loaded = fixture()
    duplicate = dict(unit)
    duplicate["Run_Unit_ID"] = "ru_002"
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit, duplicate], manifest_result=loaded
    )
    assert result.status == "FAIL"


def test_bad_content_hash_is_fail():
    drive, manifest, unit, _ = fixture()
    unit["Output_SHA256"] = "f" * 64
    from catalog_worker.integrity import ManifestResult
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit],
        manifest_result=ManifestResult(manifest, "manifest-1", "explicit"),
    )
    assert result.status == "FAIL"


def test_no_completed_units_is_skip():
    drive, _, unit, loaded = fixture()
    unit["Unit_Status"] = "FAILED"
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit], manifest_result=loaded
    )
    assert result.status == "SKIP"


def test_missing_artifact_file_is_fail():
    drive, _, unit, loaded = fixture()
    del drive.items["artifact-1"]
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit], manifest_result=loaded
    )
    assert result.status == "FAIL"


def test_transport_hash_mismatch_is_fail():
    drive, manifest, unit, _ = fixture()
    manifest["pages"][0]["artifact_file_sha256"] = "0" * 64
    reseal_manifest(manifest)
    from catalog_worker.integrity import ManifestResult
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit],
        manifest_result=ManifestResult(manifest, "manifest-1", "explicit"),
    )
    assert result.status == "FAIL"


def test_duplicate_manifest_file_is_ambiguous_not_first_match():
    drive, _, _, _ = fixture()
    drive.add("manifest-2", "result-manifest.json", "application/json",
              drive.items["manifest-1"]["content"], parent="run-folder")
    loaded = load_manifest(drive, run_id="run_001", drive_root_folder_id="root")
    assert loaded.manifest is None
    assert loaded.source == "ambiguous"


def test_manifest_with_non_list_pages_is_rejected():
    drive, manifest, _, _ = fixture()
    manifest["pages"] = {}
    reseal_manifest(manifest)
    raw = canonical_json_bytes(manifest)
    drive.items["manifest-1"]["content"] = raw
    loaded = load_manifest(drive, run_id="run_001", drive_root_folder_id="root")
    assert loaded.manifest is None
    assert "pages" in loaded.note


def test_corrupt_manifest_checksum_is_rejected():
    drive, _, _, _ = fixture()
    raw = json.loads(drive.items["manifest-1"]["content"].decode("utf-8"))
    raw["catalog_id"] = "different-catalog"
    drive.items["manifest-1"]["content"] = canonical_json_bytes(raw)
    loaded = load_manifest(drive, run_id="run_001", drive_root_folder_id="root")
    assert loaded.manifest is None
    assert "manifest_sha256" in loaded.note


def test_duplicate_manifest_run_unit_id_is_fail():
    drive, manifest, unit, _ = fixture()
    duplicate = dict(manifest["pages"][0])
    duplicate["unit_key"] = "another-unit-key"
    manifest["pages"].append(duplicate)
    reseal_manifest(manifest)
    from catalog_worker.integrity import ManifestResult
    result = verify_gate_3(
        drive, run_id="run_001", units=[unit],
        manifest_result=ManifestResult(manifest, "manifest-1", "explicit"),
    )
    assert result.status == "FAIL"
