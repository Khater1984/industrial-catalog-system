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
  "domain/CatalogService.js",
  "domain/Ingest.js",
  "domain/WorkerIntegration.js",
  "domain/StagingPromotion.js",
  "domain/ImagePromotion.js",
  "api/Api.js",
];

let code = "// Auto-generated bundle. Do not edit.\n\n";
for (const rel of order) {
  const file = path.join(src, rel);
  if (fs.existsSync(file)) {
    code += `// ===== ${rel} =====\n` + fs.readFileSync(file, "utf8") + "\n\n";
  }
}

fs.writeFileSync(path.join(dist, "Code.gs"), code);
console.log("Built dist/Code.gs");
