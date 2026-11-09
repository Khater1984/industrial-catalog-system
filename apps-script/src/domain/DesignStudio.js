/** Design Studio — prepares immutable issue snapshots for the PDF renderer.
 * Stores brand presets in Script Properties (DEV only). No new schema tables.
 */
var DesignStudio = (function () {
  var PRESET_KEY = "DESIGN_STUDIO_PRESETS";

  function getPresets_() {
    var raw = PropertiesService.getScriptProperties().getProperty(PRESET_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }

  function savePresets_(presets) {
    PropertiesService.getScriptProperties().setProperty(PRESET_KEY, JSON.stringify(presets));
  }

  function listBrandPresets() {
    return getPresets_();
  }

  function saveBrandPreset(preset) {
    if (!preset || !preset.name) throw new Error("VALIDATION_REQUIRED: name");
    var presets = getPresets_();
    var existing = presets.findIndex(function (p) { return p.name === preset.name; });
    var record = {
      name: String(preset.name).slice(0, 80),
      primary: preset.primary || "#173F5F",
      text: preset.text || "#17212B",
      paperSize: preset.paperSize || "A4",
      orientation: preset.orientation || "portrait",
      updatedAt: new Date().toISOString()
    };
    if (existing >= 0) presets[existing] = record;
    else presets.push(record);
    savePresets_(presets);
    return record;
  }

  function buildIssueSnapshot(config) {
    if (!config || !config.documentType) throw new Error("VALIDATION_REQUIRED: documentType");
    if (!["TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG"].includes(config.documentType)) {
      throw new Error("DOCUMENT_TYPE_UNSUPPORTED");
    }
    var items = Array.isArray(config.items) ? config.items : [];
    if (!items.length) throw new Error("ISSUE_SCOPE_EMPTY");
    return {
      snapshot_version: "1",
      document_type: config.documentType,
      title: config.title || "Industrial Catalog",
      subtitle: config.subtitle || "",
      items: items.map(function (it) {
        return {
          name: it.name || "",
          name_ar: it.name_ar || "",
          model_number: it.model_number || "",
          description: it.description || "",
          family: it.family || "",
          specifications: Array.isArray(it.specifications) ? it.specifications : [],
          images: Array.isArray(it.images) ? it.images : [],
          publishable: it.publishable !== false
        };
      }),
      brand: {
        palette: {
          primary: config.primary || "#173F5F",
          text: config.text || "#17212B"
        }
      },
      paper: {
        page: {
          size: config.paperSize || "A4",
          orientation: config.orientation || "portrait",
          margins_mm: { top: 18, right: 12, bottom: 16, left: 12 }
        },
        background: { color: "#FFFFFF" }
      },
      export_profile: { output_class: "DIGITAL_PDF", minimum_dpi_warning: 150, minimum_dpi_block: 72 },
      contact: config.contact || {},
      document_status: config.documentStatus || "ORIGINAL",
      revision: config.revision || "",
      issue_date: config.issueDate || new Date().toISOString().slice(0, 10),
      show_provenance: !!config.showProvenance,
      group_by_family: !!config.groupByFamily,
      include_index: config.includeIndex !== false,
      conflicts: Array.isArray(config.conflicts) ? config.conflicts : []
    };
  }

  return {
    listBrandPresets: listBrandPresets,
    saveBrandPreset: saveBrandPreset,
    buildIssueSnapshot: buildIssueSnapshot
  };
})();

function listBrandPresetsForBrowser() {
  assertPrimaryUser_();
  return DesignStudio.listBrandPresets();
}

function saveBrandPresetFromBrowser(preset) {
  assertPrimaryUser_();
  return DesignStudio.saveBrandPreset(preset);
}

function buildIssueSnapshotFromBrowser(config) {
  assertPrimaryUser_();
  return DesignStudio.buildIssueSnapshot(config);
}
