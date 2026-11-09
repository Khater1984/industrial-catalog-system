# Image Drive Sync

## Purpose

Uploads verified local image artifacts (from `images.py`) to Google Drive and produces a separate `drive-image-manifest.json`.

This is a bridge only. It does **not** write to Sheets, create `Image_Assets` rows, or link images to products. Human review + `ImagePromotion.js` remain responsible for promotion.

## Input

- Directory containing `image-manifest.json` produced by `images.py`.
- Artifact files referenced by relative `artifact_path` values.

## Configuration

```bash
export CATALOG_WORKER_IMAGE_DRIVE_FOLDER_ID=your-drive-folder-id
```

Uses the existing `DriveClient` (Application Default Credentials).

## Output

`drive-image-manifest.json` containing:

- Verified SHA-256
- Drive file ID
- Original metadata (name, MIME, dimensions, alpha, page info)
- Per-image `upload_status` (`UPLOADED` / `FAILED`)
- Overall status: `COMPLETED` | `PARTIAL` | `FAILED`
- Manifest checksum

## Behavior

- Recalculates SHA-256 from actual bytes and rejects mismatches.
- Rejects path traversal and missing files.
- Uses immutable content-addressed filenames (`{sha256}{ext}`).
- Reuses existing Drive files when content matches (via DriveClient).
- Partial failures preserve successful uploads.
- Original local artifacts are never modified.

## Usage

```python
from catalog_worker.image_drive_sync import sync_images_to_drive
result = sync_images_to_drive("/path/to/extraction")
```
