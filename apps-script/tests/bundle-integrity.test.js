const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const bundle = fs.readFileSync(path.join(root, "dist", "Code.gs"), "utf8");
const html = fs.readFileSync(path.join(root, "Index.html"), "utf8");

test("deployment bundle contains every active domain module", () => {
  const modules = [
    "config/Schema.js",
    "repositories/SheetsRepository.js",
    "security/Auth.js",
    "validation/InputValidation.js",
    "domain/ProductService.js",
    "domain/ProductFamilyService.js",
    "domain/VariantService.js",
    "domain/AttributeService.js",
    "domain/SpecificationService.js",
    "domain/EffectiveSpecificationResolver.js",
    "domain/CatalogService.js",
    "domain/Ingest.js",
    "domain/CandidateReviewIntake.js",
    "domain/WorkerIntegration.js",
    "domain/StagingPromotion.js",
    "domain/ImagePromotion.js",
    "domain/ImageReviewIntake.js",
    "domain/ReviewDashboard.js",
    "domain/ReviewWorkspace.js",
    "domain/DocumentService.js",
    "domain/BackupService.js",
    "domain/DesignService.js",
    "domain/DesignStudio.js",
    "api/Api.js"
  ];

  for (const modulePath of modules) {
    assert.ok(bundle.includes("// ===== " + modulePath + " ====="), "Missing bundled module: " + modulePath);
  }
});

test("browser-called Apps Script functions are present in deployment bundle", () => {
  const requiredFunctions = [
    "getCatalogDashboard",
    "uploadCatalogFromBrowser",
    "promoteStagingFromBrowser",
    "getReviewQueueForBrowser",
    "updateReviewStatusFromBrowser",
    "createDocumentFromBrowser",
    "addDocumentVersionFromBrowser",
    "listDocumentsForBrowser",
    "listBrandsForBrowser",
    "saveBrandFromBrowser",
    "listTemplatesForBrowser",
    "saveTemplateFromBrowser",
    "publishTemplateFromBrowser",
    "buildSnapshotFromDomainForBrowser",
    "listIssuesForBrowser"
  ];

  for (const name of requiredFunctions) {
    assert.match(bundle, new RegExp("function\\s+" + name + "\\s*\\("), "Missing browser API function: " + name);
  }
});

test("all inline JavaScript in the main UI parses successfully", () => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length > 0, "No inline scripts found in Index.html");

  scripts.forEach((match, index) => {
    assert.doesNotThrow(
      () => new vm.Script(match[1], { filename: "Index.html:inline-script-" + (index + 1) }),
      "Inline script " + (index + 1) + " has a JavaScript syntax error"
    );
  });
});

test("main UI exposes the existing review inbox and its owner-only actions", () => {
  assert.match(html, /id="humanReviewPanel"/);
  assert.match(html, /getReviewQueueForBrowser/);
  assert.match(html, /updateReviewStatusFromBrowser/);
});
