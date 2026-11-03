"""CLI for the V2.1 resumable local DEV worker."""
import argparse
import json
import sys
from pathlib import Path

from .resumable import WorkerError, process_resumable_catalog_job


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the V2.1 resumable PDF text worker (local DEV only).")
    parser.add_argument("--job", required=True, help="Path to job JSON")
    parser.add_argument("--output", required=True, help="Output directory")
    args = parser.parse_args()
    try:
        job = json.loads(Path(args.job).read_text(encoding="utf-8"))
        result = process_resumable_catalog_job(job, args.output)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except WorkerError as exc:
        print(json.dumps({"error": exc.code, "message": exc.message}, ensure_ascii=False), file=sys.stderr)
        return 2
    except (OSError, ValueError) as exc:
        print(json.dumps({"error": "CLI_INPUT_ERROR", "message": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
