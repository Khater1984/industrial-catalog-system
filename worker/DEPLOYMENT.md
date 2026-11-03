# DEV Cloud Run deployment

This guide deploys the Worker adapter only. It does not create or modify the Google Sheet or deploy the Apps Script project.

## 1. Required resources

Use a dedicated DEV Google Cloud project and create:
- Cloud Run service: `industrial-catalog-worker`
- Cloud Tasks queue in the same region as the service
- Runtime service account for the Cloud Run container
- Invoker service account used by Cloud Tasks OIDC
- Private Drive folders for catalog intake and run artifacts

Enable the Drive API, Cloud Run API, Cloud Build API, Artifact Registry API, and Cloud Tasks API.

The runtime service account needs permission to create/read files in the two DEV Drive folders. Share the intake and runs folders with its service-account email. A Shared Drive is preferred; service accounts may not have My Drive storage quota. The runtime service account also needs `roles/cloudtasks.enqueuer` on the project.

The Cloud Tasks invoker service account needs `roles/run.invoker` on the Cloud Run service. Cloud Tasks dispatch and Gunicorn are both capped at 30 minutes; Apps Script uses a 120-minute lease and marks a run FAILED if no result manifest arrives before lease expiry. Ensure the Cloud Tasks service agent is allowed to mint OIDC tokens for that service account (normally provided by the Cloud Tasks service-agent role and the service-account user grant).

## 2. Create the queue

Choose the same region for Cloud Tasks and Cloud Run:

```bash
gcloud tasks queues create catalog-worker-dev \
  --location=YOUR_REGION \
  --max-attempts=5 \
  --max-retry-duration=3600s \
  --min-backoff=10s \
  --max-backoff=300s \
  --max-doublings=5
```

Review the queue retry policy before use. Persistent task failures are not silently converted to successful runs; inspect the Cloud Tasks queue and the corresponding Run_Log row.

## 3. Deploy the service

Build/deploy from the worker directory so the Dockerfile is used:

```bash
cd worker
gcloud run deploy industrial-catalog-worker \
  --source . \
  --region YOUR_REGION \
  --timeout=1800 \\
  --service-account WORKER_RUNTIME_SERVICE_ACCOUNT \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,CLOUD_TASKS_LOCATION=YOUR_REGION,CLOUD_TASKS_QUEUE=catalog-worker-dev,TASK_INVOKER_SERVICE_ACCOUNT=TASK_INVOKER_SERVICE_ACCOUNT,WORKER_SHARED_TOKEN=YOUR_LONG_RANDOM_TOKEN
```

The Cloud Run service is reachable without Google IAM authentication because Apps Script UrlFetchApp cannot mint an identity token for the request. The `/run` handler therefore enforces the high-entropy bearer token in application code. The internal `/tasks/run` handler separately requires a Google OIDC token from the configured task-invoker service account. Do not remove either check.

After deployment, set the service URL as an environment variable (the service needs its own URL to enqueue task targets):

```bash
SERVICE_URL=$(gcloud run services describe industrial-catalog-worker --region YOUR_REGION --format='value(status.url)')
gcloud run services update industrial-catalog-worker --region YOUR_REGION \
  --update-env-vars WORKER_PUBLIC_URL="$SERVICE_URL"
```

Then grant the task-invoker identity the Cloud Run Invoker role on this service.

## 4. Apps Script properties

Set these Script Properties in the owner-only DEV Apps Script project:
- `DEV_RUNS_FOLDER_ID`: private Drive folder for per-run subfolders.
- `DEV_WORKER_ENDPOINT`: Cloud Run base URL plus `/run`.
- `DEV_WORKER_SHARED_TOKEN`: exactly the same token as `WORKER_SHARED_TOKEN`.
- `DEV_CATALOG_FOLDER_ID`: private intake folder already used by catalog registration.
- `DEV_SPREADSHEET_ID` and `ALLOWED_USER_EMAIL`: existing DEV settings.

Keep `appsscript.json` web-app access set to `MYSELF`. Do not expose the execute-as-owner Apps Script deployment anonymously. Run `installWorkerPoller` once from the Apps Script editor while signed in as the owner.

## 5. Smoke test

1. Confirm `GET WORKER_PUBLIC_URL/health` returns `ok: true`.
2. Upload a one-page synthetic PDF through the owner-only Apps Script DEV app.
3. Confirm Apps Script creates a per-run folder containing immutable `job.json`.
4. Confirm Cloud Tasks contains a task named from the Run_ID and Cloud Run logs show the task execution.
5. Confirm the run folder receives `page-00001.json` and `result-manifest.json`.
6. Within one poll interval, confirm Apps Script creates the corresponding `Catalog_Pages` and `Run_Units` rows and changes `Run_Log.Run_Status` to `COMPLETED`.
7. Repeat the same run delivery in a controlled test and confirm the result manifest and Sheets rows are not duplicated.

Do not use confidential supplier catalogs for the first smoke test. CI and Docker build success are not substitutes for this live DEV verification.
