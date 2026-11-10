const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");

if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true });

const order = [
  "config/Schema.js",
  "repositories/SheetsRepository.js",
  "security/Auth.js",
  "validation/InputValidation.js",

  // Canonical product and specification domain
  "domain/ProductService.js",
  "domain/ProductFamilyService.js",
  "domain/VariantService.js",
  "domain/AttributeService.js",
  "domain/SpecificationService.js",
  "domain/EffectiveSpecificationResolver.js",

  // Catalog intake, worker, and human-review pipeline
  "domain/CatalogService.js",
  "domain/Ingest.js",
  "domain/CandidateReviewIntake.js",
  "domain/WorkerIntegration.js",
  "domain/StagingPromotion.js",
  "domain/ImagePromotion.js",
  "domain/ImageReviewIntake.js",
  "domain/ReviewWorkspace.js",

  // Documents, backups, and design
  "domain/DocumentService.js",
  "domain/BackupService.js",
  "domain/DesignService.js",
  "domain/DesignStudio.js",

  // Public Apps Script entry points must be bundled last
  "api/Api.js",
];

let code = "// Auto-generated bundle. Do not edit.\n\n";
for (const rel of order) {
  const file = path.join(src, rel);
  if (!fs.existsSync(file)) {
    throw new Error(`Required Apps Script source file is missing: ${rel}`);
  }
  code += `// ===== ${rel} =====\n` + fs.readFileSync(file, "utf8") + "\n\n";
}

const htmlSource = path.join(root, "Index.html");
if (!fs.existsSync(htmlSource)) {
  throw new Error("Required Apps Script HTML file is missing: Index.html");
}

fs.writeFileSync(path.join(dist, "Code.gs"), code);
fs.copyFileSync(htmlSource, path.join(dist, "Index.html"));
console.log("Built dist/Code.gs and copied dist/Index.html");
