import hashlib
import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from catalog_worker.drive_io import DriveClient
from catalog_worker.image_drive_sync import ImageDriveSyncError, sync_images_to_drive
from catalog_worker.images import canonical_json_bytes, sha256_bytes


def _make_manifest(root: Path, images: list[dict]) -> dict:
    manifest = {
        "manifest_version": 1,
        "catalog_id": "cat1",
        "run_id": "run1",
        "image_count": len(images),
        "images": images,
    }
    manifest["manifest_sha256"] = sha256_bytes(canonical_json_bytes(manifest))
    (root / "image-manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    return manifest


def _client(status="UPLOADED", digest=None):
    client = MagicMock(spec=DriveClient)
    client.upload_bytes_with_status.side_effect = lambda folder, name, content, mime, immutable=True: (
        "drive-file-1", digest or hashlib.sha256(content).hexdigest(), status
    )
    return client


def _image(root: Path, data=b"valid-image-bytes", relative="images/page-00001/image.png"):
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path, hashlib.sha256(data).hexdigest()


def test_valid_upload_and_source_immutability(tmp_path):
    data = b"valid-image-bytes"
    artifact, digest = _image(tmp_path, data)
    _make_manifest(tmp_path, [{
        "sha256": digest, "artifact_path": "images/page-00001/image.png",
        "original_name": "test.png", "mime_type": "image/png",
        "width_px": 10, "height_px": 10, "file_size_bytes": len(data),
        "has_alpha": False, "catalog_id": "cat1", "run_id": "run1",
        "page_number": 1, "catalog_page_id": "p1",
    }])
    client = _client()
    result = sync_images_to_drive(tmp_path, drive_client=client, folder_id="folder-xyz")
    assert result["overall_status"] == "COMPLETED"
    assert result["uploaded_count"] == 1
    assert result["reused_count"] == 0
    assert result["images"][0]["drive_file_id"] == "drive-file-1"
    assert result["images"][0]["upload_status"] == "UPLOADED"
    assert result["images"][0]["drive_filename"] == f"{digest}.png"
    assert json.loads((tmp_path / "drive-image-manifest.json").read_text())["manifest_sha256"] == result["manifest_sha256"]
    assert artifact.read_bytes() == data


def test_existing_drive_object_is_reported_as_reused(tmp_path):
    _, digest = _image(tmp_path)
    _make_manifest(tmp_path, [{"sha256": digest, "artifact_path": "images/page-00001/image.png"}])
    result = sync_images_to_drive(tmp_path, drive_client=_client("REUSED"), folder_id="f")
    assert result["overall_status"] == "COMPLETED"
    assert result["uploaded_count"] == 0
    assert result["reused_count"] == 1
    assert result["images"][0]["upload_status"] == "REUSED"


def test_sha_mismatch_rejected_before_upload(tmp_path):
    _image(tmp_path, b"real", "images/a.png")
    _make_manifest(tmp_path, [{"sha256": "0" * 64, "artifact_path": "images/a.png"}])
    client = _client()
    result = sync_images_to_drive(tmp_path, drive_client=client, folder_id="f")
    assert result["overall_status"] == "FAILED"
    assert result["images"][0]["error"] == "SHA256_MISMATCH"
    client.upload_bytes_with_status.assert_not_called()


def test_missing_artifact(tmp_path):
    _make_manifest(tmp_path, [{"sha256": "a" * 64, "artifact_path": "images/missing.png"}])
    result = sync_images_to_drive(tmp_path, drive_client=_client(), folder_id="f")
    assert result["images"][0]["error"] == "ARTIFACT_MISSING"


@pytest.mark.parametrize("relative", [
    "../secret.png", "/tmp/secret.png", r"..\\secret.png", r"C:\\secret.png",
])
def test_unsafe_paths_rejected(tmp_path, relative):
    _make_manifest(tmp_path, [{"sha256": "a" * 64, "artifact_path": relative}])
    result = sync_images_to_drive(tmp_path, drive_client=_client(), folder_id="f")
    assert result["overall_status"] == "FAILED"
    assert result["images"][0]["error"] == "PATH_TRAVERSAL"


def test_symlink_escape_rejected(tmp_path):
    outside = tmp_path.parent / (tmp_path.name + "-outside.png")
    outside.write_bytes(b"outside")
    link = tmp_path / "escape.png"
    link.symlink_to(outside)
    digest = hashlib.sha256(b"outside").hexdigest()
    _make_manifest(tmp_path, [{"sha256": digest, "artifact_path": "escape.png"}])
    result = sync_images_to_drive(tmp_path, drive_client=_client(), folder_id="f")
    assert result["images"][0]["error"] == "PATH_TRAVERSAL"


def test_invalid_manifest_checksum_rejected(tmp_path):
    (tmp_path / "image-manifest.json").write_text(json.dumps({
        "manifest_version": 1, "catalog_id": "c", "run_id": "r",
        "image_count": 0, "images": [], "manifest_sha256": "deadbeef",
    }), encoding="utf-8")
    with pytest.raises(ImageDriveSyncError) as exc:
        sync_images_to_drive(tmp_path, drive_client=_client(), folder_id="f")
    assert exc.value.code == "MANIFEST_CHECKSUM_INVALID"


def test_manifest_structure_and_count_validated(tmp_path):
    manifest = _make_manifest(tmp_path, [])
    manifest["image_count"] = 2
    manifest["manifest_sha256"] = sha256_bytes(canonical_json_bytes({
        k: v for k, v in manifest.items() if k != "manifest_sha256"
    }))
    (tmp_path / "image-manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ImageDriveSyncError) as exc:
        sync_images_to_drive(tmp_path, drive_client=_client(), folder_id="f")
    assert exc.value.code == "MANIFEST_STRUCTURE_INVALID"


def test_folder_config_required(tmp_path, monkeypatch):
    monkeypatch.delenv("CATALOG_WORKER_IMAGE_DRIVE_FOLDER_ID", raising=False)
    _make_manifest(tmp_path, [])
    with pytest.raises(ImageDriveSyncError) as exc:
        sync_images_to_drive(tmp_path, drive_client=_client())
    assert exc.value.code == "DRIVE_FOLDER_NOT_CONFIGURED"


def test_partial_failure_preserves_successes(tmp_path):
    _, good_sha = _image(tmp_path, b"good", "images/good.png")
    _make_manifest(tmp_path, [
        {"sha256": good_sha, "artifact_path": "images/good.png", "mime_type": "image/png"},
        {"sha256": "b" * 64, "artifact_path": "images/missing.png"},
    ])
    result = sync_images_to_drive(tmp_path, drive_client=_client(), folder_id="f")
    assert result["overall_status"] == "PARTIAL"
    assert result["uploaded_count"] == 1
    assert result["stored_count"] == 1
    assert result["failed_count"] == 1
    assert result["images"][0]["drive_file_id"] == "drive-file-1"


def test_file_size_mismatch_prevents_upload(tmp_path):
    _, digest = _image(tmp_path, b"actual", "images/a.png")
    _make_manifest(tmp_path, [{
        "sha256": digest, "artifact_path": "images/a.png", "file_size_bytes": 999,
    }])
    client = _client()
    result = sync_images_to_drive(tmp_path, drive_client=client, folder_id="f")
    assert result["images"][0]["error"] == "FILE_SIZE_MISMATCH"
    client.upload_bytes_with_status.assert_not_called()


def test_drive_checksum_mismatch_is_failed(tmp_path):
    _, digest = _image(tmp_path)
    _make_manifest(tmp_path, [{"sha256": digest, "artifact_path": "images/page-00001/image.png"}])
    result = sync_images_to_drive(
        tmp_path, drive_client=_client(digest="f" * 64), folder_id="f"
    )
    assert result["overall_status"] == "FAILED"
    assert result["images"][0]["error"] == "DRIVE_CHECKSUM_MISMATCH"


def test_output_manifest_checksum_is_valid(tmp_path):
    _, digest = _image(tmp_path, b"x", "i.png")
    _make_manifest(tmp_path, [{"sha256": digest, "artifact_path": "i.png"}])
    result = sync_images_to_drive(tmp_path, drive_client=_client(), folder_id="f")
    payload = dict(result)
    payload.pop("manifest_sha256")
    assert sha256_bytes(canonical_json_bytes(payload)) == result["manifest_sha256"]


def test_client_must_report_upload_or_reuse_status(tmp_path):
    _make_manifest(tmp_path, [])
    with pytest.raises(ImageDriveSyncError) as exc:
        sync_images_to_drive(tmp_path, drive_client=object(), folder_id="f")
    assert exc.value.code == "DRIVE_CLIENT_STATUS_UNSUPPORTED"
