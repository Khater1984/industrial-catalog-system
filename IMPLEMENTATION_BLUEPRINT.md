# Implementation Blueprint — Repository and Delivery Structure

**Status:** Proposed build plan; no application code or runtime resources have been created.

## 1. Repository layout target

```text
industrial-catalog-system/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── catalog-intake/
│   │   ├── review/
│   │   ├── products/
│   │   ├── media/
│   │   ├── documents/
│   │   ├── design-studio/
│   │   └── output-center/
│   ├── styles/
│   └── tests/
├── apps-script/
│   ├── src/
│   │   ├── api/
│   │   ├── domain/
│   │   ├── repositories/
│   │   ├── validation/
│   │   ├── workflows/
│   │   ├── security/
│   │   └── operations/
│   ├── appsscript.json
│   └── tests/
├── worker/
│   ├── src/
│   │   ├── jobs/
│   │   ├── catalog/
│   │   ├── extraction/
│   │   ├── images/
│   │   ├── pdf/
│   │   ├── manifests/
│   │   ├── clients/
│   │   └── observability/
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── contracts/
│   ├── api/
│   ├── worker/
│   ├── manifests/
│   └── fixtures/
├── tests/
│   ├── acceptance/
│   ├── integration/
│   ├── security/
│   └── fixtures-synthetic/
├── scripts/
│   ├── schema/
│   ├── validation/
│   └── release/
├── docs/
├── schema/
└── README.md
```

This is a target layout, not a command to create empty folders before the schema/API contracts are approved. The final folder structure may be adjusted to the selected build/deployment tools.

## 2. Code ownership boundaries

- `frontend/`: presentation and user interaction only; no business-rule authority and no secrets.
- `apps-script/src/domain/`: canonical business rules, state transitions, effective data resolvers, and promotion/issue orchestration.
- `apps-script/src/repositories/`: centralized Sheets/Drive access; no direct sheet reads scattered through feature code.
- `apps-script/src/validation/`: schema, enum, FK/ownership, and payload/hash validation.
- `worker/src/catalog/`: PDF intake and page-level extraction orchestration.
- `worker/src/pdf/`: snapshot-driven rendering and output validation.
- `contracts/`: versioned JSON contracts shared by Apps Script, browser, and worker.
- `tests/`: synthetic acceptance fixtures and repeatable test harnesses.

## 3. Dependency and build policy

- Keep the browser implementation framework-light; do not introduce a frontend framework without a documented reason and mobile-performance evaluation.
- Use a pinned Python dependency lock and a reproducible worker container.
- Keep Apps Script source modular and deployable through a documented build/deployment process.
- Use explicit schema and protocol versions in manifests.
- No runtime package downloads from arbitrary URLs.
- Prefer small dependencies with active maintenance and known licenses.
- Add automated format, lint, type/static checks, and tests before merging implementation modules.

## 4. Development environments

| Environment | Purpose | Data policy |
|---|---|---|
| Local | UI and worker unit tests | Synthetic fixtures only |
| DEV | Developer integration and disposable Sheets/Drive | Synthetic or sanitized data |
| TEST | Acceptance, security, recovery, and performance tests | Controlled synthetic/private fixtures |
| PROD | Actual catalog operations | Restricted access and approved retention/backups |

Never point local/test code at production Sheets or Drive folders by default. Environment IDs and spreadsheet/folder IDs are runtime configuration, not hard-coded constants.

## 5. Vertical-slice implementation order

1. **Foundation:** health/status endpoint, config validation, structured logs, ID generator, schema version check.
2. **Catalog registration:** upload session, file validation, SHA256, Catalogs and Catalog_Pages.
3. **Worker job:** create Run_Log, Run_Units, job manifest, worker lease, progress events.
4. **Staging:** typed result manifest import, source evidence, staging hash.
5. **Review:** queue, many-to-many links, decision manifests, stale-review invalidation.
6. **Promotion:** identity decision, source records, Promotion_Operations, mappings, recovery.
7. **Product workspace:** canonical company labels, attributes, specification reducer.
8. **Documents/images:** versioned docs, image originals/renditions, approval and link resolution.
9. **Design and issue:** immutable design assets/versions, preflight, Issue_Operations, final issue records.
10. **Hardening:** load, mobile, security, backup/restore, and failure-injection testing.

Each slice must include schema impact review, acceptance tests, audit behavior, recovery path, and user acceptance before the next slice.

## 6. CI and release policy

- Pull requests should run formatting, lint/static checks, contract validation, unit tests, and synthetic acceptance tests.
- Protect the default branch where repository permissions allow.
- Keep secrets out of CI logs and build artifacts.
- Build worker containers from pinned dependencies and scan images.
- Release artifacts must record commit SHA, schema version, API protocol version, worker version, and dependency lock hash.
- Deployment requires a backup/checkpoint and a rollback procedure.

## 7. First implementation milestone

After final schema and security/integration approval, create only a disposable DEV environment and implement the Foundation + Catalog Registration vertical slice. Do not start by building the entire UI or a large extraction pipeline. Prove the Apps Script ↔ worker contract and Sheets/Drive reliability first.
