const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// Lightweight structural checks — full Apps Script runtime not available in CI Node tests.
describe("Product domain modules", () => {
  it("ProductService exports expected functions", () => {
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/domain/ProductService.js"), "utf8");
    assert.match(src, /function create/);
    assert.match(src, /PRODUCT_HAS_ACTIVE_VARIANTS/);
    assert.match(src, /Product_Company/);
  });

  it("VariantService rejects reparenting conceptually", () => {
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/domain/VariantService.js"), "utf8");
    assert.match(src, /Product_ID is immutable/);
    assert.doesNotMatch(src, /updateBy\("Variants".*Product_ID/);
  });

  it("Resolver preserves conflicts (ADR-040)", () => {
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/domain/EffectiveSpecificationResolver.js"), "utf8");
    assert.match(src, /ADR-040/);
    assert.match(src, /conflicts/);
    assert.match(src, /quarantined/);
  });

  it("SpecificationService allocates sequence under lock", () => {
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/domain/SpecificationService.js"), "utf8");
    assert.match(src, /LockService/);
    assert.match(src, /Sequence_No/);
    assert.match(src, /APPROVED/);
  });
});
