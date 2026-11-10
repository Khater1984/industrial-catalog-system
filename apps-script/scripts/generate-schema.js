const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const schemaFiles = [
  "../schema/01-source-and-products.md",
  "../schema/02-documents-and-images.md",
  "../schema/03-design-and-issued-output.md",
  "../schema/04-workflow-and-audit.md"
];

function parseTable(lines, startIndex) {
  let headerIndex = startIndex + 1;
  while (headerIndex < lines.length && !/^#{1,3}\s/.test(lines[headerIndex]) && !lines[headerIndex].startsWith("| Column |")) {
    headerIndex += 1;
  }
  if (headerIndex >= lines.length || !lines[headerIndex].startsWith("| Column |")) return null;

  const fields = [];
  for (let index = headerIndex + 2; index < lines.length && lines[index].startsWith("|"); index += 1) {
    const cells = lines[index].split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length >= 3 && cells[0] !== "---") {
      fields.push({ name: cells[0], type: cells[1], required: cells[2], rule: cells[3] || "" });
    }
  }
  return fields;
}

function parseSchemaTables() {
  const tables = {};
  const rules = {};
  for (const relativePath of schemaFiles) {
    const lines = fs.readFileSync(path.join(root, relativePath), "utf8").split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const heading = lines[index].match(/^###\s+(?:\d+(?:\.\d+)?\s+)?`([^`]+)`/);
      if (!heading) continue;
      const fields = parseTable(lines, index);
      if (!fields) continue;
      const tableName = heading[1];
      if (tables[tableName]) throw new Error("SCHEMA_DUPLICATE_TABLE: " + tableName);
      tables[tableName] = fields.map((field) => field.name);
      rules[tableName] = Object.fromEntries(fields.map((field) => [field.name, { type: field.type, required: field.required }]));
    }
  }

  const workflowLines = fs.readFileSync(path.join(root, schemaFiles[3]), "utf8").split(/\r?\n/);
  const commonHeading = workflowLines.findIndex((line) => line.startsWith("### Common staging envelope"));
  if (commonHeading < 0) throw new Error("SCHEMA_COMMON_STAGING_ENVELOPE_MISSING");
  const commonFields = parseTable(workflowLines, commonHeading);
  if (!commonFields) throw new Error("SCHEMA_COMMON_STAGING_FIELDS_MISSING");

  const stagingTables = ["Staging_Products", "Staging_Variants", "Staging_Specifications", "Staging_Images", "Staging_Documents"];
  for (const tableName of stagingTables) {
    if (!tables[tableName]) throw new Error("SCHEMA_STAGING_TABLE_MISSING: " + tableName);
    const merged = commonFields.concat(Object.keys(rules[tableName]).map((name) => ({
      name,
      type: rules[tableName][name].type,
      required: rules[tableName][name].required
    })));
    const seen = new Set();
    tables[tableName] = merged.filter((field) => {
      if (seen.has(field.name)) return false;
      seen.add(field.name);
      return true;
    }).map((field) => field.name);
    rules[tableName] = Object.fromEntries(merged.map((field) => [field.name, { type: field.type, required: field.required }]));
  }

  // The source-key algorithm version is explicitly required for product/model/specification staging by the normative prose.
  for (const tableName of ["Staging_Products", "Staging_Variants", "Staging_Specifications"]) {
    rules[tableName].Source_Key_Algorithm_Version.required = "Yes";
  }
  return { tables, rules };
}

function parseEnums() {
  const lines = fs.readFileSync(path.join(root, "../ENUM_REGISTRY.md"), "utf8").split(/\r?\n/);
  const enums = {};
  const required = {};
  let group = null;
  for (const line of lines) {
    const heading = line.match(/^###\s+`([^`]+)`/);
    if (heading) {
      group = heading[1];
      continue;
    }
    if (line.startsWith("### Common staging envelope")) {
      group = "Common staging envelope (all Staging_* sheets)";
      continue;
    }
    if (!group || !line.startsWith("| `")) continue;
    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    const field = cells[0].replace(/`/g, "");
    const key = group + "." + field;
    let values = cells[2].split(",").map((value) => value.trim()).filter(Boolean);
    if (group === "Promotion_Mappings" && field === "Canonical_Entity_Type") values = ["PRODUCT", "VARIANT"];
    enums[key] = values;
    required[key] = cells[1] === "Yes";
  }
  return { enums, required };
}

function main() {
  const { tables, rules } = parseSchemaTables();
  const { enums, required } = parseEnums();
  const tableNames = Object.keys(tables);
  const columnCount = Object.values(tables).reduce((sum, columns) => sum + columns.length, 0);
  if (tableNames.length !== 52) throw new Error("SCHEMA_TABLE_COUNT_MISMATCH: " + tableNames.length);
  if (columnCount !== 713) throw new Error("SCHEMA_COLUMN_COUNT_MISMATCH: " + columnCount);
  if (Object.keys(enums).length !== 79) throw new Error("SCHEMA_ENUM_COUNT_MISMATCH: " + Object.keys(enums).length);

  const output = [
    "/** Generated from approved V2.1 domain schema + ENUM_REGISTRY.md. Do not hand-edit table headers. */",
    'var APP = Object.freeze({ VERSION: "0.2.0-dev", SCHEMA_VERSION: "2.1", ENVIRONMENT: "DEV", ACTOR_ID: "actor_primary" });',
    "",
    "var TABLES = Object.freeze({",
    Object.entries(tables).map(([name, columns]) => "  " + name + ": [" + columns.map((column) => JSON.stringify(column)).join(", ") + "]").join(",\n"),
    "});",
    "",
    "var ENUMS = Object.freeze({",
    Object.entries(enums).map(([key, values]) => "  " + JSON.stringify(key) + ": [" + values.map((value) => JSON.stringify(value)).join(", ") + "]").join(",\n"),
    "});",
    "",
    "var ENUM_REQUIRED = Object.freeze({",
    Object.entries(required).map(([key, isRequired]) => "  " + JSON.stringify(key) + ": " + isRequired).join(",\n"),
    "});",
    "",
    "var FIELD_RULES = Object.freeze({",
    Object.entries(rules).flatMap(([tableName, fields]) => Object.entries(fields).map(([fieldName, field]) => [
      "  " + JSON.stringify(tableName + "." + fieldName) + ": { type: " + JSON.stringify(field.type) +
      ", required: " + (field.required === "Yes") + ", conditional: " + (field.required === "Conditional") + " }"
    ][0])).join(",\n"),
    "});",
    ""
  ].join("\n");

  const target = path.join(root, "src/config/Schema.js");
  fs.writeFileSync(target, output, "utf8");
  console.log("Generated " + tableNames.length + " tables, " + columnCount + " columns, and " + Object.keys(enums).length + " enum fields.");
}

main();
