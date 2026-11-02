# Industrial Catalog System

An internal industrial-equipment catalog platform for preserving supplier evidence, managing canonical products and models, reviewing extracted data, and issuing controlled technical datasheets and catalogs.

> **Current stage:** Architecture and schema hardening. The repository contains design specifications and acceptance scenarios. It does not yet contain a production application, live Google Sheets database, worker deployment, or migrated legacy data.

## Product intent

The system is designed around a traceable pipeline:

**Supplier files → immutable source evidence → extraction staging → human review → canonical product/model records → company-managed enrichment → preflight → version-pinned PDF issue.**

It is not intended to be a generic PDF-to-Excel converter or a multi-tenant SaaS in its first release.

## Core architecture direction

- **Frontend:** HTML, CSS, JavaScript; responsive desktop and mobile experience.
- **Application API:** Google Apps Script.
- **Structured records:** Google Sheets, with application-enforced relational integrity.
- **File storage:** Google Drive for source catalogs, images, documents, design assets, manifests, and issued PDFs.
- **Processing:** One Python worker service with catalog extraction and PDF-generation capabilities.
- **Source control:** GitHub.

These are approved technology directions, not evidence that runtime resources have been provisioned.

## Start here

1. [Project Rules](PROJECT_RULES.md) — non-negotiable engineering and data rules.
2. [Architecture](ARCHITECTURE.md) — components, responsibilities, and workflows.
3. [Database Schema](DATABASE_SCHEMA.md) — authoritative table inventory and shared data conventions.
4. [Schema V2 Proposal](SCHEMA_V2_PROPOSAL.md) — corrective design decisions and integrity contracts.
5. [Schema Review](SCHEMA_REVIEW.md) — engineering findings and disposition.
6. [Schema Acceptance Tests](SCHEMA_ACCEPTANCE_TESTS.md) — design-level scenarios and expected outcomes.
7. [Schema Consistency Audit](SCHEMA_CONSISTENCY_AUDIT.md) — static table/FK/link audit and remaining gates.
7. [Technical Design](TECHNICAL_DESIGN.md) — system contracts, state machines, and data flows.
8. [API Contracts](API_CONTRACTS.md) — application/worker interface proposals.
9. [Worker Specification](WORKER_SPEC.md) — extraction and PDF-generation requirements.
10. [UI/UX Specification](UI_UX_SPEC.md) — responsive experience and review workflows.
11. [Test Strategy](TEST_STRATEGY.md) — test layers, fixtures, and release gates.
12. [Security & Operations](SECURITY_OPERATIONS.md) — access, secrets, backup, recovery, and capacity.
13. [Implementation Blueprint](IMPLEMENTATION_BLUEPRINT.md) — repository structure and vertical-slice build plan.
14. [Delivery Roadmap](ROADMAP.md) — gated implementation sequence.
15. [Decision Log](DECISIONS_LOG.md) — approved decisions and proposals.

## Domain specifications

- [Source & Products](schema/01-source-and-products.md)
- [Documents & Images](schema/02-documents-and-images.md)
- [Design & Issued Output](schema/03-design-and-issued-output.md)
- [Workflow, Staging & Audit](schema/04-workflow-and-audit.md)

## Non-negotiable safeguards

- Preserve exact supplier source wording and file provenance.
- Keep canonical Product/Variant identity separate from supplier catalog appearances.
- Never auto-merge products or models based only on names, model numbers, normalized text, or AI confidence.
- Keep extraction in staging; promote only after review and hash verification.
- Never depend on Google Sheets row order as identity or event order.
- Treat source records, published assets/configurations, document versions, issue snapshots, and issued PDFs as immutable evidence.
- Make retries and partial multi-sheet writes idempotent and recoverable.
- Keep secrets, credentials, supplier-confidential files, and customer data out of this public repository.
- Do not label output print-ready without printer-specific requirements and validation.

## Implementation gate

Do not create production Sheets, change production Drive contents, deploy the worker, migrate legacy records, or begin production application implementation until:
- the consolidated schema and acceptance suite are approved;
- Apps Script ↔ worker authentication and job protocol are specified;
- worker hosting and representative extraction/rendering benchmarks are complete;
- security, backup, restore, and operational limits are approved.

Synthetic test fixtures and non-production prototypes may be introduced only under a separately documented test plan.
