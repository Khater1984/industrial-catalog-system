from catalog_worker.product_extractor import extract_candidates


def test_extracts_model_and_spec_from_sample_text():
    text = """Industrial Pump Model XP-4500
Flow Rate: 120 L/min
Pressure: 8.5 bar
Model ABC-123 is available."""
    result = extract_candidates(text, page_number=3, catalog_page_id="page_003")
    assert len(result["variants"]) >= 1
    assert any("XP-4500" in v["proposed_model_number"] or "ABC-123" in v["proposed_model_number"] for v in result["variants"])
    assert len(result["specifications"]) >= 1
    assert result["products"]  # at least the title line


def test_handles_empty_text():
    result = extract_candidates("", 1)
    assert result == {"products": [], "variants": [], "specifications": []}
