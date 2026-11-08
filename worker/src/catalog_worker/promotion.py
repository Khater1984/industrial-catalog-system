"""Local promotion of reviewed staging records.

Source staging records are never overwritten. Accepted edits are recorded as
Specification_Changes. Rejected records are not promoted.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _canonical(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _sha(value: Any) -> str:
    return hashlib.sha256(_canonical(value)).hexdigest()


def _stable_id(prefix: str, seed: str) -> str:
    return f"{prefix}_{hashlib.sha256(seed.encode('utf-8')).hexdigest()[:16]}"


def _load(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def _save(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def promote_reviewed_staging(staging_path: str | Path, catalog_dir: str | Path, actor: str = "local_reviewer") -> dict[str, Any]:
    staging_file = Path(staging_path)
    original_bytes = staging_file.read_bytes()
    staging = json.loads(original_bytes)
    root = Path(catalog_dir)
    db_path = root / "catalog-db.json"
    audit_path = root / "audit-log.json"
    changes_path = root / "specification-changes.json"
    db = _load(db_path, {"products": [], "variants": [], "specifications": [], "source_records": []})
    audit = _load(audit_path, {"events": []})
    changes = _load(changes_path, {"changes": []})
    now = _now()
    promoted = {"products": 0, "variants": 0, "specifications": 0, "rejected": 0, "skipped": 0}
    product_map: dict[str, str] = {}
    variant_map: dict[str, str] = {}

    for product in staging["products"]:
        if product.get("review_status") != "ACCEPTED":
            promoted["rejected" if product.get("review_status") == "REJECTED" else "skipped"] += 1
            continue
        source_key = f"{product['catalog_id']}|{product['catalog_page_id']}|{product['proposed_product_name']}"
        product_id = _stable_id("prd", source_key)
        product_map[product["staging_id"]] = product_id
        if not any(row["Product_ID"] == product_id for row in db["products"]):
            db["products"].append({
                "Product_ID": product_id,
                "Lifecycle_Status": "ACTIVE",
                "Canonical_Notes": product["proposed_product_name"],
                "Created_At": now,
                "Created_By": actor,
            })
            db["source_records"].append({
                "Entity_Type": "PRODUCT",
                "Entity_ID": product_id,
                "Source_Staging_ID": product["staging_id"],
                "Catalog_ID": product["catalog_id"],
                "Catalog_Page_ID": product["catalog_page_id"],
                "Source_Quote": product["source_quote"],
                "Source_Record_Key": source_key,
            })
            promoted["products"] += 1
        else:
            promoted["skipped"] += 1
        audit["events"].append({"Action": "PROMOTE_PRODUCT", "Entity_ID": product_id, "At": now, "Actor": actor})

    for variant in staging["variants"]:
        if variant.get("review_status") != "ACCEPTED":
            promoted["rejected" if variant.get("review_status") == "REJECTED" else "skipped"] += 1
            continue
        product_id = product_map.get(variant["parent_staging_product_id"])
        if not product_id:
            promoted["skipped"] += 1
            continue
        source_key = f"{product_id}|{variant['proposed_model_number']}"
        variant_id = _stable_id("var", source_key)
        variant_map[variant["staging_id"]] = variant_id
        if not any(row["Variant_ID"] == variant_id for row in db["variants"]):
            db["variants"].append({
                "Variant_ID": variant_id,
                "Product_ID": product_id,
                "Lifecycle_Status": "ACTIVE",
                "Canonical_Notes": variant["proposed_model_number"],
                "Created_At": now,
                "Created_By": actor,
            })
            db["source_records"].append({
                "Entity_Type": "VARIANT",
                "Entity_ID": variant_id,
                "Source_Staging_ID": variant["staging_id"],
                "Catalog_Page_ID": variant["catalog_page_id"],
                "Source_Quote": variant["source_quote"],
                "Source_Record_Key": source_key,
            })
            promoted["variants"] += 1
        else:
            promoted["skipped"] += 1
        audit["events"].append({"Action": "PROMOTE_VARIANT", "Entity_ID": variant_id, "At": now, "Actor": actor})

    for spec in staging["specifications"]:
        if spec.get("review_status") != "ACCEPTED":
            promoted["rejected" if spec.get("review_status") == "REJECTED" else "skipped"] += 1
            continue
        variant_id = variant_map.get(spec["parent_staging_variant_id"])
        product_id = product_map.get(spec["parent_staging_product_id"])
        if not variant_id or not product_id:
            promoted["skipped"] += 1
            continue
        source_key = f"{variant_id}|{spec['attribute_key_raw']}|{spec['value_raw']}|{spec['unit_raw']}"
        spec_id = _stable_id("spec", source_key)
        if not any(row["Specification_ID"] == spec_id for row in db["specifications"]):
            db["specifications"].append({
                "Specification_ID": spec_id,
                "Scope": "VARIANT",
                "Product_ID": product_id,
                "Variant_ID": variant_id,
                "Attribute_Key_Source": spec["attribute_key_raw"],
                "Attribute_Value_Source": spec["value_raw"],
                "Unit_Source": spec["unit_raw"],
                "Catalog_Page_ID": spec["catalog_page_id"],
                "Source_Quote": spec["source_quote"],
                "Extraction_Run_ID": spec["run_id"],
                "Created_At": now,
                "Created_By": actor,
            })
            promoted["specifications"] += 1
            if spec.get("edited"):
                changes["changes"].append({
                    "Specification_Change_ID": _stable_id("chg", source_key + now),
                    "Operation": "UPDATE",
                    "Target_Specification_ID": spec_id,
                    "Before": spec.get("original_value_raw"),
                    "After": spec["value_raw"],
                    "Reason": spec.get("edit_reason", "Accepted reviewer edit"),
                    "Created_At": now,
                    "Created_By": actor,
                })
        else:
            promoted["skipped"] += 1
        audit["events"].append({"Action": "PROMOTE_SPECIFICATION", "Entity_ID": spec_id, "At": now, "Actor": actor})

    _save(db_path, db)
    _save(audit_path, audit)
    _save(changes_path, changes)
    if staging_file.read_bytes() != original_bytes:
        raise RuntimeError("SOURCE_STAGING_MUTATED")
    return {"promoted": promoted, "catalog_db": str(db_path), "source_unchanged": True, "source_sha256": _sha(json.loads(original_bytes))}
