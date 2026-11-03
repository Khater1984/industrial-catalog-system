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



def test_cloud_task_deadline_is_set_on_task_not_http_request(monkeypatch):
    for key, value in {
        "GOOGLE_CLOUD_PROJECT": "dev-project",
        "CLOUD_TASKS_LOCATION": "us-central1",
        "CLOUD_TASKS_QUEUE": "catalog-worker-dev",
        "TASK_INVOKER_SERVICE_ACCOUNT": "task-invoker@dev-project.iam.gserviceaccount.com",
        "WORKER_PUBLIC_URL": "https://worker.example",
    }.items():
        monkeypatch.setenv(key, value)
    captured = {}

    class FakeTasksClient:
        def queue_path(self, project, location, queue):
            return f"projects/{project}/locations/{location}/queues/{queue}"

        def task_path(self, project, location, queue, task):
            return f"projects/{project}/locations/{location}/queues/{queue}/tasks/{task}"

        def create_task(self, request):
            captured.update(request)
            return {"name": request["task"]["name"]}

    monkeypatch.setattr(service.tasks_v2, "CloudTasksClient", FakeTasksClient)
    task_name = service._enqueue("run_42", "drive-job-id-123456")
    task = captured["task"]
    assert task_name == task["name"]
    assert task["dispatch_deadline"]["seconds"] == 1800
    assert "dispatch_deadline" not in task["http_request"]
    assert task["http_request"]["url"] == "https://worker.example/tasks/run"
    assert task["http_request"]["oidc_token"]["service_account_email"].startswith("task-invoker@")
