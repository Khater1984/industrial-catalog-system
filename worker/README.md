# Python worker — planned

The worker host, queue, PDF/OCR stack and worker authentication remain undecided. No worker runtime or credentials are provisioned in this milestone.

The first worker spike must:
1. Accept only an authenticated, server-issued job manifest.
2. Verify source PDF bytes against the registered SHA256.
3. Inspect PDF page count and produce deterministic page-unit results.
4. Return a versioned result manifest; it must not write directly to Sheets.
5. Include synthetic fixtures for corrupt/encrypted PDFs and hash mismatch.

Do not add an AI provider until a representative benchmark and cost/quality acceptance thresholds are approved.
