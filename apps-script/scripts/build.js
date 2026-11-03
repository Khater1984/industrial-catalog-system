const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sources = [
  "src/config/Schema.js",
  "src/validation/InputValidation.js",
  "src/security/Auth.js",
  "src/repositories/SheetsRepository.js",
  "src/domain/CatalogService.js",
  "src/api/Api.js"
];

const output = sources.map((relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error("BUILD_SOURCE_MISSING: " + relativePath);
  return [
    "/** BEGIN SOURCE: " + relativePath + " */",
    fs.readFileSync(absolutePath, "utf8").trimEnd(),
    "/** END SOURCE: " + relativePath + " */"
  ].join("\n");
}).join("\n\n") + "\n";

const dist = path.join(root, "dist");
fs.mkdirSync(dist, { recursive: true });
const target = path.join(dist, "Code.gs");
fs.writeFileSync(target, output, "utf8");
console.log("Built " + target + " from " + sources.length + " source files.");
