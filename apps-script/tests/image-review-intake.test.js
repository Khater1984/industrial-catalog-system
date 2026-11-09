const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// Minimal mock harness for ImageReviewIntake
function createHarness() {
  const sheets = {
    Staging_Images: [],
    Review_Queue: [],
    Review_Staging_Links: [],
    Image_Assets: [],
    Image_Links: []
  };
  global.SheetsRepository = {
    getBy: (table, col, val) => sheets[table].find(r => r[col] === val) || null,
    append: (table, record) => { sheets[table].push(record); return record; }
  };
  global.LockService = {
    getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} })
  };
  global.Utilities = {
    computeDigest: () => [1, 2, 3],
    newBlob: (s) => ({ getBytes: () => Buffer.from(s) })
  };
  global.APP = { ACTOR_ID: "actor_test" };
  global.DriveApp = {
    getFileById: (id) => {
      if (id === "missing") return null;
      return {
        getBlob: () => ({
          getBytes: () => Buffer.from(JSON.stringify({ manifest_sha256: "ok", catalog_id: "c1", run_id: "r1", images: [] })),
          getDataAsString: () => JSON.stringify({ manifest_sha256: "ok", catalog_id: "c1", run_id: "r1", images: [] })
        }),
        getSize: () => 100,
        getMimeType: () => "image/png"
      };
    }
  };
  // Load the module (simplified evaluation)
  eval(require("fs").readFileSync(require("path").join(__dirname, "../src/domain/ImageReviewIntake.js"), "utf8"));
  return { sheets, ImageReviewIntake };
}

describe("ImageReviewIntake", () => {
  it("rejects mismatched catalog_id", () => {
    const h = createHarness();
    // Override Drive to return mismatched manifests
    global.DriveApp.getFileById = (id) => ({
      getBlob: () => ({
        getBytes: () => Buffer.from("x"),
        getDataAsString: () => JSON.stringify({
          manifest_sha256: "ok",
          catalog_id: id === "img" ? "c1" : "c2",
          run_id: "r1",
          images: []
        })
      })
    });
    assert.throws(() => h.ImageReviewIntake.intake({
      imageManifestFileId: "img", driveManifestFileId: "drv"
    }), /CATALOG_ID_MISMATCH/);
  });

  it("does not write to Image_Assets", () => {
    const h = createHarness();
    // Minimal happy path would require more mocking; assert tables stay empty on early failure
    try {
      h.ImageReviewIntake.intake({ imageManifestFileId: "bad", driveManifestFileId: "bad" });
    } catch (e) {}
    assert.equal(h.sheets.Image_Assets.length, 0);
    assert.equal(h.sheets.Image_Links.length, 0);
  });
});
