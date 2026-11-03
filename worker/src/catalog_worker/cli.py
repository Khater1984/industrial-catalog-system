"""Command line entry point for local DEV worker runs."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .processor import WorkerError, process_catalog_job


def main() -> int:
    parser = argparse.ArgumentParser(description="Process a catalog PDF page by page (DEV spike).")
    parser.add_argument("--manifest", required=True, help="Path to a local JSON job manifest.")
    parser.add_argument("--output-dir", required=True, help="Directory for page artifacts and result manifest.")
    args = parser.parse_args()

    try:
        job = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
        result = process_catalog_job(job, args.output_dir)
        print(json.dumps({
            "ok": True,
            "run_id": result["run_id"],
            "run_status": result["run_status"],
            "page_count": result["page_count"],
            "completed_units": result["completed_units"],
            "reused_units": result["reused_units"],
            "manifest_sha256": result["manifest_sha256"],
        }, ensure_ascii=False))
        return 0
    except WorkerError as exc:
        print(json.dumps({"ok": False, "error": {"code": exc.code, "message": exc.message}}, ensure_ascii=False), file=sys.stderr)
        return 2
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"ok": False, "error": {"code": "JOB_INPUT_ERROR", "message": str(exc)}}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
