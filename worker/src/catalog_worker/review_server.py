"""Local review server for the first operational path, with image support.

Run:
  python -m catalog_worker.review_server --staging path/to/staging-set.json --catalog path/to/catalog
Then open http://<machine-ip>:8765 from a phone on the same network.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory

from catalog_worker.promotion import promote_reviewed_staging

HTML = """<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>مراجعة الاستخراج</title>
<style>
body{margin:0;background:#f4f6f8;font-family:Arial,"Noto Sans Arabic",sans-serif;color:#17212b}
main{max-width:980px;margin:auto;padding:18px}
.card{background:#fff;border:1px solid #e5eaf0;border-radius:14px;padding:16px;margin:12px 0}
h1{font-size:22px;margin:0 0 8px}h2{font-size:16px;margin:0 0 10px}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
button,input{font:inherit;padding:10px 12px;border-radius:8px;border:1px solid #d7dee6}
button{background:#173f5f;color:#fff;border:0;font-weight:700}
.reject{background:#b42318}.accept{background:#18794e}
.flag{background:#fff5e5;color:#a15c00;padding:4px 8px;border-radius:20px;font-size:12px}
.muted{color:#697786;font-size:13px}
.img-thumb{max-width:180px;max-height:140px;border-radius:8px;margin:8px 0}
</style></head><body><main>
<h1>مراجعة نتائج الاستخراج</h1>
<p class="muted">لا يتم اعتماد أي سجل إلا بعد القبول اليدوي. البيانات المرفوضة لا تنتقل إلى الكتالوج.</p>
<div id="app"></div>
<div class="card"><button id="promote">اعتماد المقبول فقط</button><pre id="result"></pre></div>
<script>
function text(value){return document.createTextNode(value == null ? "" : String(value));}
function el(tag, className, value){const node=document.createElement(tag); if(className) node.className=className; if(value != null) node.appendChild(text(value)); return node;}
async function load(){
  const response = await fetch("/api/staging");
  if (!response.ok) throw new Error("تعذر تحميل بيانات المراجعة");
  const data = await response.json();
  const app=document.getElementById("app");
  app.replaceChildren();
  [["منتج", data.products, "products"], ["موديل", data.variants, "variants"], ["مواصفة", data.specifications, "specifications"]].forEach(([label, items, kind]) => {
    (items || []).forEach(item => app.appendChild(card(label, item, kind)));
  });
  if(data.images && data.images.images){
    data.images.images.forEach(img => app.appendChild(imageCard(img)));
  }
}
function card(label, item, kind){
  const section=el("section","card");
  const title=item.proposed_product_name || item.proposed_model_number || item.attribute_key_raw || "";
  section.appendChild(el("h2", "", label + ": " + title));
  section.appendChild(el("div", "muted", "المصدر: " + (item.source_quote || "") + " · الصفحة " + (item.page_number || "") + " · الحالة " + (item.review_status || "")));
  (item.flags || []).forEach(flag => section.appendChild(el("span", "flag", flag)));
  if(kind === "specifications"){const input=document.createElement("input"); input.id="v_" + item.staging_id; input.value=item.value_raw || ""; section.appendChild(input);}
  const row=el("div","row");
  [["قبول","accept","ACCEPTED"],["رفض","reject","REJECTED"]].forEach(([caption, className, status]) => {
    const button=el("button", className, caption);
    button.addEventListener("click", () => decide(kind, item.staging_id, status));
    row.appendChild(button);
  });
  section.appendChild(row); return section;
}
function imageCard(img){
  const section=el("section","card");
  section.appendChild(el("h2", "", "صورة: " + (img.original_name || String(img.sha256 || "").slice(0,8))));
  section.appendChild(el("div", "muted", "الصفحة " + (img.page_number || "") + " · SHA256 " + String(img.sha256 || "").slice(0,16) + "... · الحجم " + (img.file_size_bytes || 0) + " bytes · الحالة " + (img.review_status || "PENDING")));
  const thumb = document.createElement("img");
  thumb.className = "img-thumb";
  thumb.src = "/images/" + encodeURIComponent(img.artifact_path || "").split("%2F").join("/");
  thumb.alt = img.original_name || "image";
  section.appendChild(thumb);
  const row=el("div","row");
  [["قبول","accept","ACCEPTED"],["رفض","reject","REJECTED"]].forEach(([caption, className, status]) => {
    const button=el("button", className, caption);
    button.addEventListener("click", () => decide("images", img.unit_key || img.sha256, status));
    row.appendChild(button);
  });
  section.appendChild(row); return section;
}
async function decide(kind,id,status){
  const field=document.getElementById("v_" + id);
  const value=field ? field.value : null;
  const response=await fetch("/api/review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,id,status,value})});
  const result=await response.json();
  if(!response.ok || !result.ok){document.getElementById("result").textContent=JSON.stringify(result,null,2);return;}
  await load();
}
async function promote(){
  const response=await fetch("/api/promote",{method:"POST"});
  const result=await response.json();
  document.getElementById("result").textContent=JSON.stringify(result,null,2);
}
document.getElementById("promote").addEventListener("click", promote);
load().catch(error => { document.getElementById("result").textContent=error.message; });
</script></main></body></html>"""


def _canonical_sha256(value: Any) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix="." + path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    except Exception:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def create_app(staging_path: Path, catalog_dir: Path) -> Flask:
    app = Flask(__name__)

    def image_manifest_path() -> Path:
        return catalog_dir / "image-manifest.json"

    def load() -> dict:
        data = json.loads(staging_path.read_text(encoding="utf-8"))
        manifest_path = image_manifest_path()
        if manifest_path.exists():
            try:
                data["images"] = json.loads(manifest_path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                data["images"] = None
        return data

    def save(data: dict) -> None:
        clean = {k: v for k, v in data.items() if k != "images"}
        _atomic_write_json(staging_path, clean)

    def save_image_decision(image_id: str, status: str) -> bool:
        manifest_path = image_manifest_path()
        if not manifest_path.is_file():
            return False
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return False
        found = False
        for image in manifest.get("images", []):
            if image.get("unit_key") == image_id or image.get("sha256") == image_id:
                image["review_status"] = status
                image["review_decision_recorded"] = True
                found = True
                break
        if not found:
            return False
        manifest.pop("manifest_sha256", None)
        manifest["manifest_sha256"] = _canonical_sha256(manifest)
        _atomic_write_json(manifest_path, manifest)
        return True

    @app.get("/")
    def index():
        return HTML

    @app.get("/api/staging")
    def staging():
        return jsonify(load())

    @app.get("/images/<path:filename>")
    def serve_image(filename):
        # artifact_path is relative to catalog_dir (e.g. images/page-00001/<sha>.jpg).
        return send_from_directory(catalog_dir, filename)

    @app.post("/api/review")
    def review():
        body = request.get_json(silent=True)
        if not isinstance(body, dict) or body.get("kind") not in {"products", "variants", "specifications", "images"}:
            return jsonify({"ok": False, "error": "INVALID_REVIEW"}), 400
        if body.get("status") not in {"ACCEPTED", "REJECTED"}:
            return jsonify({"ok": False, "error": "INVALID_REVIEW_STATUS"}), 400
        image_id = str(body.get("id") or "").strip()
        if not image_id:
            return jsonify({"ok": False, "error": "INVALID_REVIEW_ID"}), 400

        data = load()
        kind = body["kind"]
        if kind == "images":
            if not save_image_decision(image_id, body["status"]):
                return jsonify({"ok": False, "error": "IMAGE_NOT_FOUND"}), 404
            return jsonify({"ok": True, "kind": "images", "id": image_id, "status": body["status"]})

        found = False
        for item in data.get(kind, []):
            if item.get("staging_id") == image_id:
                if body.get("value") is not None and item.get("value_raw") != body["value"]:
                    item["original_value_raw"] = item.get("value_raw")
                    item["value_raw"] = str(body["value"])[:2000]
                    item["edited"] = True
                    item["edit_reason"] = "Reviewer edit before acceptance"
                item["review_status"] = body["status"]
                item["review_decision_recorded"] = True
                found = True
                break
        if not found:
            return jsonify({"ok": False, "error": "STAGING_RECORD_NOT_FOUND"}), 404
        save(data)
        return jsonify({"ok": True, "kind": kind, "id": image_id, "status": body["status"]})

    @app.post("/api/promote")
    def promote():
        return jsonify(promote_reviewed_staging(staging_path, catalog_dir))

    return app


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--staging", required=True)
    parser.add_argument("--catalog", required=True)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    create_app(Path(args.staging), Path(args.catalog)).run(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
