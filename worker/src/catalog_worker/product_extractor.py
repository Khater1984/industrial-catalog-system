"""Lightweight heuristic product/model/spec candidate extractor from page text.

This is a deterministic, rule-based first pass. It does not use LLMs or external services.
Output is staging-compatible records for human review.
"""
from __future__ import annotations

import re
from typing import Any


def extract_candidates(page_text: str, page_number: int, catalog_page_id: str | None = None) -> dict[str, list[dict[str, Any]]]:
    """Return proposed products, variants, and specifications from raw page text."""
    products: list[dict[str, Any]] = []
    variants: list[dict[str, Any]] = []
    specifications: list[dict[str, Any]] = []

    # Simple patterns common in industrial catalogs
    model_pattern = re.compile(r"\b([A-Z]{1,4}[-_]?\d{2,6}[A-Z0-9-]*)\b")
    spec_pattern = re.compile(r"([A-Za-z\u0600-\u06FF\s]{3,40})\s*[:=]\s*([\d.,]+)\s*([A-Za-z\u00b0/%]+)?", re.UNICODE)

    lines = [ln.strip() for ln in page_text.splitlines() if ln.strip()]
    seen_models = set()

    for line in lines:
        # Potential product title (longer lines with capital start or Arabic)
        if 20 < len(line) < 120 and (line[0].isupper() or any("\u0600" <= c <= "\u06FF" for c in line)):
            products.append({
                "proposed_product_name": line[:200],
                "page_number": page_number,
                "catalog_page_id": catalog_page_id,
                "source_quote": line[:500],
                "confidence": "LOW",
                "flags": ["HEURISTIC"],
                "review_status": "PENDING",
            })

        for match in model_pattern.finditer(line):
            model = match.group(1)
            if model not in seen_models and len(model) >= 4:
                seen_models.add(model)
                variants.append({
                    "proposed_model_number": model,
                    "proposed_model_name": model,
                    "page_number": page_number,
                    "catalog_page_id": catalog_page_id,
                    "source_quote": line[:500],
                    "confidence": "MEDIUM",
                    "flags": ["HEURISTIC_MODEL"],
                    "review_status": "PENDING",
                })

        for match in spec_pattern.finditer(line):
            key, value, unit = match.group(1).strip(), match.group(2), match.group(3) or ""
            if len(key) > 2 and len(value) > 0:
                specifications.append({
                    "attribute_key_raw": key[:120],
                    "value_raw": value,
                    "unit_raw": unit[:40],
                    "page_number": page_number,
                    "catalog_page_id": catalog_page_id,
                    "source_quote": line[:500],
                    "confidence": "LOW",
                    "flags": ["HEURISTIC_SPEC"],
                    "review_status": "PENDING",
                })

    # De-duplicate roughly
    products = products[:5]
    variants = variants[:10]
    specifications = specifications[:15]
    return {"products": products, "variants": variants, "specifications": specifications}
