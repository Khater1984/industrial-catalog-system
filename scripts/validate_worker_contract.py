"""Static cross-language guard for the Worker <-> Apps Script V1/V2 contract."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / "worker/src/catalog_worker/resumable.py").read_text()
runner = (ROOT / "worker/src/catalog_worker/runner.py").read_text()
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
    "runner streams page checkpoints to Drive": "artifact_callback=publish_checkpoint" in runner and "artifact_callback: Callable" in worker,
    "runner publishes artifact Drive IDs": 'row["artifact_file_id"] = artifact_id' in runner,
    "runner publishes raw artifact hashes": 'row["artifact_file_sha256"] = raw_sha' in runner,
    "GitHub Actions dispatch workflow is manual": "workflow_dispatch:" in (ROOT / ".github/workflows/catalog-worker-dispatch.yml").read_text(),
    "GitHub workflow accepts run and job IDs": "run_id:" in (ROOT / ".github/workflows/catalog-worker-dispatch.yml").read_text() and "job_file_id:" in (ROOT / ".github/workflows/catalog-worker-dispatch.yml").read_text(),
    "GitHub worker entry point calls Drive runner": "runner.run_from_drive(" in (ROOT / "worker/src/catalog_worker/github_actions_cli.py").read_text(),
    "Drive worker supports Workspace OAuth": "GOOGLE_OAUTH_CREDENTIALS_JSON" in (ROOT / "worker/src/catalog_worker/drive_io.py").read_text(),
    "Apps Script dispatches GitHub workflow": "api.github.com/repos/Khater1984/industrial-catalog-system/actions/workflows/catalog-worker-dispatch.yml/dispatches" in integration,
    "Apps Script result polling reads Drive manifests": 'getFilesByName("result-manifest.json")' in integration,
    "Apps Script poller invokes validated ingestion": "Ingest.ingestManifest" in integration,
    "Apps Script expires abandoned worker leases": "WORKER_LEASE_EXPIRED" in integration and "Lease_Expires_At" in integration,
    "Ingest clears terminal worker leases": 'Worker_Lease_ID: ""' in ingest and 'Lease_Expires_At: ""' in ingest,
    "Apps Script remains owner-authenticated": "assertPrimaryUser_();" in api,
    "Ingest checks source fingerprint": "manifest.source_sha256 !== catalog.SHA256" in ingest,
    "Run_Log key is created from the attempt identity": 'logicalJobId + "|" + runId' in (ROOT / "apps-script/src/domain/CatalogService.js").read_text(),
    "Apps Script dispatch persists the same key": "idempotency_key: idempotencyKey" in integration,
    "Worker requires the supplied attempt key": 'job.get("idempotency_key") != expected_key' in worker,
    "Worker result carries the same key": '"idempotency_key": expected_key' in worker,
    "Ingest binds result to Run_Log key": "MANIFEST_IDEMPOTENCY_MISMATCH" in ingest,
    "Ingest validates per-page artifact": "verifyArtifact_(page, manifest)" in ingest,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + name)
if failed:
    raise SystemExit(1)
