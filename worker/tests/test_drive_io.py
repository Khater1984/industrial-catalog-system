import hashlib

import pytest

from catalog_worker.drive_io import DriveClient, DriveError


class FakeRequest:
    def __init__(self, result):
        self.result = result
        self.retry_counts = []

    def execute(self, num_retries=0):
        self.retry_counts.append(num_retries)
        return self.result


class FakeFiles:
    def __init__(self):
        self.metadata_request = FakeRequest({"id": "file-123"})
        self.list_request = FakeRequest({"files": []})
        self.create_request = FakeRequest({"id": "uploaded-123"})
        self.create_args = None

    def get(self, **kwargs):
        return self.metadata_request

    def list(self, **kwargs):
        return self.list_request

    def create(self, **kwargs):
        self.create_args = kwargs
        return self.create_request


class FakeService:
    def __init__(self):
        self.files_api = FakeFiles()

    def files(self):
        return self.files_api


def test_drive_metadata_uses_configured_bounded_retries():
    service = FakeService()
    client = DriveClient(service=service, max_retries=3)

    assert client.metadata("file-123") == {"id": "file-123"}
    assert service.files_api.metadata_request.retry_counts == [3]


def test_drive_listing_uses_configured_bounded_retries():
    service = FakeService()
    client = DriveClient(service=service, max_retries=2)

    assert client.list_children("folder-123") == []
    assert service.files_api.list_request.retry_counts == [2]


def test_drive_upload_uses_configured_bounded_retries():
    service = FakeService()
    client = DriveClient(service=service, max_retries=4)
    content = b"synthetic-image-bytes"

    file_id, digest = client.upload_bytes(
        "folder-123", "image.png", content, "image/png"
    )

    assert file_id == "uploaded-123"
    assert digest == hashlib.sha256(content).hexdigest()
    assert service.files_api.create_request.retry_counts == [4]
    assert service.files_api.create_args["body"]["appProperties"]["sha256"] == digest


def test_drive_upload_with_status_reports_new_upload():
    service = FakeService()
    client = DriveClient(service=service, max_retries=1)
    content = b"new-image"

    file_id, digest, status = client.upload_bytes_with_status(
        "folder-123", "image.png", content, "image/png"
    )

    assert file_id == "uploaded-123"
    assert digest == hashlib.sha256(content).hexdigest()
    assert status == "UPLOADED"


def test_retry_count_is_read_from_environment(monkeypatch):
    monkeypatch.setenv("WORKER_DRIVE_MAX_RETRIES", "6")
    assert DriveClient(service=FakeService()).max_retries == 6


@pytest.mark.parametrize("value", [-1, 11, True, "3"])
def test_invalid_explicit_retry_count_is_rejected(value):
    with pytest.raises(DriveError, match="DRIVE_RETRY_CONFIG_INVALID"):
        DriveClient(service=FakeService(), max_retries=value)


def test_invalid_retry_environment_value_fails_fast(monkeypatch):
    monkeypatch.setenv("WORKER_DRIVE_MAX_RETRIES", "many")
    with pytest.raises(DriveError, match="DRIVE_RETRY_CONFIG_INVALID"):
        DriveClient(service=FakeService())



def test_drive_client_uses_workspace_oauth_refresh_token(monkeypatch):
    import json
    from google.oauth2.credentials import Credentials
    from catalog_worker import drive_io

    class RefreshedCredentials:
        def __init__(self):
            self.refreshed = False

        def refresh(self, request):
            self.refreshed = True

    credentials = RefreshedCredentials()
    captured = {}

    monkeypatch.setenv("GOOGLE_OAUTH_CREDENTIALS_JSON", json.dumps({
        "client_id": "client-id",
        "client_secret": "client-secret",
        "refresh_token": "refresh-token",
        "token_uri": "https://oauth2.googleapis.com/token",
    }))
    monkeypatch.setattr(
        Credentials, "from_authorized_user_info",
        staticmethod(lambda info, scopes: (captured.update({"info": info, "scopes": scopes}) or credentials)),
    )
    monkeypatch.setattr(drive_io, "build", lambda *args, **kwargs: captured.update({
        "build_args": args, "build_kwargs": kwargs
    }) or FakeService())

    client = DriveClient()

    assert client.service is not None
    assert credentials.refreshed is True
    assert captured["scopes"] == ["https://www.googleapis.com/auth/drive"]
    assert captured["build_args"] == ("drive", "v3")
    assert captured["build_kwargs"]["credentials"] is credentials
    assert captured["build_kwargs"]["cache_discovery"] is False


def test_incomplete_workspace_oauth_secret_fails_closed(monkeypatch):
    import json

    monkeypatch.setenv("GOOGLE_OAUTH_CREDENTIALS_JSON", json.dumps({
        "client_id": "client-id",
        "client_secret": "client-secret",
    }))
    with pytest.raises(DriveError, match="DRIVE_OAUTH_REFRESH_FAILED"):
        DriveClient()
