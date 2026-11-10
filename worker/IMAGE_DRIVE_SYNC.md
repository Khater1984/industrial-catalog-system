# Image Drive Sync

## Purpose

Uploads verified local image artifacts from `images.py` to Google Drive. The bridge produces a separate checksummed `drive-image-manifest.json` and is used by the Drive-backed runner when image extraction is enabled.

This bridge does **not** write to Sheets, create `Image_Assets` rows, or associate images with products. Human review and `ImagePromotion.js` remain responsible for promotion.

## Input and validation

- Directory containing the version 1 `image-manifest.json` produced by `images.py`.
- The manifest must contain matching `image_count`, `images`, `catalog_id`, `run_id`, and a valid SHA-256 checksum.
- Each artifact path must be a safe relative POSIX path contained within the extraction directory. Absolute paths, Windows drive paths, backslashes, traversal components, and symlink escapes are rejected.
- The bridge recalculates SHA-256 and verifies the actual byte count when the source manifest supplies it.

## Configuration

```bash
export CATALOG_WORKER_IMAGE_DRIVE_FOLDER_ID=your-drive-folder-id
```

Uses the existing `DriveClient` and Application Default Credentials. The service identity must have access to the configured folder.

## Upload and retry behavior

- Images use content-addressed filenames: `{sha256}{extension}`.
- `DriveClient.upload_bytes_with_status` returns `UPLOADED` for a newly created object and `REUSED` when matching immutable content already exists, including a concurrent-create recovery.
- Existing `upload_bytes` callers retain their original two-value return contract.
- The bridge verifies the returned SHA-256 and file ID before recording success.
- Partial batches preserve per-image successes and failures. They are never reported as `COMPLETED`.
- The bridge writes its output manifest atomically and never modifies source PDFs or image artifacts.

## Output

`drive-image-manifest.json` includes:

- Source manifest checksum, catalog/run IDs, and Drive folder ID.
- Drive file ID, content hash, filename, MIME type, dimensions, alpha flag, size, page metadata, and artifact path for each successful image.
- Per-image status: `UPLOADED`, `REUSED`, or `FAILED`.
- Counts: `uploaded_count`, `reused_count`, `stored_count`, and `failed_count`.
- Overall status: `COMPLETED`, `PARTIAL`, or `FAILED`.
- Output manifest checksum.

## Runner integration

The Cloud Run Docker image sets `CATALOG_WORKER_EXTRACT_IMAGES=1`, so deployed catalog jobs extract and upload embedded images by default. Local runs remain opt-in: set the same environment variable or pass `enabled=True` to the extraction API. `runner.py` invokes this bridge before publishing the terminal run manifest. It publishes both:

- `image-manifest.json` with Drive file IDs retained for the existing human-review / promotion contract.
- `drive-image-manifest.json` as the separate upload audit record.

If any image fails to upload, the run is not marked `COMPLETED`.

## Local usage

```python
from catalog_worker.image_drive_sync import sync_images_to_drive

result = sync_images_to_drive("/path/to/extraction")
assert result["overall_status"] == "COMPLETED"
```

Unit tests use mocked Drive clients and do not require real credentials or modify a real Drive folder.
