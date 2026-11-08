import json
from pathlib import Path

from reportlab.pdfgen import canvas

from catalog_worker.promotion import promote_reviewed_staging
from catalog_worker.resumable import process_resumable_catalog_job, sha256_file
from catalog_worker.staging import extract_staging_from_text, write_staging_set


def make_pdf(path: Path) -> None:
    pdf = canvas.Canvas(str(path))
    lines = [
        "PRODUCT: Plate Compactor PC Series",
        "VARIANT: PC90",
        "SPEC: Plate size | 600x450 | mm",
        "SPEC: Weight | 90 | kg",
        "SPEC: Engine power |  | kW",
        "VARIANT: PC100",
        "SPEC: Plate size | 700x500 | mm",
        "SPEC: Weight | 110 | kg",
    ]
    y = 760
    for line in lines:
        pdf.drawString(72, y, line)
        y -= 28
    pdf.save()


def test_full_path_extract_stage_review_promote(tmp_path: Path):
    source = tmp_path / "one-page.pdf"
    make_pdf(source)
    job = {
        "run_id": "run_demo_001",
        "logical_job_id": "job_demo_001",
        "catalog_id": "cat_demo_001",
        "source_pdf_path": str(source),
        "source_sha256": sha256_file(source),
        "catalog_page_ids": ["cp_cat_demo_001_00001"],
    }
    result = process_resumable_catalog_job(job, tmp_path / "worker-out")
    page = json.loads((tmp_path / "worker-out/pages/page-00001.json").read_text())
    assert "PRODUCT: Plate Compactor PC Series" in page["extracted_text"]
    staging = extract_staging_from_text(
        page["extracted_text"],
        run_id=result["run_id"],
        catalog_id=result["catalog_id"],
        catalog_page_id=page["catalog_page_id"],
        source_sha256=result["source_sha256"],
    )
    assert len(staging["products"]) == 1
    assert len(staging["variants"]) == 2
    assert len(staging["specifications"]) == 5
    incomplete = [s for s in staging["specifications"] if "MISSING_VALUE" in s["flags"]]
    assert len(incomplete) == 1
    path = write_staging_set(staging, tmp_path / "staging")
    data = json.loads(path.read_text())
    data["products"][0]["review_status"] = "ACCEPTED"
    data["variants"][0]["review_status"] = "ACCEPTED"
    data["variants"][1]["review_status"] = "REJECTED"
    data["specifications"][0]["review_status"] = "ACCEPTED"
    data["specifications"][1]["original_value_raw"] = data["specifications"][1]["value_raw"]
    data["specifications"][1]["value_raw"] = "91"
    data["specifications"][1]["edited"] = True
    data["specifications"][1]["review_status"] = "ACCEPTED"
    data["specifications"][2]["review_status"] = "REJECTED"
    data["specifications"][3]["review_status"] = "ACCEPTED"
    data["specifications"][4]["review_status"] = "ACCEPTED"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    before = path.read_bytes()
    promoted = promote_reviewed_staging(path, tmp_path / "catalog")
    assert path.read_bytes() == before
    db = json.loads((tmp_path / "catalog/catalog-db.json").read_text())
    assert len(db["products"]) == 1
    assert len(db["variants"]) == 1
    assert len(db["specifications"]) == 2
    again = promote_reviewed_staging(path, tmp_path / "catalog")
    db2 = json.loads((tmp_path / "catalog/catalog-db.json").read_text())
    assert len(db2["products"]) == 1
    assert len(db2["variants"]) == 1
    assert len(db2["specifications"]) == 2
    assert again["promoted"]["skipped"] >= 1
    changes = json.loads((tmp_path / "catalog/specification-changes.json").read_text())
    assert changes["changes"][0]["Operation"] == "UPDATE"
    assert promoted["source_unchanged"] is True
