"""Static cross-language guard for the Worker <-> Apps Script V1/V2 contract."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / "worker/src/catalog_worker/resumable.py").read_text()
runner = (ROOT / "worker/src/catalog_worker/runner.py").read_text()
service = (ROOT / "worker/src/catalog_worker/service.py").read_text()
integration = (ROOT / "apps-script/src/domain/WorkerIntegration.js").read_text()
ingest = (ROOT / "apps-script/src/domain/Ingest.js").read_text()
api = (ROOT / "apps-script/src/api/Api.js").read_text()

checks = {
    "worker protocol version": 'PROTOCOL_VERSION = "1"' in worker,
    "worker manifest version": "MANIFEST_VERSION = 2" in worker,
    "Apps Script contract version": 'var CONTRACT_VERSION = "1"' in integration,
    "Ingest protocol version": 'manifest.protocol_version !== "1"' in ingest,
    "Ingest manifest version": "manifest.manifest_version !== 2" in ingest,
    "runner uses actual resumable entry point": "process_resumable_catalog_job(" in runner,
    "runner publishes artifact Drive IDs": 'row["artifact_file_id"] = artifact_id' in runner,
    "runner publishes raw artifact hashes": 'row["artifact_file_sha256"] = raw_sha' in runner,
    "service exposes dispatch endpoint": '@app.post("/run")' in service,
    "service exposes durable task endpoint": '@app.post("/tasks/run")' in service,
    "Apps Script dispatch uses HTTPS": 'endpoint.indexOf("https://") !== 0' in integration,
    "Apps Script callback uses body token": 'body.callback_token' in integration,
    "API routes callback": 'body.action === "worker.callback"' in api,
    "Ingest checks source fingerprint": 'manifest.source_sha256 !== catalog.SHA256' in ingest,
    "Ingest validates per-page artifact": "verifyArtifact_(page, manifest)" in ingest,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + name)
if failed:
    raise SystemExit(1)
