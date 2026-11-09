/** Template Studio — lightweight template definitions for DEV.
 * Stored in Script Properties. Not a replacement for the proposed Schema tables.
 * Templates are independent of Brand Identity and business data.
 */
var TemplateStudio = (function () {
  var KEY = "TEMPLATE_STUDIO_TEMPLATES";

  function load_() {
    var raw = PropertiesService.getScriptProperties().getProperty(KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }

  function save_(items) {
    PropertiesService.getScriptProperties().setProperty(KEY, JSON.stringify(items));
  }

  function list() {
    return load_();
  }

  function saveTemplate(t) {
    if (!t || !t.name) throw new Error("VALIDATION_REQUIRED: name");
    if (!["TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG"].includes(t.documentType)) {
      throw new Error("DOCUMENT_TYPE_UNSUPPORTED");
    }
    var items = load_();
    var idx = items.findIndex(function (x) { return x.name === t.name; });
    var record = {
      name: String(t.name).slice(0, 80),
      documentType: t.documentType,
      description: String(t.description || "").slice(0, 300),
      includeIndex: t.includeIndex !== false,
      groupByFamily: !!t.groupByFamily,
      showProvenance: !!t.showProvenance,
      excludeUnpublished: !!t.excludeUnpublished,
      defaultBrandName: String(t.defaultBrandName || "").slice(0, 80),
      version: (idx >= 0 ? (items[idx].version || 1) + 1 : 1),
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) items[idx] = record;
    else items.push(record);
    save_(items);
    return record;
  }

  function getByName(name) {
    return load_().find(function (t) { return t.name === name; }) || null;
  }

  return { list: list, saveTemplate: saveTemplate, getByName: getByName };
})();

function listTemplatesForBrowser() {
  assertPrimaryUser_();
  return TemplateStudio.list();
}

function saveTemplateFromBrowser(t) {
  assertPrimaryUser_();
  return TemplateStudio.saveTemplate(t);
}
