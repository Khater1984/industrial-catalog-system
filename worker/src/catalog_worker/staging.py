"""Deterministic staging extraction for the first operational path.

This module only extracts explicitly labeled records. It does not infer
products, models, or specifications from free text.
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

EXTRACTOR_VERSION = "staging-explicit-v1"
SOURCE_KEY_VERSION = "source-key-v1"
INCOMPLETE_MARKERS = {"", "-", "n/a", "na", "unknown", "not stated", "غير محدد"}

PRODUCT_RE = re.compile(r"^PRODUCT:\s*(.+)$", re.IGNORECASE)
VARIANT_RE = re.compile(r"^VARIANT:\s*(.+)$", re.IGNORECASE)
SPEC_RE = re.compile(r"^SPEC:\s*(.+?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*$", re.IGNORECASE)


class StagingExtractionError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _canonical(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _sha(value: Any) -> str:
    return hashlib.sha256(_canonical(value)).hexdigest()


def _id(prefix: str, seed: str) -> str:
    return f"{prefix}_{hashlib.sha256(seed.encode('utf-8')).hexdigest()[:16]}"


def _clean(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _is_incomplete(value: str) -> bool:
    return _clean(value).lower() in INCOMPLETE_MARKERS


def extract_staging_from_text(
    page_text: str,
    *,
    run_id: str,
    catalog_id: str,
    catalog_page_id: str,
    page_number: int = 1,
    source_sha256: str = "",
) -> dict[str, Any]:
    """Parse only explicit PRODUCT/VARIANT/SPEC lines into staging records."""
    if not page_text or not page_text.strip():
        raise StagingExtractionError("NO_EXTRACTABLE_TEXT", "Page text is empty.")
    lines = [line.strip() for line in page_text.splitlines() if line.strip()]
    products: list[dict[str, Any]] = []
    variants: list[dict[str, Any]] = []
    specifications: list[dict[str, Any]] = []
    current_product = None
    current_variant = None
    now = _now()

    for line in lines:
        product_match = PRODUCT_RE.match(line)
        if product_match:
            name = _clean(product_match.group(1))
            if not name:
                raise StagingExtractionError("INVALID_PRODUCT_LINE", "PRODUCT line is empty.")
            current_product = {
                "staging_id": _id("stg_prd", f"{catalog_id}|{catalog_page_id}|{name}"),
                "entity_type": "PRODUCT",
                "run_id": run_id,
                "catalog_id": catalog_id,
                "catalog_page_id": catalog_page_id,
                "page_number": page_number,
                "source_region": f"page:{page_number}:PRODUCT",
                "source_quote": line,
                "extracted_text": name,
                "proposed_product_name": name,
                "confidence": "HIGH",
                "proposed_status": "NEEDS_REVIEW",
                "review_status": "PENDING",
                "flags": [],
                "created_at": now,
                "updated_at": now,
            }
            current_product["staging_record_hash"] = _sha(current_product)
            products.append(current_product)
            current_variant = None
            continue

        variant_match = VARIANT_RE.match(line)
        if variant_match:
            if not current_product:
                raise StagingExtractionError("VARIANT_WITHOUT_PRODUCT", "VARIANT appeared before PRODUCT.")
            model = _clean(variant_match.group(1))
            if not model:
                raise StagingExtractionError("INVALID_VARIANT_LINE", "VARIANT line is empty.")
            current_variant = {
                "staging_id": _id("stg_var", f"{current_product['staging_id']}|{model}"),
                "entity_type": "VARIANT",
                "run_id": run_id,
                "catalog_id": catalog_id,
                "catalog_page_id": catalog_page_id,
                "page_number": page_number,
                "parent_staging_product_id": current_product["staging_id"],
                "source_region": f"page:{page_number}:VARIANT",
                "source_quote": line,
                "extracted_text": model,
                "proposed_model_number": model,
                "proposed_model_name": model,
                "confidence": "HIGH",
                "proposed_status": "NEEDS_REVIEW",
                "review_status": "PENDING",
                "flags": [],
                "created_at": now,
                "updated_at": now,
            }
            current_variant["staging_record_hash"] = _sha(current_variant)
            variants.append(current_variant)
            continue

        spec_match = SPEC_RE.match(line)
        if spec_match:
            if not current_variant:
                raise StagingExtractionError("SPEC_WITHOUT_VARIANT", "SPEC appeared before VARIANT.")
            key = _clean(spec_match.group(1))
            value = _clean(spec_match.group(2))
            unit = _clean(spec_match.group(3))
            flags = []
            parse_status = "PARSED"
            if not key:
                raise StagingExtractionError("INVALID_SPEC_LINE", "SPEC key is empty.")
            if _is_incomplete(value):
                flags.append("MISSING_VALUE")
                parse_status = "INCOMPLETE"
            if _is_incomplete(unit):
                flags.append("MISSING_UNIT")
                parse_status = "INCOMPLETE"
            record = {
                "staging_id": _id("stg_spec", f"{current_variant['staging_id']}|{key}|{value}|{unit}"),
                "entity_type": "SPECIFICATION",
                "run_id": run_id,
                "catalog_id": catalog_id,
                "catalog_page_id": catalog_page_id,
                "page_number": page_number,
                "parent_staging_product_id": current_product["staging_id"],
                "parent_staging_variant_id": current_variant["staging_id"],
                "source_region": f"page:{page_number}:SPEC",
                "source_quote": line,
                "extracted_text": line,
                "attribute_key_raw": key,
                "value_raw": value,
                "unit_raw": unit,
                "normalized_key": key.lower().replace(" ", "_"),
                "normalized_value": value,
                "normalized_unit": unit,
                "confidence": "MEDIUM" if flags else "HIGH",
                "proposed_status": "NEEDS_REVIEW",
                "review_status": "PENDING",
                "parse_status": parse_status,
                "flags": flags,
                "created_at": now,
                "updated_at": now,
            }
            record["staging_record_hash"] = _sha(record)
            specifications.append(record)

    if not products or not variants or not specifications:
        raise StagingExtractionError(
            "INSUFFICIENT_LABELED_DATA",
            "Expected at least one PRODUCT, one VARIANT, and one SPEC line.",
        )
    payload = {
        "extractor_version": EXTRACTOR_VERSION,
        "source_key_algorithm_version": SOURCE_KEY_VERSION,
        "run_id": run_id,
        "catalog_id": catalog_id,
        "catalog_page_id": catalog_page_id,
        "source_sha256": source_sha256,
        "page_number": page_number,
        "products": products,
        "variants": variants,
        "specifications": specifications,
        "created_at": now,
    }
    payload["staging_set_sha256"] = _sha(payload)
    return payload


def write_staging_set(payload: dict[str, Any], output_dir: str | Path) -> Path:
    root = Path(output_dir)
    root.mkdir(parents=True, exist_ok=True)
    path = root / "staging-set.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path
