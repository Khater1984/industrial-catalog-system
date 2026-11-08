"""Create a real Worker result for the Python -> Apps Script contract test."""
from __future__ import annotations
import hashlib, json, sys
from pathlib import Path
from pypdf import PdfWriter
from catalog_worker.resumable import _hash_payload, canonical_json_bytes, process_resumable_catalog_job, sha256_file

def main(output_dir: str) -> None:
    root = Path(output_dir)
    root.mkdir(parents=True, exist_ok=True)
    pdf_path = root / "source.pdf"
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    with pdf_path.open("wb") as stream:
        writer.write(stream)
    run_id, logical_job_id, catalog_id = "run_contract_001", "job_contract_001", "catalog_contract_001"
    source_sha = sha256_file(pdf_path)
    identity = "|".join([logical_job_id, run_id, "1", "", "", source_sha])
    key = hashlib.sha256(identity.encode("utf-8")).hexdigest()
    result_dir = root / "worker-output"
    job = {
        "run_id": run_id, "logical_job_id": logical_job_id, "catalog_id": catalog_id,
        "source_pdf_path": str(pdf_path), "source_sha256": source_sha,
        "attempt_number": 1, "catalog_page_ids": [f"cp_{catalog_id}_00001"],
        "idempotency_key": key,
    }
    manifest = process_resumable_catalog_job(job, result_dir)
    artifact_path = result_dir / manifest["pages"][0]["artifact_path"]
    artifact_bytes = artifact_path.read_bytes()
    manifest["pages"][0]["artifact_file_id"] = "artifact-file"
    manifest["pages"][0]["artifact_file_sha256"] = hashlib.sha256(artifact_bytes).hexdigest()
    manifest["pages"][0]["output_manifest_file_id"] = "artifact-file"
    manifest["manifest_sha256"] = _hash_payload(manifest, "manifest_sha256")
    (root / "artifact.json").write_bytes(artifact_bytes)
    (root / "manifest.json").write_bytes(canonical_json_bytes(manifest))
    print(json.dumps({
        "run_id": run_id, "logical_job_id": logical_job_id, "catalog_id": catalog_id,
        "source_sha256": source_sha, "idempotency_key": key,
    }))

if __name__ == "__main__":
    main(sys.argv[1])
