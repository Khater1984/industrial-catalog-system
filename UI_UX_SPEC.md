# UI/UX Specification — Product Workspace

**Status:** Experience specification; visual implementation not started.  
**Target:** Premium, responsive internal tool for desktop and mobile.

## 1. Experience principles

- Make the workflow understandable: source → review → canonical product → enrichment → output.
- Keep the user oriented with clear status, source evidence, warnings, and next actions.
- Never hide whether a value is supplier-sourced, company-managed, normalized, inferred, or approved.
- Prioritize dense desktop workflows without making mobile a compressed desktop screen.
- Use progressive disclosure for advanced metadata and technical diagnostics.
- Keep destructive and irreversible actions behind confirmation and an audit reason.

## 2. Navigation model

1. **Dashboard** — recent activity, jobs, review backlog, issue status, system health.
2. **Catalog Intake** — upload/register supplier catalogs, inspect page count, start/retry extraction.
3. **Review Queue** — product/model identity, specification, image, document, and ambiguity reviews.
4. **Products** — canonical product and variant search/workspace.
5. **Media Library** — original images, renditions, approvals, duplicate candidates, quality.
6. **Documents** — logical documents, immutable versions, product/variant links.
7. **Design Studio** — brands, design assets, papers, templates, watermarks, export profiles.
8. **Output Center** — preflight, issue history, PDF retrieval, reproduction.
9. **Settings & Diagnostics** — non-secret configuration, integrity scans, logs, backups, environment status.

## 3. Product workspace

Suggested tabs:
- Overview / Identity
- Supplier Sources
- Variants
- Specifications
- Attributes
- Images
- Documents
- Activity & Audit

The Overview distinguishes canonical company display names from source names. Supplier Sources shows catalog revision, page, exact source name/model, source quote, match decision, and extraction run. Specifications shows raw source value beside normalized value and approved company changes.

## 4. Review experience

Every review task must show:
- source catalog, revision, PDF page and highlighted region when available;
- original source wording and image/page evidence;
- extracted raw value, normalized proposal, confidence, and extraction method;
- candidate canonical matches with reasons, not only a similarity score;
- exact payload revision/hash under review;
- decision choices, rationale, and impact summary.

If the staging hash changes after review, mark the previous review STALE and require review again. Do not allow approval on a stale preview.

## 5. Desktop behavior

- Persistent left navigation.
- Main workspace with search/filter toolbar and structured tables.
- Detail drawer or split view for source evidence and editable company fields.
- Keyboard-friendly row navigation and review actions.
- Tables support column visibility, sorting, filtering, and stable pagination; row position is never an identifier.

## 6. Mobile behavior

- Single-column navigation and stacked cards.
- Review evidence first, decision actions accessible without horizontal scrolling.
- Upload progress, run status, and issue status visible at a glance.
- Use compact table-to-card transformations; preserve all fields and provenance.
- Avoid hover-only actions and tiny controls.
- Confirm before leaving a partially completed review or upload.

## 7. Visual system

- Premium, restrained, high-contrast visual language.
- Consistent spacing, typography scale, border/radius, focus states, and status colors.
- Arabic/English labels and RTL/LTR layout support from the component layer.
- Never use color alone to communicate approval, warning, failure, or source status.
- Product photos and technical diagrams remain content, not decorative backgrounds.
- Provide empty, loading, error, stale, permission-denied, and offline states.

## 8. Accessibility and localization

- Keyboard operation for all core flows.
- Semantic headings, labels, focus order, and accessible status announcements.
- Contrast and readable font sizes on mobile.
- Arabic shaping and RTL punctuation/number behavior tested.
- Units and decimals formatted by locale for display, but stored in canonical locale-independent values.
- Dates stored UTC; display local time with explicit timezone context where needed.

## 9. Critical UX safeguards

- Distinguish "Save draft", "Approve", "Promote", "Publish", and "Issue" as separate actions.
- Show the consequence of approving a source match.
- Show blocking vs warning preflight findings.
- A Print-ready label appears only when the export profile and external print requirements have been validated.
- Historical issues open the original archived PDF and manifest, not a live reconstruction.
