# Frontend and Apps Script Integration Audit — 2026-11-10

## Scope

Static review of the DEV branch's browser entry point, Apps Script build pipeline, server-side entry points, UI specification, and delivery roadmap. This is a repository audit; it is not a live browser, Google Sheets, Drive, or worker end-to-end test.

## Confirmed findings

### 1. Main browser entry point

- `apps-script/Index.html` is 372 lines (about 31 KB), not a complete implementation of the approved workspace.
- `doGet(e)` serves only `HtmlService.createHtmlOutputFromFile("Index")`.
- The current page contains catalog intake/upload, a small dashboard, staging promotion, document management, and a lightweight design panel.
- The design panel is embedded in `Index.html`; this is not equivalent to implementing the full product workspace.
- Other HTML files (`BrandIdentity.html`, `DesignStudio.html`, `DesignStudioFull.html`, `DesignStudioPanel.html`, `TemplateStudio.html`) are standalone source files. They are not automatically included by `createHtmlOutputFromFile("Index")`. The current page does not use an HtmlService include/template loader for them.

### 2. UI scope gap

The approved `UI_UX_SPEC.md` defines nine primary work areas: Dashboard, Catalog Intake, Review Queue, Products, Media Library, Documents, Design Studio, Output Center, and Settings & Diagnostics.

The current `Index.html` does not yet provide the complete navigation/workflows for Review Queue, Products, Media Library, Output Center, or Settings & Diagnostics. Product-domain services exist in source, but their existence is not evidence of a usable browser workspace.

The specification itself states that visual implementation has not started. Therefore the UI must be treated as a limited DEV prototype, not as the finished product experience.

### 3. Deployment bundle was incomplete

The prior `apps-script/scripts/build.js` bundle order omitted active domain modules referenced by `Api.js` and the browser UI, including:

- ProductService, ProductFamilyService, VariantService
- AttributeService, SpecificationService, EffectiveSpecificationResolver
- ImageReviewIntake and DesignStudio

The committed `dist/Code.gs` was also stale: it contained only a subset of source-module markers and did not contain the document/design browser functions called by the page. This meant source code could exist in `src/domain` without being present in the Apps Script deployment artifact.

### 4. Corrections made in this branch

- Expanded the build order to include 21 active modules, with API entry points last.
- Regenerated `apps-script/dist/Code.gs` from the active source modules.
- Added `apps-script/dist/Index.html` as the generated deployment HTML artifact and synchronized it with the corrected source page.
- Added regression tests for required bundle modules, browser-called server functions, and inline JavaScript syntax.
- Kept `TemplateStudio.js` out of the bundle pending consolidation: it declares browser wrapper names that overlap with `DesignStudio.js`. Bundling both as-is would create global function collisions. The active embedded Design Studio uses `DesignStudio.js`.

### 5. Dashboard JavaScript syntax defect

The malformed quote in the dashboard's HTML-escaping expression was corrected in the preceding DEV commit. The bundle-integrity test now parses every inline script in `Index.html` to prevent recurrence.

## Phase and readiness assessment

- Catalog intake/dashboard: limited DEV slice; live Sheets authorization/configuration and browser runtime still require verification.
- Product and variant domain: server-side source exists; previously omitted from deployment bundle; browser workspace is not implemented.
- Review queue and media workflows: partial server-side building blocks; complete user-facing review experience not demonstrated.
- Documents: server-side service exists; UI is limited to basic document/version actions; live verification remains outstanding.
- Design/PDF: renderer and lightweight DEV design controls exist. Full schema-backed brand/template/issue lifecycle remains blocked per the roadmap.
- Output Center and diagnostics: not implemented as complete user-facing work areas.
- Mobile/desktop and end-to-end acceptance: not demonstrated.

The roadmap currently identifies Phase 2 data-foundation DEV verification as in progress. Phases 3–7 must not be described as complete based on the presence of source files or isolated unit tests.

## Recommended implementation sequence

1. Merge and validate the bundle/build correction.
2. Replace the monolithic page incrementally with a stable application shell and separately included feature views; do not create a 2,000-line monolith merely to meet a line-count target.
3. Implement the navigation and complete feature workflows in UI-spec order, beginning with Dashboard/Intake/Review Queue.
4. Wire each view only to deployed and tested Apps Script functions; add empty/loading/error/permission/stale states.
5. Verify the DEV browser identity, Script Properties, sheet names, spreadsheet access, and HTML-service calls before uploading any real supplier catalog.
6. Complete product, media, documents, design, and output workflows with integration tests and mobile acceptance.
7. Keep the worker live E2E and PDF visual checks as separate release gates.

## Safety boundary

No production data, source catalog files, Drive folders, or Sheets records were changed by this audit. No claim is made that the current deployed Apps Script version has been updated or that a live end-to-end test has passed.
