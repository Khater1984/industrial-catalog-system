"""CLI entry point for rendering a validated immutable issue snapshot."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from .pdf_renderer import render_snapshot_file

def main() -> int:
    parser=argparse.ArgumentParser(description="Render a synthetic or approved issue snapshot to PDF")
    parser.add_argument("--snapshot",required=True)
    parser.add_argument("--output",required=True)
    parser.add_argument("--asset-root")
    parser.add_argument("--report")
    args=parser.parse_args()
    report=render_snapshot_file(args.snapshot,args.output,asset_root=args.asset_root,report_path=args.report)
    print(json.dumps(report,ensure_ascii=False))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
