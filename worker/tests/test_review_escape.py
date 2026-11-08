import json
from pathlib import Path

from catalog_worker.review_server import create_app


def test_review_page_does_not_interpolate_supplier_markup(tmp_path: Path):
    staging = tmp_path / "staging-set.json"
    staging.write_text(json.dumps({
        "products": [{
            "staging_id": "stg_prd_1",
            "proposed_product_name": "<script>alert(1)</script>",
            "source_quote": "\" onmouseover=\"alert(1)",
            "review_status": "PENDING",
            "page_number": 1,
            "flags": ["<img src=x onerror=alert(1)>"]
        }],
        "variants": [],
        "specifications": []
    }), encoding="utf-8")
    app = create_app(staging, tmp_path / "catalog")
    client = app.test_client()
    html = client.get("/").get_data(as_text=True)
    assert "<script>alert(1)</script>" not in html
    assert "onmouseover" not in html
    assert "innerHTML" not in html
    payload = client.get("/api/staging").get_json()
    assert payload["products"][0]["proposed_product_name"] == "<script>alert(1)</script>"
