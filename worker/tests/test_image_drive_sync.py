import hashlib
import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from catalog_worker.drive_io import DriveClient, DriveError
from catalog_worker.image_drive_sync import ImageDriveSyncError, sync_images_to_drive
from catalog_worker.images import canonical_json_bytes, sha256_bytes


def _make_manifest(tmp: Path, images: list[dict]) -> dict:
    manifest = {
        "manifest_version": 1,
        "catalog_id": "cat1",
        "run_id": "run1",
        "images": images,
    }
    payload = dict(manifest)
    manifest["manifest_sha256"] = sha256_bytes(canonical_json_bytes(payload))
    (tmp / "image-manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    return manifest


def test_valid_upload(tmp_path):
    img_bytes = b"\x89PNG\r\n\x1a\nfake"
    digest = hashlib.sha256(img_bytes).hexdigest()
    art = tmp_path / "images" / "page-00001" / f"{digest}.png"
    art.parent.mkdir(parents=True)
    art.write_bytes(img_bytes)

    _make_manifest(tmp_path, [{
        "sha256": digest,
        "artifact_path": f"images/page-00001/{digest}.png",
        "original_name": "test.png",
        "mime_type": "image/png",
        "width_px": 10,
        "height_px": 10,
        "file_size_bytes": len(img_bytes),
        "has_alpha": False,
        "catalog_id": "cat1",
        "run_id": "run1",
        "page_number": 1,
        "catalog_page_id": "p1",
    }])

    mock_client = MagicMock(spec=DriveClient)
    mock_client.upload_bytes.return_value = ("drive-file-1", digest)

    result = sync_images_to_drive(tmp_path, drive_client=mock_client, folder_id="folder-xyz")
    assert result["overall_status"] == "COMPLETED"
    assert result["images"][0]["drive_file_id"] == "drive-file-1"
    assert result["images"][0]["upload_status"] == "UPLOADED"
    assert (tmp_path / "drive-image-manifest.json").exists()
    # original unchanged
    assert art.read_bytes() == img_bytes


def test_sha_mismatch_rejected(tmp_path):
    art = tmp_path / "images" / "a.png"
    art.parent.mkdir(parents=True)
    art.write_bytes(b"real")
    _make_manifest(tmp_path, [{
        "sha256": "0" * 64,
        "artifact_path": "images/a.png",
        "mime_type": "image/png",
    }])
    mock = MagicMock(spec=DriveClient)
    result = sync_images_to_drive(tmp_path, drive_client=mock, folder_id="f")
    assert result["overall_status"] == "FAILED"
    assert result["images"][0]["error"] == "SHA256_MISMATCH"
    mock.upload_bytes.assert_not_called()


def test_missing_artifact(tmp_path):
    _make_manifest(tmp_path, [{"sha256": "a"*64, "artifact_path": "images/missing.png"}])
    result = sync_images_to_drive(tmp_path, drive_client=MagicMock(), folder_id="f")
    assert result["images"][0]["error"] == "ARTIFACT_MISSING"


def test_path_traversal(tmp_path):
    _make_manifest(tmp_path, [{"sha256": "a"*64, "artifact_path": "../secret.png"}])
    result = sync_images_to_drive(tmp_path, drive_client=MagicMock(), folder_id="f")
    assert result["images"][0]["error"] == "PATH_TRAVERSAL"


def test_invalid_manifest_checksum(tmp_path):
    (tmp_path / "image-manifest.json").write_text(json.dumps({
        "manifest_version": 1, "images": [], "manifest_sha256": "deadbeef"
    }), encoding="utf-8")
    with pytest.raises(ImageDriveSyncError) as e:
        sync_images_to_drive(tmp_path, drive_client=MagicMock(), folder_id="f")
    assert e.value.code == "MANIFEST_CHECKSUM_MISMATCH"


def test_folder_config_required(tmp_path, monkeypatch):
    monkeypatch.delenv("CATALOG_WORKER_IMAGE_DRIVE_FOLDER_ID", raising=False)
    _make_manifest(tmp_path, [])
    with pytest.raises(ImageDriveSyncError) as e:
        sync_images_to_drive(tmp_path, drive_client=MagicMock())
    assert e.value.code == "DRIVE_FOLDER_NOT_CONFIGURED"


def test_partial_failure_preserves_success(tmp_path):
    good = b"good"
    good_sha = hashlib.sha256(good).hexdigest()
    art = tmp_path / "images" / f"{good_sha}.png"
    art.parent.mkdir(parents=True)
    art.write_bytes(good)
    _make_manifest(tmp_path, [
        {"sha256": good_sha, "artifact_path": f"images/{good_sha}.png", "mime_type": "image/png"},
        {"sha256": "b"*64, "artifact_path": "images/missing.png"},
    ])
    mock = MagicMock(spec=DriveClient)
    mock.upload_bytes.return_value = ("id1", good_sha)
    result = sync_images_to_drive(tmp_path, drive_client=mock, folder_id="f")
    assert result["overall_status"] == "PARTIAL"
    assert result["uploaded_count"] == 1
    assert result["failed_count"] == 1
    assert result["images"][0]["drive_file_id"] == "id1"


def test_output_manifest_checksum_valid(tmp_path):
    img_bytes = b"x"
    digest = hashlib.sha256(img_bytes).hexdigest()
    art = tmp_path / "i.png"
    art.write_bytes(img_bytes)
    _make_manifest(tmp_path, [{"sha256": digest, "artifact_path": "i.png", "mime_type": "image/png"}])
    mock = MagicMock(spec=DriveClient)
    mock.upload_bytes.return_value = ("fid", digest)
    result = sync_images_to_drive(tmp_path, drive_client=mock, folder_id="f")
    # re-hash
    payload = dict(result)
    payload.pop("manifest_sha256")
    assert sha256_bytes(canonical_json_bytes(payload)) == result["manifest_sha256"]
