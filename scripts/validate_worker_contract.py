"""Static cross-language guard for the Worker <-> Apps Script V1/V2 contract."""
from pathlib import Path

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
    "Cloud Tasks dispatch has a bounded deadline": '"dispatch_deadline": {"seconds": 1800}' in service,
    "Apps Script dispatch uses HTTPS": 'endpoint.indexOf("https://") !== 0' in integration,
    "Apps Script result polling reads Drive manifests": 'getFilesByName("result-manifest.json")' in integration,
    "Apps Script poller invokes validated ingestion": "Ingest.ingestManifest" in integration,
    "Apps Script expires abandoned worker leases": "WORKER_LEASE_EXPIRED" in integration and "Lease_Expires_At" in integration,
    "Ingest clears terminal worker leases": 'Worker_Lease_ID: ""' in ingest and 'Lease_Expires_At: ""' in ingest,
    "Apps Script remains owner-authenticated": "assertPrimaryUser_();" in api,
    "Ingest checks source fingerprint": "manifest.source_sha256 !== catalog.SHA256" in ingest,
    "Ingest validates per-page artifact": "verifyArtifact_(page, manifest)" in ingest,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + name)
if failed:
    raise SystemExit(1)
