const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/domain/ImageManagement.js", "utf8");
function buildContext(seed = {}) {
  const store = Object.assign({
    Image_Assets: [
      { Image_ID: "img1", Original_File_ID: "drive_file_0001", Original_File_Name: "one.png", MIME_Type: "image/png", Width_PX: 800, Height_PX: 600, SHA256: "a".repeat(64), Lifecycle_Status: "ACTIVE" },
      { Image_ID: "img2", Original_File_ID: "drive_file_0002", Original_File_Name: "two.png", MIME_Type: "image/png", Width_PX: 900, Height_PX: 700, SHA256: "b".repeat(64), Lifecycle_Status: "ACTIVE" },
      { Image_ID: "img3", Original_File_ID: "drive_file_0003", Original_File_Name: "three.png", MIME_Type: "image/png", Width_PX: 500, Height_PX: 500, SHA256: "c".repeat(64), Lifecycle_Status: "ARCHIVED" }
    ],
    Image_Links: [],
    Products: [{ Product_ID: "P1", Lifecycle_Status: "ACTIVE" }, { Product_ID: "P2", Lifecycle_Status: "ACTIVE" }],
    Variants: [{ Variant_ID: "V1", Product_ID: "P1", Lifecycle_Status: "ACTIVE" }, { Variant_ID: "V2", Product_ID: "P2", Lifecycle_Status: "ACTIVE" }]
  }, seed);
  const context = {
    APP: { ACTOR_ID: "test-actor" },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      computeDigest: (_algorithm, value) => Array.from(crypto.createHash("sha256").update(Buffer.from(String(value))).digest())
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SheetsRepository: {
      getBy(table, key, value) { return (store[table] || []).find(row => String(row[key]) === String(value)) || null; },
      listAll(table) { return (store[table] || []).map(row => Object.assign({}, row)); },
      append(table, record) { (store[table] || (store[table] = [])).push(Object.assign({}, record)); return store[table].length; },
      updateBy(table, key, value, patch) {
        const row = (store[table] || []).find(item => String(item[key]) === String(value));
        if (!row) throw new Error("ROW_NOT_FOUND: " + table);
        Object.assign(row, patch);
        return 1;
      }
    }
  };
  vm.runInNewContext(source, context);
  return { service: context.ImageManagement, store };
}

test("links are candidate by default and idempotent", () => {
  const { service, store } = buildContext();
  const first = service.linkToTarget("img1", "PRODUCT", "P1");
  const second = service.linkToTarget("img1", "PRODUCT", "P1");
  assert.equal(first.status, "CREATED");
  assert.equal(second.status, "EXISTS");
  assert.equal(store.Image_Links.length, 1);
  assert.equal(store.Image_Links[0].Link_Status, "CANDIDATE");
});

test("cannot create a primary link before an approval and activation", () => {
  const { service, store } = buildContext();
  assert.throws(() => service.linkToTarget("img1", "PRODUCT", "P1", { isPrimary: true }), /IMAGE_PRIMARY_REQUIRES_ACTIVE_APPROVAL/);
  assert.equal(store.Image_Links.length, 0);
});

test("cannot activate a link until at least one publication channel is approved", () => {
  const { service } = buildContext();
  const link = service.linkToTarget("img1", "PRODUCT", "P1");
  assert.throws(() => service.setApproval(link.linkId, { linkStatus: "ACTIVE" }), /IMAGE_ACTIVE_REQUIRES_APPROVAL/);
  service.setApproval(link.linkId, { catalogApproved: true, linkStatus: "ACTIVE" });
  assert.equal(service.getImagesForProduct("P1", null, "CATALOG").count, 1);
});

test("approval is independent and primary selection clears the previous primary", () => {
  const { service, store } = buildContext();
  const one = service.linkToTarget("img1", "PRODUCT", "P1");
  service.setApproval(one.linkId, { catalogApproved: true, linkStatus: "ACTIVE" });
  service.setPrimary(one.linkId);
  const two = service.linkToTarget("img2", "PRODUCT", "P1");
  service.setApproval(two.linkId, { dataSheetApproved: true, linkStatus: "ACTIVE" });
  service.setPrimary(two.linkId);
  assert.equal(store.Image_Links.find(row => row.Image_Link_ID === one.linkId).Is_Primary, false);
  assert.equal(store.Image_Links.find(row => row.Image_Link_ID === two.linkId).Is_Primary, true);
  assert.equal(store.Image_Links.find(row => row.Image_Link_ID === two.linkId).Catalog_Approved, false);
  assert.equal(store.Image_Links.find(row => row.Image_Link_ID === two.linkId).DataSheet_Approved, true);
});

test("publication queries return only active links approved for the requested use", () => {
  const { service } = buildContext();
  const one = service.linkToTarget("img1", "PRODUCT", "P1");
  service.setApproval(one.linkId, { catalogApproved: true, linkStatus: "ACTIVE" });
  const two = service.linkToTarget("img2", "PRODUCT", "P1");
  service.setApproval(two.linkId, { dataSheetApproved: true, linkStatus: "ACTIVE" });
  assert.deepEqual(Array.from(service.getImagesForProduct("P1", null, "CATALOG").images, x => x.imageId), ["img1"]);
  assert.deepEqual(Array.from(service.getImagesForProduct("P1", null, "DATASHEET").images, x => x.imageId), ["img2"]);
  assert.deepEqual(Array.from(service.getImagesForProduct("P1").images, x => x.imageId).sort(), ["img1", "img2"]);
});

test("variant images take precedence only within their approved publication channel", () => {
  const { service } = buildContext();
  const product = service.linkToTarget("img1", "PRODUCT", "P1");
  service.setApproval(product.linkId, { catalogApproved: true, dataSheetApproved: true, linkStatus: "ACTIVE" });
  const variant = service.linkToTarget("img2", "VARIANT", "V1");
  service.setApproval(variant.linkId, { dataSheetApproved: true, linkStatus: "ACTIVE" });
  assert.deepEqual(Array.from(service.getImagesForProduct("P1", "V1", "CATALOG").images, x => x.imageId), ["img1"]);
  assert.deepEqual(Array.from(service.getImagesForProduct("P1", "V1", "DATASHEET").images, x => x.imageId), ["img2"]);
});

test("rejects a variant belonging to another product", () => {
  const { service } = buildContext();
  assert.throws(() => service.getImagesForProduct("P1", "V2"), /VARIANT_PRODUCT_MISMATCH/);
});

test("cannot activate or select an archived asset", () => {
  const { service } = buildContext();
  assert.throws(() => service.linkToTarget("img3", "PRODUCT", "P1"), /IMAGE_ASSET_NOT_ACTIVE/);
});

test("rejecting a link revokes approvals and primary state", () => {
  const { service, store } = buildContext();
  const link = service.linkToTarget("img1", "PRODUCT", "P1");
  service.setApproval(link.linkId, { catalogApproved: true, linkStatus: "ACTIVE" });
  service.setPrimary(link.linkId);
  service.setApproval(link.linkId, { linkStatus: "REJECTED" });
  assert.equal(store.Image_Links[0].Catalog_Approved, false);
  assert.equal(store.Image_Links[0].DataSheet_Approved, false);
  assert.equal(store.Image_Links[0].Is_Primary, false);
  assert.equal(service.getImagesForProduct("P1").count, 0);
});

test("orders images by primary then publication order", () => {
  const { service } = buildContext();
  const one = service.linkToTarget("img1", "PRODUCT", "P1", { catalogOrder: 20 });
  service.setApproval(one.linkId, { catalogApproved: true, linkStatus: "ACTIVE" });
  const two = service.linkToTarget("img2", "PRODUCT", "P1", { catalogOrder: 10 });
  service.setApproval(two.linkId, { catalogApproved: true, linkStatus: "ACTIVE" });
  assert.deepEqual(Array.from(service.getImagesForProduct("P1", null, "CATALOG").images, x => x.imageId), ["img2", "img1"]);
});

test("finds exact SHA256 duplicates case-insensitively", () => {
  const { service } = buildContext();
  assert.equal(service.findDuplicateBySha256("A".repeat(64)).imageId, "img1");
  assert.equal(service.findDuplicateBySha256("d".repeat(64)).duplicate, false);
  assert.throws(() => service.findDuplicateBySha256("not-a-sha"), /IMAGE_SHA256_INVALID/);
});
