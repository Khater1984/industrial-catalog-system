"""Local review server for the first operational path.

Run:
  python -m catalog_worker.review_server --staging path/to/staging-set.json --catalog path/to/catalog
Then open http://<machine-ip>:8765 from a phone on the same network.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from flask import Flask, jsonify, request

from catalog_worker.promotion import promote_reviewed_staging

HTML = """<!DOCTYPE html>
<html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
<title>مراجعة الاستخراج</title>
<style>
body{margin:0;background:#f4f6f8;font-family:Arial,\"Noto Sans Arabic\",sans-serif;color:#17212b}
main{max-width:980px;margin:auto;padding:18px}
.card{background:#fff;border:1px solid #e5eaf0;border-radius:14px;padding:16px;margin:12px 0}
h1{font-size:22px;margin:0 0 8px}h2{font-size:16px;margin:0 0 10px}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
button,input{font:inherit;padding:10px 12px;border-radius:8px;border:1px solid #d7dee6}
button{background:#173f5f;color:#fff;border:0;font-weight:700}
.reject{background:#b42318}.accept{background:#18794e}
.flag{background:#fff5e5;color:#a15c00;padding:4px 8px;border-radius:20px;font-size:12px}
.muted{color:#697786;font-size:13px}
</style></head><body><main>
<h1>مراجعة نتائج الاستخراج</h1>
<p class=\"muted\">لا يتم اعتماد أي سجل إلا بعد القبول اليدوي. البيانات المرفوضة لا تنتقل إلى الكتالوج.</p>
<div id=\"app\"></div>
<div class=\"card\"><button onclick=\"promote()\">اعتماد المقبول فقط</button><pre id=\"result\"></pre></div>
<script>
async function load(){const data=await (await fetch('/api/staging')).json();const app=document.getElementById('app');
app.innerHTML=data.products.map(p=>card('منتج',p,'products')).join('')+data.variants.map(v=>card('موديل',v,'variants')).join('')+data.specifications.map(s=>card('مواصفة',s,'specifications')).join('');}
function card(label,item,kind){const flags=(item.flags||[]).map(f=>`<span class=\"flag\">${f}</span>`).join(' ');
const editable=kind==='specifications'?`<input id=\"v_${item.staging_id}\" value=\"${item.value_raw||''}\">`:'';
return `<section class=\"card\"><h2>${label}: ${item.proposed_product_name||item.proposed_model_number||item.attribute_key_raw}</h2>
<div class=\"muted\">المصدر: ${item.source_quote} · الصفحة ${item.page_number} · الحالة ${item.review_status}</div>
${flags}${editable}
<div class=\"row\"><button class=\"accept\" onclick=\"decide('${kind}','${item.staging_id}','ACCEPTED')\">قبول</button>
<button class=\"reject\" onclick=\"decide('${kind}','${item.staging_id}','REJECTED')\">رفض</button></div></section>`;}
async function decide(kind,id,status){const value=document.getElementById('v_'+id)?.value;await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,id,status,value})});load();}
async function promote(){const r=await (await fetch('/api/promote',{method:'POST'})).json();document.getElementById('result').textContent=JSON.stringify(r,null,2);}
load();
</script></main></body></html>"""


def create_app(staging_path: Path, catalog_dir: Path) -> Flask:
    app = Flask(__name__)

    def load() -> dict:
        return json.loads(staging_path.read_text(encoding="utf-8"))

    def save(data: dict) -> None:
        staging_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    @app.get("/")
    def index():
        return HTML

    @app.get("/api/staging")
    def staging():
        return jsonify(load())

    @app.post("/api/review")
    def review():
        body = request.get_json(force=True)
        data = load()
        for item in data[body["kind"]]:
            if item["staging_id"] == body["id"]:
                if body.get("value") is not None and item.get("value_raw") != body["value"]:
                    item["original_value_raw"] = item.get("value_raw")
                    item["value_raw"] = body["value"]
                    item["edited"] = True
                    item["edit_reason"] = "Reviewer edit before acceptance"
                item["review_status"] = body["status"]
                item["review_decision_recorded"] = True
        save(data)
        return jsonify({"ok": True})

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
