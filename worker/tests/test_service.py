from catalog_worker import service


def test_dispatch_requires_bearer_and_enqueues_deterministic_task(monkeypatch):
    monkeypatch.setenv("WORKER_SHARED_TOKEN", "long-test-token")
    monkeypatch.setattr(service, "_enqueue", lambda run_id, job_file_id: "task/" + run_id)
    client = service.app.test_client()

    denied = client.post("/run", json={
        "contract_version": "1", "run_id": "run_1", "job_file_id": "job_1"
    })
    assert denied.status_code == 401

    accepted = client.post("/run", headers={
        "Authorization": "Bearer long-test-token"
    }, json={"contract_version": "1", "run_id": "run_1", "job_file_id": "job_1"})
    assert accepted.status_code == 202
    assert accepted.get_json()["accepted"] is True
    assert accepted.get_json()["run_id"] == "run_1"


def test_dispatch_rejects_wrong_contract_and_invalid_job(monkeypatch):
    monkeypatch.setenv("WORKER_SHARED_TOKEN", "token")
    client = service.app.test_client()
    headers = {"Authorization": "Bearer token"}
    wrong = client.post("/run", headers=headers, json={
        "contract_version": "2", "run_id": "run_1", "job_file_id": "job_1"
    })
    assert wrong.status_code == 400
    invalid = client.post("/run", headers=headers, json={
        "contract_version": "1", "run_id": "run_1"
    })
    assert invalid.status_code == 400


def test_cloud_task_handler_binds_run_id_to_job(monkeypatch):
    monkeypatch.setattr(service, "_verify_task_identity", lambda: True)
    calls = []
    monkeypatch.setattr(service, "run_from_drive", lambda **kwargs: calls.append(kwargs) or {
        "accepted": True, "run_id": kwargs["expected_run_id"], "run_status": "COMPLETED"
    })
    client = service.app.test_client()
    response = client.post("/tasks/run", json={"run_id": "run_9", "job_file_id": "job_9"})
    assert response.status_code == 200
    assert calls == [{"job_file_id": "job_9", "expected_run_id": "run_9"}]
