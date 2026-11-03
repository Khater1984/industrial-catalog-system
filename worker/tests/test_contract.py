"""Cross-check the local worker protocol against the Apps Script V2.1 registry."""
import re
from pathlib import Path

from reportlab.pdfgen import canvas

from catalog_worker.resumable import (
    MANIFEST_VERSION,
    RUN_STATUSES,
    RUN_TYPE,
    UNIT_STATUSES,
    UNIT_TYPE,
    process_resumable_catalog_job,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[2]
SCHEMA_JS = ROOT / "apps-script" / "src" / "config" / "Schema.js"


def enum_values(schema_source: str, key: str) -> set[str]:
    match = re.search(re.escape('"' + key + '"') + r"\s*:\s*\[([^\]]*)\]", schema_source, re.S)
    assert match, f"Missing enum registry entry: {key}"
    return set(re.findall(r'"([^"]+)"', match.group(1)))


def table_columns(schema_source: str, table_name: str) -> set[str]:
    match = re.search(
        re.escape(table_name) + r":\s*\[([^\]]*)\]",
        schema_source,
        re.S,
    )
    assert match, f"Missing table in Apps Script schema: {table_name}"
    return set(re.findall(r'"([^"]+)"', match.group(1)))


def test_worker_enums_match_authoritative_apps_script_schema():
    schema = SCHEMA_JS.read_text(encoding="utf-8")
    assert RUN_TYPE in enum_values(schema, "Run_Log.Run_Type")
    assert RUN_STATUSES == enum_values(schema, "Run_Log.Run_Status")
    assert UNIT_TYPE in enum_values(schema, "Run_Units.Unit_Type")
    assert UNIT_STATUSES == enum_values(schema, "Run_Units.Unit_Status")


def test_worker_persistence_columns_exist_in_apps_script_schema():
    schema = SCHEMA_JS.read_text(encoding="utf-8")
    run_log = table_columns(schema, "Run_Log")
    run_units = table_columns(schema, "Run_Units")
    assert {
        "Run_ID", "Run_Type", "Catalog_ID", "Logical_Job_ID", "Parent_Run_ID",
        "Attempt_Number", "Retry_Reason", "Idempotency_Key", "Run_Status",
        "Total_Units", "Completed_Units", "Failed_Units", "Worker_Version",
        "Started_At", "Finished_At", "Input_Manifest_File_ID", "Output_Manifest_File_ID",
    }.issubset(run_log)
    assert {
        "Run_Unit_ID", "Run_ID", "Unit_Type", "Unit_Key", "Catalog_Page_ID",
        "Unit_Status", "Input_SHA256", "Output_Manifest_File_ID", "Output_SHA256",
        "Reused_From_Run_Unit_ID",
    }.issubset(run_units)


def test_worker_result_manifest_matches_registered_run_and_unit_enums(tmp_path):
    source = tmp_path / "catalog.pdf"
    pdf = canvas.Canvas(str(source))
    pdf.drawString(72, 720, "Synthetic pump catalogue")
    pdf.showPage()
    pdf.save()

    result = process_resumable_catalog_job({
        "run_id": "contract_run_001",
        "logical_job_id": "contract_job_001",
        "catalog_id": "contract_catalog_001",
        "source_pdf_path": str(source),
        "source_sha256": sha256_file(source),
        "attempt_number": 1,
        "catalog_page_ids": ["contract_page_001"],
    }, tmp_path / "out")

    assert result["manifest_version"] == MANIFEST_VERSION == 2
    assert result["run_type"] in enum_values(SCHEMA_JS.read_text(encoding="utf-8"), "Run_Log.Run_Type")
    assert result["run_status"] in RUN_STATUSES
    assert result["manifest_sha256"]
    assert {
        "run_id", "logical_job_id", "idempotency_key", "attempt_number",
        "catalog_id", "source_sha256", "job_input_sha256", "page_count",
        "completed_units", "failed_units", "reused_units", "newly_processed_units",
        "run_status", "pages", "manifest_sha256",
    }.issubset(result)
    assert len(result["pages"]) == 1
    page = result["pages"][0]
    assert page["unit_type"] == UNIT_TYPE
    assert page["unit_status"] in UNIT_STATUSES
    assert page["unit_key"] == "contract_page_001"
    # Local DEV artifacts are intentionally not presented as Drive file IDs.
    assert page["artifact_path"] == "pages/page-00001.json"
    assert "output_manifest_file_id" not in page
