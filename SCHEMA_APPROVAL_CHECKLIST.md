# Schema V2.1 Approval Checklist

**Purpose:** Record the final design gate before persistent DEV resources and application implementation.  
**Current status:** Schema V2.1 and the current table inventory were explicitly approved by the user on 2026-11-03 as the basis for the first isolated DEV implementation slice. This does not approve production use or waive the remaining security and operations gates.

## 1. Structural readiness

| Item | Candidate status |
|---|---|
| Canonical Product/Variant separated from supplier source occurrences | Documented |
| Source provenance and immutable supplier assertions | Documented |
| Deterministic specification change reducer | Documented |
| Product/variant attribute inheritance and intentional-empty override | Documented |
| Document versions and source provenance | Documented |
| Image originals and immutable renditions | Documented |
| Shared immutable design assets and explicit Paper_Versions | Documented |
| Run attempts, worker leases, Run_Units, and event idempotency | Documented |
| Typed staging, many-to-many reviews, and hash-bound approvals | Documented |
| Promotion and issue transaction recovery ledgers | Documented |
| Printer-specific print-ready output gate | Documented |
| Enum registry and 48 acceptance scenarios | Documented |

## 2. Initial-release scope boundaries

- Single primary user; authentication is still required.
- HTML/CSS/JavaScript frontend.
- Google Apps Script application/API layer.
- Google Sheets structured database, with application-enforced integrity.
- Google Drive file and artifact storage.
- One Python worker service for extraction and PDF generation.
- No multi-tenant SaaS, role matrix, or user administration system.
- No canonical Product/Variant merge or reparent workflow in v1.
- No automatic identity merge based on text similarity or AI confidence.
- No production legacy-data migration until a separate audit and mapping plan is approved.
- No PRINT_READY_PDF claim until real printer requirements and conformance validation exist.

## 3. Decisions still open before implementation

| Area | Decision required |
|---|---|
| Worker hosting | Select host/runtime, queue, concurrency, and service cost after benchmark. |
| Worker authentication | Approve HMAC vs signed JWT, replay protection, key rotation, and callback direction. |
| Drive access | Approve service identity, folder permissions, and file transfer mechanism. |
| Extraction | Select PDF parser, table extraction, OCR fallback, optional AI provider, and benchmark acceptance thresholds. |
| PDF rendering | Select renderer, font licensing/embedding, prepress conversion, and PDF validation toolchain. |
| Sheets capacity | Measure rows/cells, quotas, read/write latency, locking, and migration trigger. |
| Operations | Set backup cadence, retention, RPO/RTO, restore drills, monitoring, and incident ownership. |
| Print workflow | Obtain actual printer specs, ICC profile, trim/bleed requirements, and conformance test path if print-ready output is needed. |

## 4. Approval conditions

Before implementation:
- [ ] User accepts the canonical/source identity model and no-merge v1 scope.
- [ ] User accepts the source/specification provenance and deterministic reducer rules.
- [ ] User accepts document/image/design version immutability and issue snapshot rules.
- [ ] User accepts review/promotion/issue recovery behavior.
- [ ] User accepts the 48 acceptance scenarios as the initial test baseline.
- [ ] Worker/API authentication and file access decisions are resolved.
- [ ] Private synthetic/representative benchmark plan is approved.
- [ ] Backup, restore, capacity, and security gates are approved.

## 5. First permitted implementation slice after approval

**Approval recorded:** 2026-11-03. Initial Apps Script source scaffolding has been added to the repository for schema initialization, health reporting, and secure DEV catalog registration. No Google Sheet, Drive folder, Apps Script deployment, or worker service has been provisioned or runtime-tested. The worker/API authentication, hosting, Drive access, capacity, and backup decisions above remain open.

Create isolated DEV-only resources and implement:
1. schema initialization/version verification;
2. Apps Script health/config endpoint;
3. secure upload registration and catalog SHA256;
4. Catalogs and Catalog_Pages persistence;
5. Run_Log, worker lease, and Run_Units creation;
6. one small synthetic PDF extraction job end-to-end.

Do not implement the full UI, bulk legacy migration, or production extraction pipeline before this vertical slice passes its tests.
