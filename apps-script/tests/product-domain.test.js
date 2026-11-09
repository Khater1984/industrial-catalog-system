const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), "utf8");
}

describe("Product domain engine", () => {
  it("ProductService enforces active-variants guard on archive", () => {
    const src = read("../src/domain/ProductService.js");
    assert.match(src, /PRODUCT_HAS_ACTIVE_VARIANTS/);
    assert.match(src, /Product_Company/);
  });

  it("VariantService does not allow reparenting", () => {
    const src = read("../src/domain/VariantService.js");
    assert.match(src, /immutable/);
    assert.doesNotMatch(src, /updateBy\([^)]*Product_ID/);
  });

  it("Resolver implements ADR-040 conflict reporting and company-created specs", () => {
    const src = read("../src/domain/EffectiveSpecificationResolver.js");
    assert.match(src, /ADR-040/);
    assert.match(src, /COMPANY_ADDED/);
    assert.match(src, /QUARANTINED/);
    assert.match(src, /company_attributes/);
  });

  it("SpecificationService validates transitions and uses lock", () => {
    const src = read("../src/domain/SpecificationService.js");
    assert.match(src, /LockService/);
    assert.match(src, /INVALID_TRANSITION/);
    assert.match(src, /IDEMPOTENCY_PAYLOAD_MISMATCH/);
    assert.match(src, /tryLock/);
  });

  it("AttributeService distinguishes VALUE and INTENTIONALLY_EMPTY", () => {
    const src = read("../src/domain/AttributeService.js");
    assert.match(src, /INTENTIONALLY_EMPTY_MUST_BE_BLANK/);
    assert.match(src, /CLEAR_OVERRIDE/);
  });
});
