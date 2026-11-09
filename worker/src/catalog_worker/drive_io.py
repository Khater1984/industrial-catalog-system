"""Google Drive I/O for the hosted catalog worker.

Uses Application Default Credentials (service account on Cloud Run). The service
account must be explicitly shared on the configured Drive folder/shared drive.
Transient Google API and transport failures use the client's bounded retry logic.
"""
from __future__ import annotations

import hashlib
import io
import os
from pathlib import Path
from typing import Any

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload


class DriveError(RuntimeError):
    pass


def _retry_count(value: int | None) -> int:
    if value is None:
        raw = os.environ.get("WORKER_DRIVE_MAX_RETRIES", "5")
        try:
            value = int(raw)
        except (TypeError, ValueError) as exc:
            raise DriveError("DRIVE_RETRY_CONFIG_INVALID") from exc
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 10:
        raise DriveError("DRIVE_RETRY_CONFIG_INVALID")
    return value


class DriveClient:
    def __init__(self, service=None, *, max_retries: int | None = None):
        self.max_retries = _retry_count(max_retries)
        if service is None:
            try:
                import google.auth
                credentials, _ = google.auth.default(
                    scopes=["https://www.googleapis.com/auth/drive"]
                )
                service = build("drive", "v3", credentials=credentials, cache_discovery=False)
            except Exception as exc:
                raise DriveError("DRIVE_AUTH_FAILED") from exc
        self.service = service

    @staticmethod
    def _escape(value: str) -> str:
        return value.replace("\\", "\\\\").replace("'", "\\'")

    def metadata(self, file_id: str) -> dict[str, Any]:
        try:
            return self.service.files().get(
                fileId=file_id, fields="id,name,mimeType,parents,sha256Checksum,size",
                supportsAllDrives=True,
            ).execute(num_retries=self.max_retries)
        except Exception as exc:
            raise DriveError("DRIVE_FILE_LOOKUP_FAILED") from exc

    def download(self, file_id: str, destination: str | Path) -> Path:
        target = Path(destination)
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            request = self.service.files().get_media(fileId=file_id, supportsAllDrives=True)
            with target.open("wb") as stream:
                downloader = MediaIoBaseDownload(stream, request, chunksize=1024 * 1024)
                done = False
                while not done:
                    _, done = downloader.next_chunk(num_retries=self.max_retries)
            return target
        except Exception as exc:
            target.unlink(missing_ok=True)
            raise DriveError("DRIVE_DOWNLOAD_FAILED") from exc

    def list_children(self, parent_id: str) -> list[dict[str, Any]]:
        query = f"'{self._escape(parent_id)}' in parents and trashed = false"
        items: list[dict[str, Any]] = []
        token = None
        try:
            while True:
                response = self.service.files().list(
                    q=query, pageToken=token, pageSize=1000,
                    fields="nextPageToken,files(id,name,mimeType,parents,appProperties)",
                    includeItemsFromAllDrives=True, supportsAllDrives=True,
                ).execute(num_retries=self.max_retries)
                items.extend(response.get("files", []))
                token = response.get("nextPageToken")
                if not token:
                    return items
        except Exception as exc:
            raise DriveError("DRIVE_LIST_FAILED") from exc

    def upload_bytes(
        self, parent_id: str, name: str, content: bytes, mime_type: str,
        *, immutable: bool = True,
    ) -> tuple[str, str]:
        """Upload bytes and preserve the historical two-value return contract."""
        file_id, digest, _ = self.upload_bytes_with_status(
            parent_id, name, content, mime_type, immutable=immutable
        )
        return file_id, digest

    def upload_bytes_with_status(
        self, parent_id: str, name: str, content: bytes, mime_type: str,
        *, immutable: bool = True,
    ) -> tuple[str, str, str]:
        """Upload bytes and report whether Drive created or reused the object.

        The status is authoritative for the observed operation: UPLOADED means
        this call created the object; REUSED means matching bytes already existed
        or won a concurrent-create race.
        """
        if not isinstance(content, bytes):
            raise DriveError("DRIVE_UPLOAD_CONTENT_INVALID")
        digest = hashlib.sha256(content).hexdigest()
        existing = [f for f in self.list_children(parent_id) if f.get("name") == name]
        if existing:
            if not immutable:
                raise DriveError("DRIVE_FILE_ALREADY_EXISTS")
            for item in existing:
                local = io.BytesIO()
                try:
                    request = self.service.files().get_media(fileId=item["id"], supportsAllDrives=True)
                    downloader = MediaIoBaseDownload(local, request, chunksize=1024 * 1024)
                    done = False
                    while not done:
                        _, done = downloader.next_chunk(num_retries=self.max_retries)
                    if hashlib.sha256(local.getvalue()).hexdigest() == digest:
                        return item["id"], digest, "REUSED"
                except Exception:
                    continue
            raise DriveError("IMMUTABLE_DRIVE_FILE_CONFLICT")
        body = {
            "name": name, "parents": [parent_id],
            "appProperties": {"sha256": digest, "immutable": "true" if immutable else "false"},
        }
        try:
            created = self.service.files().create(
                body=body,
                media_body=MediaIoBaseUpload(io.BytesIO(content), mimetype=mime_type, resumable=True),
                fields="id,name", supportsAllDrives=True,
            ).execute(num_retries=self.max_retries)
            return created["id"], digest, "UPLOADED"
        except Exception as exc:
            # A concurrent task may have created the content-addressed object.
            try:
                for item in self.list_children(parent_id):
                    if item.get("name") == name:
                        local = io.BytesIO()
                        request = self.service.files().get_media(fileId=item["id"], supportsAllDrives=True)
                        downloader = MediaIoBaseDownload(local, request, chunksize=1024 * 1024)
                        done = False
                        while not done:
                            _, done = downloader.next_chunk(num_retries=self.max_retries)
                        if hashlib.sha256(local.getvalue()).hexdigest() == digest:
                            return item["id"], digest, "REUSED"
            except Exception:
                pass
            raise DriveError("DRIVE_UPLOAD_FAILED") from exc

    def upload_file(self, parent_id: str, name: str, path: str | Path, mime_type: str) -> tuple[str, str]:
        return self.upload_bytes(parent_id, name, Path(path).read_bytes(), mime_type)
