const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).sort().forEach(k => { out[k] = canonical(value[k]); });
    return out;
  }
  return value;
}
function recordHash(record, field) {
  const copy = { ...record };
  delete copy[field];
  return sha(Buffer.from(JSON.stringify(canonical(copy)), "utf8"));
}
function makeImage(index, bytes) {
  const image = {
    unit_type: "IMAGE",
    unit_key: "page-1:image:" + index,
    catalog_id: "catalog_test",
    run_id: "run_test",
    catalog_page_id: "page_test_001",
    page_number: 1,
    image_index: index,
    original_name: "image-" + index + ".png",
    mime_type: "image/png",
    width_px: 20 + index,
    height_px: 30 + index,
    file_size_bytes: bytes.length,
    sha256: sha(bytes),
    extractor_version: "0.1.0",
    artifact_path: "images/page-00001/" + sha(bytes) + ".png"
  };
  image.output_sha256 = recordHash(image, "output_sha256");
  return image;
}
function makeImageManifest(images, overrides = {}) {
  const manifest = {
    manifest_version: 1,
    catalog_id: "catalog_test",
    run_id: "run_test",
    source_sha256: "a".repeat(64),
    page_count: 1,
    image_count: images.length,
    feature_flag: "CATALOG_WORKER_EXTRACT_IMAGES",
    extractor_version: "0.1.0",
    images,
    ...overrides
  };
  manifest.manifest_sha256 = recordHash(manifest, "manifest_sha256");
  return manifest;
}
function makeDriveManifest(imageManifest, images, overrides = {}) {
  const uploaded = images.filter(x => x.upload_status === "UPLOADED").length;
  const reused = images.filter(x => x.upload_status === "REUSED").length;
  const failed = images.filter(x => x.upload_status === "FAILED").length;
  const manifest = {
    manifest_version: 1,
    source_manifest_sha256: imageManifest.manifest_sha256,
    catalog_id: imageManifest.catalog_id,
    run_id: imageManifest.run_id,
    drive_folder_id: "drive-folder-test",
    image_count: images.length,
    uploaded_count: uploaded,
    reused_count: reused,
    stored_count: uploaded + reused,
    failed_count: failed,
    overall_status: failed === 0 ? "COMPLETED" : (uploaded + reused ? "PARTIAL" : "FAILED"),
    images,
    ...overrides
  };
  manifest.manifest_sha256 = recordHash(manifest, "manifest_sha256");
  return manifest;
}
function createHarness(options = {}) {
  const sheets = {
    Staging_Images: [],
    Review_Queue: [],
    Review_Staging_Links: [],
    Image_Assets: [],
    Image_Links: []
  };
  const files = {};
  const lock = { acquired: 0, released: 0 };
  const failure = { table: options.failAppendTable || null, remaining: options.failAppendCount || 0 };
  globalThis.__unused = null;
  const context = {
    console,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    isFinite,
    APP: { ACTOR_ID: "actor_test" },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      newBlob: value => ({
        getBytes: () => Array.from(Buffer.from(String(value), "utf8")),
        getDataAsString: () => String(value)
      }),
      computeDigest: (_algorithm, value) => Array.from(
        crypto.createHash("sha256").update(Buffer.from(value.map(b => b < 0 ? b + 256 : b))).digest()
      )
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => { lock.acquired += 1; },
        releaseLock: () => { lock.released += 1; }
      })
    },
    SheetsRepository: {
      getBy: (table, column, value) => sheets[table].find(row => String(row[column]) === String(value)) || null,
      append: (table, record) => {
        if (failure.table === table && failure.remaining > 0) {
          failure.remaining -= 1;
          throw new Error("MOCK_APPEND_FAILURE");
        }
        sheets[table].push({ ...record });
        return sheets[table].length;
      }
    },
    DriveApp: {
      getFileById: id => {
        const file = files[id];
        if (!file) throw new Error("not found");
        return file;
      }
    }
  };
  const imageBytes = options.imageBytes || Buffer.from("synthetic-png-image-content");
  const image = makeImage(1, imageBytes);
  const imageManifest = makeImageManifest([image]);
  const driveImage = {
    sha256: image.sha256,
    artifact_path: image.artifact_path,
    drive_file_id: "drive-image-file-id-0000001",
    drive_filename: image.sha256 + ".png",
    mime_type: "image/png",
    width_px: image.width_px,
    height_px: image.height_px,
    file_size_bytes: image.file_size_bytes,
    catalog_id: imageManifest.catalog_id,
    run_id: imageManifest.run_id,
    page_number: 1,
    catalog_page_id: image.catalog_page_id,
    upload_status: options.uploadStatus || "UPLOADED"
  };
  const driveManifest = makeDriveManifest(imageManifest, [driveImage]);
  if (options.enriched) {
    imageManifest.enabled = true;
    imageManifest.images[0].drive_file_id = driveImage.drive_file_id;
    imageManifest.images[0].drive_sha256 = driveImage.sha256;
    imageManifest.manifest_sha256 = recordHash(imageManifest, "manifest_sha256");
  }
  function addJsonFile(id, value) {
    const raw = Buffer.from(JSON.stringify(value), "utf8");
    files[id] = {
      getBlob: () => ({
        getBytes: () => Array.from(raw),
        getDataAsString: () => raw.toString("utf8")
      }),
      getSize: () => raw.length,
      getMimeType: () => "application/json"
    };
    return sha(raw);
  }
  function addImageFile(id, bytes, mime = "image/png") {
    files[id] = {
      getBlob: () => ({ getBytes: () => Array.from(bytes) }),
      getSize: () => bytes.length,
      getMimeType: () => mime
    };
  }
  const imageManifestSha = addJsonFile("image-manifest-file-id-0001", imageManifest);
  const driveManifestSha = addJsonFile("drive-manifest-file-id-0001", driveManifest);
  addImageFile(driveImage.drive_file_id, imageBytes);
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "../src/domain/ImageReviewIntake.js"), "utf8"),
    context,
    { filename: "ImageReviewIntake.js" }
  );
  return {
    context, sheets, files, lock, image, imageManifest, driveImage, driveManifest,
    imageManifestSha, driveManifestSha, failure,
    intake(extra = {}) {
      return context.ImageReviewIntake.intake({
        imageManifestFileId: "image-manifest-file-id-0001",
        imageManifestSha256: imageManifestSha,
        driveManifestFileId: "drive-manifest-file-id-0001",
        driveManifestSha256: driveManifestSha,
        actor: "actor_test",
        ...extra
      });
    }
  };
}

describe("ImageReviewIntake", () => {
  it("verifies both canonical manifest checksums and raw file digests", () => {
    const h = createHarness();
    const tampered = { ...h.imageManifest, catalog_id: "tampered_catalog" };
    h.files["image-manifest-file-id-0001"].getBlob = () => {
      const raw = Buffer.from(JSON.stringify(tampered), "utf8");
      return { getBytes: () => Array.from(raw), getDataAsString: () => raw.toString("utf8") };
    };
    assert.throws(() => h.intake(), /MANIFEST_CHECKSUM_INVALID/);
    assert.equal(h.sheets.Staging_Images.length, 0);
  });

  it("rejects mismatched catalog and run identity before writing", () => {
    const h = createHarness();
    const wrong = makeDriveManifest(h.imageManifest, [{
      ...h.driveImage, catalog_id: "another_catalog"
    }]);
    const raw = Buffer.from(JSON.stringify(wrong), "utf8");
    h.files["drive-manifest-file-id-0001"].getBlob = () => ({
      getBytes: () => Array.from(raw), getDataAsString: () => raw.toString("utf8")
    });
    h.intake = () => h.context.ImageReviewIntake.intake({
      imageManifestFileId: "image-manifest-file-id-0001",
      driveManifestFileId: "drive-manifest-file-id-0001",
      actor: "actor_test"
    });
    assert.throws(() => h.intake(), /DRIVE_IMAGE_IDENTITY_MISMATCH/);
    assert.equal(h.sheets.Staging_Images.length, 0);
  });

  it("accepts the Runner-enriched image manifest while validating the original worker checksum", () => {
    const h = createHarness({ enriched: true });
    const result = h.intake();
    assert.equal(result.status, "COMPLETED");
    assert.equal(h.sheets.Staging_Images.length, 1);
    assert.equal(h.sheets.Review_Queue.length, 1);
    assert.equal(h.sheets.Review_Staging_Links.length, 1);
  });

  it("creates all three review records for UPLOADED and REUSED images", () => {
    for (const status of ["UPLOADED", "REUSED"]) {
      const h = createHarness({ uploadStatus: status });
      const result = h.intake();
      assert.equal(result.status, "COMPLETED");
      assert.equal(result.counts.staging, 1);
      assert.equal(result.counts.reviews, 1);
      assert.equal(result.counts.links, 1);
      assert.equal(result.counts.failed, 0);
      const staging = h.sheets.Staging_Images[0];
      assert.equal(staging.Extraction_Method, "IMAGE_EXTRACTION");
      assert.equal(staging.Proposed_Status, "NEEDS_REVIEW");
      assert.equal(staging.Quality_Status, "NEEDS_REVIEW");
      assert.equal(staging.Proposed_Image_File_ID, h.driveImage.drive_file_id);
      assert.equal(staging.File_Size_Bytes, h.image.file_size_bytes);
      assert.equal(h.sheets.Review_Queue[0].Review_Type, "IMAGE_QUALITY");
      assert.equal(h.sheets.Review_Queue[0].Review_Status, "OPEN");
      assert.equal(h.sheets.Review_Staging_Links[0].Review_Role, "PRIMARY");
      assert.equal(h.sheets.Image_Assets.length, 0);
      assert.equal(h.sheets.Image_Links.length, 0);
    }
  });

  it("is idempotent and does not reset a human review decision", () => {
    const h = createHarness();
    h.intake();
    h.sheets.Review_Queue[0].Review_Status = "APPROVED";
    const result = h.intake();
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.counts.reused, 1);
    assert.equal(h.sheets.Staging_Images.length, 1);
    assert.equal(h.sheets.Review_Queue.length, 1);
    assert.equal(h.sheets.Review_Queue[0].Review_Status, "APPROVED");
    assert.equal(h.sheets.Review_Staging_Links.length, 1);
  });

  it("completes missing review links on a safe retry after partial failure", () => {
    const h = createHarness({ failAppendTable: "Review_Staging_Links", failAppendCount: 1 });
    const first = h.intake();
    assert.equal(first.status, "PARTIAL");
    assert.equal(h.sheets.Staging_Images.length, 1);
    assert.equal(h.sheets.Review_Queue.length, 1);
    assert.equal(h.sheets.Review_Staging_Links.length, 0);
    const second = h.intake();
    assert.equal(second.status, "COMPLETED");
    assert.equal(h.sheets.Staging_Images.length, 1);
    assert.equal(h.sheets.Review_Queue.length, 1);
    assert.equal(h.sheets.Review_Staging_Links.length, 1);
  });

  it("rejects an existing staging ID whose immutable content differs", () => {
    const h = createHarness();
    const stagingId = "stgimg_" + sha(Buffer.from("run_test|" + h.image.sha256 + "|" + h.image.artifact_path)).slice(0, 24);
    h.sheets.Staging_Images.push({
      Staging_ID: stagingId, SHA256: "f".repeat(64),
      Proposed_Image_File_ID: h.driveImage.drive_file_id
    });
    const result = h.intake();
    assert.equal(result.status, "FAILED");
    assert.equal(result.counts.conflicts, 1);
    assert.equal(h.sheets.Review_Queue.length, 0);
  });

  it("checks actual Drive bytes, MIME type and size", () => {
    const h = createHarness();
    h.files[h.driveImage.drive_file_id].getSize = () => h.image.file_size_bytes + 1;
    const result = h.intake();
    assert.equal(result.status, "FAILED");
    assert.match(result.results[0].reason, /DRIVE_FILE_SIZE_MISMATCH/);
    assert.equal(h.sheets.Staging_Images.length, 0);
  });

  it("uses the script lock and releases it on completion", () => {
    const h = createHarness();
    h.intake();
    assert.equal(h.lock.acquired, 1);
    assert.equal(h.lock.released, 1);
  });
});
