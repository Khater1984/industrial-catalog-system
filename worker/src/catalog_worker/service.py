"""Cloud Run HTTP adapter. /run enqueues a durable Cloud Task; task handler executes."""
from __future__ import annotations

import hmac
import json
import os
from flask import Flask, jsonify, request
from google.cloud import tasks_v2
from google.protobuf import timestamp_pb2

from .runner import run_from_drive

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024


def _required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"CONFIG_MISSING_{name}")
    return value


def _authorized() -> bool:
    expected = os.environ.get("WORKER_SHARED_TOKEN", "")
    supplied = request.headers.get("Authorization", "")
    return bool(expected) and hmac.compare_digest(supplied, "Bearer " + expected)


def _enqueue(run_id: str, job_file_id: str, callback_url: str) -> str:
    project = _required_env("GOOGLE_CLOUD_PROJECT")
    location = _required_env("CLOUD_TASKS_LOCATION")
    queue = _required_env("CLOUD_TASKS_QUEUE")
    task_sa = _required_env("TASK_INVOKER_SERVICE_ACCOUNT")
    base_url = _required_env("WORKER_PUBLIC_URL").rstrip("/")
    client = tasks_v2.CloudTasksClient()
    parent = client.queue_path(project, location, queue)
    task_name = client.task_path(project, location, queue, "catalog-" + run_id.replace("_", "-"))
    body = json.dumps({"run_id": run_id, "job_file_id": job_file_id,
                       "callback_url": callback_url}).encode()
    task = {
        "name": task_name,
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST,
            "url": base_url + "/tasks/run",
            "headers": {"Content-Type": "application/json"},
            "body": body,
            "oidc_token": {"service_account_email": task_sa, "audience": base_url},
        },
    }
    try:
        return client.create_task(request={"parent": parent, "task": task}).name
    except Exception as exc:
        # A deterministic Cloud Task name makes duplicate /run calls idempotent.
        if "ALREADY_EXISTS" in str(exc) or "409" in str(exc):
            return task_name
        raise


@app.get("/health")
def health():
    return jsonify({"ok": True, "worker_version": "0.2.1", "contract_version": "1"}), 200


@app.post("/run")
def dispatch():
    if not _authorized():
        return jsonify({"ok": False, "error": "UNAUTHORIZED"}), 401
    body = request.get_json(silent=True) or {}
    if body.get("contract_version") != "1":
        return jsonify({"ok": False, "error": "CONTRACT_VERSION_MISMATCH"}), 400
    run_id = body.get("run_id")
    job_file_id = body.get("job_file_id")
    callback_url = body.get("callback_url")
    if not all(isinstance(v, str) and v.strip() for v in (run_id, job_file_id, callback_url)):
        return jsonify({"ok": False, "error": "INVALID_REQUEST"}), 400
    if not callback_url.startswith("https://"):
        return jsonify({"ok": False, "error": "CALLBACK_HTTPS_REQUIRED"}), 400
    try:
        task_name = _enqueue(run_id, job_file_id, callback_url)
        return jsonify({"ok": True, "accepted": True, "run_id": run_id, "task": task_name}), 202
    except Exception:
        app.logger.exception("Could not enqueue catalog worker task")
        return jsonify({"ok": False, "error": "TASK_ENQUEUE_FAILED"}), 503


def _verify_task_identity() -> bool:
    expected_email = os.environ.get("TASK_INVOKER_SERVICE_ACCOUNT", "")
    if not expected_email:
        return False
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return False
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
        claims = id_token.verify_oauth2_token(auth[7:], google_requests.Request(),
                                               audience=_required_env("WORKER_PUBLIC_URL").rstrip("/"))
        return claims.get("email") == expected_email and claims.get("email_verified") is True
    except Exception:
        return False


@app.post("/tasks/run")
def execute_task():
    if not _verify_task_identity():
        return jsonify({"ok": False, "error": "TASK_UNAUTHORIZED"}), 401
    body = request.get_json(silent=True) or {}
    try:
        result = run_from_drive(
            job_file_id=body["job_file_id"], callback_url=body["callback_url"],
            callback_token=_required_env("CALLBACK_SHARED_TOKEN"),
        )
        return jsonify(result), 200
    except Exception:
        app.logger.exception("Catalog worker task failed")
        return jsonify({"ok": False, "error": "WORKER_TASK_FAILED"}), 500
