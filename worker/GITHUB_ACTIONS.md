# GitHub Actions Drive-backed worker (DEV)

## Architecture

1. Apps Script creates the immutable `job.json` in the existing DEV run folder.
2. Apps Script calls GitHub's `workflow_dispatch` endpoint with only `run_id` and `job_file_id`.
3. The workflow checks out the selected DEV ref and runs `catalog_worker.github_actions_cli`.
4. The worker authenticates to Drive as the Workspace user, downloads the job and source PDF, and uploads immutable page checkpoints plus `result-manifest.json`.
5. The existing owner-executed Apps Script poller discovers the manifest and calls `Ingest.ingestManifest`. The worker never writes to Sheets.

The workflow file must also exist on the repository default branch (`main`) before GitHub will accept manual dispatches. PR #5 adds only that workflow file to `main`; PR #4 contains the implementation on the DEV branch. Apps Script defaults `GITHUB_WORKFLOW_REF` to `dev/worker-v2.1-resumable`, so the run checks out the DEV worker code rather than the older default-branch code.

## Google OAuth setup

Use the Workspace account that owns the existing DEV My Drive folders: `i.khater@shamskh.com`.

1. In a Google Cloud project controlled by the company, enable the Google Drive API.
2. Configure the OAuth consent screen for the Workspace organization where possible. If the app is configured as External and left in Testing, refresh tokens for Drive scopes can expire after seven days; do not rely on Testing-mode tokens for unattended operation.
3. Create an OAuth client and authorize the Workspace user with the scope `https://www.googleapis.com/auth/drive`, requesting offline access.
4. Obtain the refresh token through the approved company OAuth process. Do not paste credentials into chat, source files, workflow inputs, or `job.json`.
5. Add a GitHub Actions repository secret named `GOOGLE_OAUTH_CREDENTIALS_JSON`. Its JSON value must contain these fields:

```json
{
  "client_id": "<OAuth client ID>",
  "client_secret": "<OAuth client secret>",
  "refresh_token": "<refresh token>",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

The worker refreshes an access token at runtime. The secret is not written back to Drive or the repository. When this secret is absent, the worker retains its existing Application Default Credentials path for Cloud Run compatibility.

## GitHub-to-Apps-Script authorization

Create a fine-grained GitHub personal access token scoped only to this repository, with:
- Repository permission **Actions: Read and write**.
- Metadata: Read-only (GitHub's required repository metadata access).

Store it in the owner-only Apps Script project's Script Properties as:
- `GITHUB_ACTIONS_TOKEN`: the token value.
- `GITHUB_WORKFLOW_REF`: `dev/worker-v2.1-resumable` (optional; this is the current default).

Never store the GitHub token in the repository or Drive. Rotate it according to company policy.

## Operational safeguards

- The dispatch payload contains only validated run and Drive file identifiers.
- Workflow concurrency is grouped by `run_id`; repeated delivery uses the same immutable job and the worker's Drive replay checks.
- The job timeout is 105 minutes; Apps Script retains its 120-minute lease and five-minute Drive result poller.
- Unexpected worker exceptions attempt to publish a terminal FAILED manifest if Drive is still reachable. If Drive authentication or transport itself is unavailable, Apps Script's lease expiry remains the final fallback.
- Use a synthetic, non-confidential PDF for the first live test. Do not use the existing `Tamping Rammer` job as a test fixture.

## First live smoke test

After both PRs are merged to their respective target branches and the secrets/properties are configured:

1. Confirm the workflow appears in the repository Actions tab.
2. Upload a synthetic one-page PDF through the owner-only DEV Apps Script app.
3. Confirm Apps Script creates `job.json` and sends the workflow dispatch.
4. Confirm the Actions run checks out `dev/worker-v2.1-resumable`.
5. Confirm Drive receives the page artifact and `result-manifest.json`.
6. Confirm the existing Apps Script poller imports the result and updates the matching Run_Log row.
7. Repeat only with a deliberately controlled replay to verify idempotency.

A successful CI run does not prove OAuth access to the company's live Drive folders. The live smoke test is still required.
