"""Independent integrity audit for Drive-backed V2.1 worker results.

This is an operator-side audit. Apps Script Ingest remains the authoritative
persistence path; this module cross-checks Run_Units against the immutable
result manifest and page artifacts without writing to Sheets.
"""
from __future__ import annotations

import hashlib
import json
import re
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .drive_io import DriveClient
from .resumable import _hash_payload

_FOLDER_MIME = "application/vnd.google-apps.folder"
_JSON_MIME = "application/json"
_SHA256_RE = re.compile(r"^[a-f0-9]{64}$")
_COMPLETED = {"COMPLETED", "REUSED"}


@dataclass
class ManifestResult:
    manifest: dict[str, Any] | None
    file_id: str | None
    source: str
    note: str = ""


@dataclass
class GateResult:
    name: str
    status: str
    message: str
    details: list[str] = field(default_factory=list)
    tier: str = "none"


def _download_bytes(drive: DriveClient, file_id: str) -> bytes:
    with tempfile.TemporaryDirectory(prefix="catalog-integrity-") as temp_dir:
        path = drive.download(file_id, Path(temp_dir) / "download.bin")
        return path.read_bytes()


def _parse_manifest(raw: bytes, expected_run_id: str) -> dict[str, Any]:
    try:
        payload = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("manifest is not valid UTF-8 JSON") from exc
    if not isinstance(payload, dict):
        raise ValueError("manifest root must be a JSON object")
    if payload.get("run_id") != expected_run_id:
        raise ValueError("manifest run_id does not match requested Run_ID")
    if not isinstance(payload.get("pages"), list):
        raise ValueError("manifest.pages must be a list")
    if payload.get("manifest_version") != 2 or payload.get("protocol_version") != "1":
        raise ValueError("unsupported manifest/protocol version")
    recorded_digest = payload.get("manifest_sha256")
    if not isinstance(recorded_digest, str) or not _SHA256_RE.fullmatch(recorded_digest):
        raise ValueError("manifest_sha256 is missing or malformed")
    if _hash_payload(payload, "manifest_sha256") != recorded_digest:
        raise ValueError("manifest_sha256 does not match manifest content")
    return payload


def load_manifest(
    drive: DriveClient,
    *,
    run_id: str,
    drive_root_folder_id: str | None,
    explicit_file_id: str | None = None,
) -> ManifestResult:
    """Load from explicit ID or DEV_RUNS_FOLDER_ID/<RUN_ID>/result-manifest.json.

    Apps Script creates each run folder directly under DEV_RUNS_FOLDER_ID.
    The worker writes result-manifest.json directly into that folder. There is
    no intermediate runs directory and no global Drive search fallback.
    """
    if not isinstance(run_id, str) or not run_id.strip():
        return ManifestResult(None, None, "not-found", "Run_ID is required")
    run_id = run_id.strip()

    if explicit_file_id:
        try:
            metadata = drive.metadata(explicit_file_id)
            if metadata.get("mimeType") != _JSON_MIME:
                return ManifestResult(None, explicit_file_id, "explicit",
                                      "explicit file is not application/json")
            raw = _download_bytes(drive, explicit_file_id)
            return ManifestResult(_parse_manifest(raw, run_id), explicit_file_id, "explicit")
        except Exception as exc:
            return ManifestResult(None, explicit_file_id, "explicit",
                                  f"explicit manifest could not be verified: {exc}")

    if not drive_root_folder_id:
        return ManifestResult(None, None, "not-found",
                              "no explicit file id and no DEV_RUNS_FOLDER_ID")

    try:
        root_items = drive.list_children(drive_root_folder_id)
        run_folders = [
            item for item in root_items
            if item.get("name") == run_id and item.get("mimeType") == _FOLDER_MIME
        ]
        if not run_folders:
            return ManifestResult(None, None, "not-found",
                                  f"run folder {run_id!r} not found under DEV_RUNS_FOLDER_ID")
        if len(run_folders) != 1:
            return ManifestResult(None, None, "ambiguous",
                                  f"found {len(run_folders)} folders for Run_ID {run_id!r}")

        run_folder_id = run_folders[0].get("id")
        if not isinstance(run_folder_id, str) or not run_folder_id:
            return ManifestResult(None, None, "not-found", "run folder has no valid Drive file ID")
        children = drive.list_children(run_folder_id)
        manifests = [
            item for item in children
            if item.get("name") == "result-manifest.json" and item.get("mimeType") == _JSON_MIME
        ]
        if not manifests:
            return ManifestResult(None, None, "not-found",
                                  "result-manifest.json not found in the run folder")
        if len(manifests) != 1:
            return ManifestResult(None, None, "ambiguous",
                                  f"found {len(manifests)} result-manifest.json files")
        file_id = manifests[0].get("id")
        if not isinstance(file_id, str) or not file_id:
            return ManifestResult(None, None, "not-found", "manifest file has no valid Drive file ID")
        raw = _download_bytes(drive, file_id)
        return ManifestResult(_parse_manifest(raw, run_id), file_id, "run-folder")
    except Exception as exc:
        return ManifestResult(None, None, "not-found", f"Drive lookup failed: {exc}")


def verify_gate_3(
    drive: DriveClient,
    *,
    run_id: str,
    units: list[dict[str, Any]],
    manifest_result: ManifestResult,
) -> GateResult:
    """Verify completed Run_Units against unique manifest pages and raw artifacts."""
    completed = [
        row for row in units
        if isinstance(row, dict) and row.get("Unit_Status") in _COMPLETED
    ]
    if not completed:
        return GateResult("3-Integrity", "SKIP", "no COMPLETED/REUSED units to verify")

    if manifest_result.manifest is None:
        return GateResult("3-Integrity", "INCOMPLETE",
                          f"trusted result manifest unavailable: {manifest_result.note}")

    manifest = manifest_result.manifest
    if not isinstance(manifest, dict) or manifest.get("run_id") != run_id:
        return GateResult("3-Integrity", "FAIL", "manifest Run_ID mismatch or invalid manifest")
    if manifest.get("run_status") != "COMPLETED" or not isinstance(manifest.get("pages"), list):
        return GateResult("3-Integrity", "FAIL", "manifest is not a completed run with a pages list")

    unit_by_key: dict[str, dict[str, Any]] = {}
    unit_ids: set[str] = set()
    details: list[str] = []
    failures = 0
    incomplete = 0

    for row in completed:
        key, unit_id = row.get("Unit_Key"), row.get("Run_Unit_ID")
        if not isinstance(key, str) or not key or not isinstance(unit_id, str) or not unit_id:
            details.append("Run_Units row has missing/invalid Unit_Key or Run_Unit_ID")
            failures += 1
            continue
        if key in unit_by_key or unit_id in unit_ids:
            details.append(f"duplicate Run_Units identity: {key}")
            failures += 1
            continue
        unit_by_key[key] = row
        unit_ids.add(unit_id)

    page_by_key: dict[str, dict[str, Any]] = {}
    for page in manifest["pages"]:
        if not isinstance(page, dict):
            details.append("manifest.pages contains a non-object entry")
            failures += 1
            continue
        key = page.get("unit_key")
        if not isinstance(key, str) or not key:
            details.append("manifest page has missing/invalid unit_key")
            failures += 1
            continue
        if key in page_by_key:
            details.append(f"duplicate manifest unit_key: {key}")
            failures += 1
            continue
        page_by_key[key] = page

    if failures:
        return GateResult("3-Integrity", "FAIL",
                          f"{failures} manifest/unit identity error(s)", details)
    if set(page_by_key) != set(unit_by_key):
        missing = sorted(set(unit_by_key) - set(page_by_key))
        extra = sorted(set(page_by_key) - set(unit_by_key))
        if missing:
            details.append("manifest missing completed units: " + ", ".join(missing))
        if extra:
            details.append("manifest contains unmatched pages: " + ", ".join(extra))
        return GateResult("3-Integrity", "FAIL",
                          "manifest and Run_Units do not match one-to-one", details)

    for key, row in unit_by_key.items():
        page = page_by_key[key]
        file_id = row.get("Output_Manifest_File_ID")
        recorded_output = row.get("Output_SHA256")
        page_file_id = page.get("artifact_file_id")
        transport_sha = page.get("artifact_file_sha256")

        if not isinstance(file_id, str) or not file_id:
            details.append(f"{key}: missing Output_Manifest_File_ID")
            failures += 1
            continue
        if page_file_id != file_id:
            details.append(f"{key}: artifact_file_id does not match Run_Units file ID")
            failures += 1
            continue
        if not isinstance(recorded_output, str) or not _SHA256_RE.fullmatch(recorded_output):
            details.append(f"{key}: Output_SHA256 missing or malformed")
            failures += 1
            continue
        if not isinstance(transport_sha, str) or not transport_sha:
            details.append(f"{key}: artifact_file_sha256 missing")
            incomplete += 1
            continue
        if not _SHA256_RE.fullmatch(transport_sha):
            details.append(f"{key}: artifact_file_sha256 malformed")
            failures += 1
            continue

        try:
            raw = _download_bytes(drive, file_id)
        except Exception as exc:
            details.append(f"{key}: artifact download failed: {exc}")
            failures += 1
            continue
        if hashlib.sha256(raw).hexdigest() != transport_sha:
            details.append(f"{key}: artifact transport SHA-256 mismatch")
            failures += 1
            continue

        try:
            artifact = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            details.append(f"{key}: artifact is not valid UTF-8 JSON")
            failures += 1
            continue
        if not isinstance(artifact, dict):
            details.append(f"{key}: artifact root is not a JSON object")
            failures += 1
            continue

        if _hash_payload(artifact, "output_sha256") != recorded_output:
            details.append(f"{key}: content output_sha256 mismatch")
            failures += 1
            continue
        if page.get("output_sha256") != recorded_output:
            details.append(f"{key}: manifest output_sha256 differs from Run_Units")
            failures += 1
            continue

        identity = {
            "run_id": run_id,
            "catalog_id": manifest.get("catalog_id"),
            "run_unit_id": row.get("Run_Unit_ID"),
            "catalog_page_id": row.get("Catalog_Page_ID"),
            "unit_key": key,
            "input_sha256": row.get("Input_SHA256"),
            "unit_status": row.get("Unit_Status"),
        }
        mismatch = [
            name for name, expected in identity.items()
            if artifact.get(name) != expected or page.get(name) != expected
        ]
        if artifact.get("page_number") != page.get("page_number"):
            mismatch.append("page_number")
        if artifact.get("source_pdf_sha256") != manifest.get("source_sha256"):
            mismatch.append("source_pdf_sha256")
        if mismatch:
            details.append(f"{key}: artifact/page identity mismatch ({', '.join(mismatch)})")
            failures += 1
        else:
            details.append(f"{key}: Tier-A content and raw transport verified")

    if failures:
        return GateResult("3-Integrity", "FAIL", f"{failures} integrity failure(s)", details, "A")
    if incomplete:
        return GateResult("3-Integrity", "INCOMPLETE",
                          f"{incomplete} unit(s) lack transport evidence", details, "A")
    return GateResult("3-Integrity", "PASS",
                      f"{len(completed)} units: Tier-A content + transport verified",
                      details, "A")
