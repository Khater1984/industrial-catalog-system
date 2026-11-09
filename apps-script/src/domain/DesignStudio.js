/** Integrated Design Studio (DEV).
 * Brand identities + templates + domain-aware snapshot generation.
 * Uses Script Properties only. No new Sheets tables.
 * Reads EffectiveSpecificationResolver for real product data.
 */
var DesignStudio = (function () {
  var BRAND_KEY = "DS_BRANDS";
  var TEMPLATE_KEY = "DS_TEMPLATES";
  var ISSUE_KEY = "DS_ISSUES";

  var BUILTIN_BRANDS = [
    {
      name: "Apple",
      identityType: "BUILTIN",
      isDefault: true,
      companyName: "Apple",
      primary: "#000000",
      secondary: "#555555",
      accent: "#0071E3",
      text: "#1D1D1F",
      background: "#FFFFFF",
      headerColor: "#000000",
      tableHeader: "#1D1D1F",
      border: "#E5E5E7",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "COMPANY",
      fontRegular: "",
      fontBold: "",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.08,
      contact: { phone: "", email: "", website: "https://www.apple.com" }
    },
    {
      name: "6D",
      identityType: "BUILTIN",
      isDefault: false,
      companyName: "6D",
      primary: "#0A2540",
      secondary: "#1A6B8A",
      accent: "#00C2B8",
      text: "#17212B",
      background: "#FFFFFF",
      headerColor: "#0A2540",
      tableHeader: "#0A2540",
      border: "#D9E0E7",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "COMPANY",
      fontRegular: "",
      fontBold: "",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.08,
      contact: { phone: "", email: "", website: "" }
    },
    {
      name: "Industrial",
      identityType: "BUILTIN",
      isDefault: false,
      companyName: "Industrial Catalog",
      primary: "#173F5F",
      secondary: "#2D6B83",
      accent: "#E8A838",
      text: "#17212B",
      background: "#FFFFFF",
      headerColor: "#173F5F",
      tableHeader: "#173F5F",
      border: "#D9E0E7",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "COMPANY",
      fontRegular: "",
      fontBold: "",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.08,
      contact: { phone: "", email: "", website: "" }
    },
    {
      name: "Minimal",
      identityType: "BUILTIN",
      isDefault: false,
      companyName: "",
      primary: "#222222",
      secondary: "#666666",
      accent: "#222222",
      text: "#111111",
      background: "#FFFFFF",
      headerColor: "#222222",
      tableHeader: "#333333",
      border: "#CCCCCC",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "NONE",
      fontRegular: "",
      fontBold: "",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.05,
      contact: { phone: "", email: "", website: "" }
    },
    {
      name: "Supplier",
      identityType: "BUILTIN",
      isDefault: false,
      companyName: "",
      primary: "#173F5F",
      secondary: "#2D6B83",
      accent: "#173F5F",
      text: "#17212B",
      background: "#FFFFFF",
      headerColor: "#173F5F",
      tableHeader: "#173F5F",
      border: "#D9E0E7",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "SUPPLIER",
      fontRegular: "",
      fontBold: "",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.08,
      contact: { phone: "", email: "", website: "" }
    }
  ];

  function load_(key) {
    var raw = PropertiesService.getScriptProperties().getProperty(key);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }
  function save_(key, data) {
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(data));
  }

  function ensureBuiltins_() {
    var brands = load_(BRAND_KEY);
    var changed = false;
    BUILTIN_BRANDS.forEach(function (b) {
      if (!brands.some(function (x) { return x.name === b.name; })) {
        brands.push(Object.assign({}, b, { updatedAt: new Date().toISOString() }));
        changed = true;
      }
    });
    if (changed) save_(BRAND_KEY, brands);
    return brands;
  }

  function listBrands() {
    return ensureBuiltins_();
  }

  function getBrand(name) {
    return ensureBuiltins_().find(function (b) { return b.name === name; }) || null;
  }

  function saveBrand(preset) {
    if (!preset || !preset.name) throw new Error("VALIDATION_REQUIRED: name");
    var brands = ensureBuiltins_();
    var idx = brands.findIndex(function (b) { return b.name === preset.name; });
    var record = {
      name: String(preset.name).slice(0, 80),
      identityType: "COMPANY",
      isDefault: false,
      companyName: String(preset.companyName || "").slice(0, 120),
      primary: preset.primary || "#173F5F",
      secondary: preset.secondary || "#2D6B83",
      accent: preset.accent || preset.primary || "#173F5F",
      text: preset.text || "#17212B",
      background: preset.background || "#FFFFFF",
      headerColor: preset.headerColor || preset.primary || "#173F5F",
      tableHeader: preset.tableHeader || preset.primary || "#173F5F",
      border: preset.border || "#D9E0E7",
      paperSize: preset.paperSize || "A4",
      orientation: preset.orientation || "portrait",
      logoPreference: preset.logoPreference || "COMPANY",
      fontRegular: "",
      fontBold: "",
      fontRegularPath: String(preset.fontRegularPath || "").slice(0, 500),
      fontBoldPath: String(preset.fontBoldPath || "").slice(0, 500),
      watermarkText: String(preset.watermarkText || "").slice(0, 60),
      watermarkOpacity: Math.max(0.03, Math.min(0.35, Number(preset.watermarkOpacity) || 0.1)),
      contact: {
        phone: String(preset.phone || "").slice(0, 40),
        email: String(preset.email || "").slice(0, 80),
        website: String(preset.website || "").slice(0, 120)
      },
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) brands[idx] = record;
    else brands.push(record);
    save_(BRAND_KEY, brands);
    return record;
  }

  // --- Templates with version history ---
  function listTemplates() {
    return load_(TEMPLATE_KEY);
  }

  function saveTemplate(t) {
    if (!t || !t.name) throw new Error("VALIDATION_REQUIRED: name");
    if (!["TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG"].includes(t.documentType)) {
      throw new Error("DOCUMENT_TYPE_UNSUPPORTED");
    }
    var items = load_(TEMPLATE_KEY);
    var existing = items.find(function (x) { return x.name === t.name; });
    var version = existing ? (existing.version || 1) + 1 : 1;
    // Keep history of previous published version
    var history = existing && existing.history ? existing.history.slice() : [];
    if (existing && existing.status === "PUBLISHED") {
      history.push({ version: existing.version, snapshot: Object.assign({}, existing), archivedAt: new Date().toISOString() });
    }
    var record = {
      name: String(t.name).slice(0, 80),
      documentType: t.documentType,
      description: String(t.description || "").slice(0, 300),
      status: t.status || "DRAFT",
      includeIndex: t.includeIndex !== false,
      groupByFamily: !!t.groupByFamily,
      showProvenance: !!t.showProvenance,
      excludeUnpublished: !!t.excludeUnpublished,
      blockOnConflict: !!t.blockOnConflict,
      defaultBrandName: String(t.defaultBrandName || "Apple").slice(0, 80),
      version: version,
      history: history.slice(-5),
      updatedAt: new Date().toISOString()
    };
    if (existing) {
      var idx = items.findIndex(function (x) { return x.name === t.name; });
      items[idx] = record;
    } else {
      items.push(record);
    }
    save_(TEMPLATE_KEY, items);
    return record;
  }

  function publishTemplate(name) {
    var items = load_(TEMPLATE_KEY);
    var idx = items.findIndex(function (x) { return x.name === name; });
    if (idx < 0) throw new Error("TEMPLATE_NOT_FOUND");
    items[idx].status = "PUBLISHED";
    items[idx].publishedAt = new Date().toISOString();
    save_(TEMPLATE_KEY, items);
    return items[idx];
  }

  function copyTemplate(sourceName, newName) {
    var src = load_(TEMPLATE_KEY).find(function (x) { return x.name === sourceName; });
    if (!src) throw new Error("TEMPLATE_NOT_FOUND");
    return saveTemplate(Object.assign({}, src, { name: newName, status: "DRAFT" }));
  }

  // --- Domain-aware snapshot ---
  function resolveItem_(productId, variantId) {
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    if (!product) throw new Error("PRODUCT_NOT_FOUND: " + productId);
    var company = SheetsRepository.getBy("Product_Company", "Product_ID", productId) || {};
    var variant = variantId ? SheetsRepository.getBy("Variants", "Variant_ID", variantId) : null;
    if (variantId && (!variant || variant.Product_ID !== productId)) {
      throw new Error("VARIANT_NOT_FOUND_OR_PRODUCT_MISMATCH: " + variantId);
    }
    var variantCompany = variantId
      ? (SheetsRepository.getBy("Variant_Company", "Variant_ID", variantId) || {})
      : {};
    var family = company.Product_Family_ID
      ? SheetsRepository.getBy("Product_Families", "Product_Family_ID", company.Product_Family_ID)
      : null;
    var resolved = EffectiveSpecificationResolver.resolveEffectiveSpecifications(productId, variantId || null);
    var specs = (resolved.source_specifications || []).map(function (s) {
      return {
        key: s.attribute_key,
        label: s.attribute_key,
        value: s.effective_value,
        unit: s.unit || "",
        provenance: s.provenance,
        scope: s.scope
      };
    });
    (resolved.company_attributes || []).forEach(function (a) {
      if (a.effective_value != null) {
        specs.push({
          key: a.attribute_id,
          label: a.attribute_id,
          value: a.effective_value,
          unit: "",
          provenance: a.mode || "COMPANY",
          scope: "ATTRIBUTE"
        });
      }
    });
    var productNameEn = company.Product_Name_EN || productId;
    var productNameAr = company.Product_Name_AR || "";
    var variantNameEn = variantCompany.Model_Name_EN || "";
    var variantNameAr = variantCompany.Model_Name_AR || "";
    return {
      productId: productId,
      variantId: variantId || null,
      product_name: productNameEn,
      product_name_ar: productNameAr,
      name: variantNameEn || productNameEn,
      name_ar: variantNameAr || productNameAr,
      description: company.Company_Description || "",
      family: family ? (family.Family_Name_EN || family.Family_Name_AR || "") : "",
      model_number: variantNameEn || variantNameAr || "",
      specifications: specs,
      images: [],
      publishable: product.Lifecycle_Status === "ACTIVE",
      conflicts: resolved.conflicts || [],
      validation_errors: resolved.validation_errors || []
    };
  }

  function buildSnapshotFromDomain(config) {
    if (!config || !config.documentType) throw new Error("VALIDATION_REQUIRED: documentType");
    var productIds = config.productIds || [];
    if (!productIds.length) throw new Error("ISSUE_SCOPE_EMPTY");

    var brand = config.brandName ? getBrand(config.brandName) : getBrand("Apple");
    if (!brand) brand = BUILTIN_BRANDS[0];

    var template = config.templateName
      ? load_(TEMPLATE_KEY).find(function (t) { return t.name === config.templateName; })
      : null;

    var items = [];
    var allConflicts = [];
    productIds.forEach(function (pid) {
      var variantId = config.variantMap && config.variantMap[pid] ? config.variantMap[pid] : null;
      var item = resolveItem_(pid, variantId);
      items.push(item);
      if (item.conflicts && item.conflicts.length) allConflicts = allConflicts.concat(item.conflicts);
    });

    var isFinal = String(config.documentStatus || "ORIGINAL").toUpperCase() === "FINAL";
    // ADR-040 conflicts must never enter a FINAL snapshot. This is a safety invariant,
    // not an optional template preference or UI checkbox.
    if (isFinal && allConflicts.length) {
      throw new Error("CONFLICTS_BLOCK_FINAL_ISSUE: " + allConflicts.length);
    }

    var snap = {
      snapshot_version: "1",
      document_type: config.documentType,
      title: config.title || brand.companyName || "Industrial Catalog",
      subtitle: config.subtitle || "",
      items: items,
      brand: {
        palette: {
          primary: brand.primary,
          secondary: brand.secondary,
          accent: brand.accent,
          text: brand.text,
          header: brand.headerColor,
          tableHeader: brand.tableHeader,
          border: brand.border
        },
        fonts: { regular: brand.fontRegularPath || null, bold: brand.fontBoldPath || null },
        logoPreference: brand.logoPreference
      },
      paper: {
        page: {
          size: brand.paperSize || "A4",
          orientation: brand.orientation || "portrait",
          margins_mm: { top: 18, right: 12, bottom: 16, left: 12 }
        },
        background: { color: brand.background }
      },
      watermark: brand.watermarkText ? {
        text: brand.watermarkText,
        opacity: brand.watermarkOpacity,
        color: "#777777",
        rotation_degrees: -35
      } : {},
      export_profile: { output_class: "DIGITAL_PDF", minimum_dpi_warning: 150, minimum_dpi_block: 72 },
      contact: brand.contact || {},
      document_status: String(config.documentStatus || "ORIGINAL").toUpperCase(),
      block_on_conflict: true,
      revision: config.revision || "1.0",
      issue_date: config.issueDate || new Date().toISOString().slice(0, 10),
      show_provenance: template ? !!template.showProvenance : !!config.showProvenance,
      group_by_family: template ? !!template.groupByFamily : !!config.groupByFamily,
      include_index: template ? template.includeIndex !== false : config.includeIndex !== false,
      exclude_unpublished: template ? !!template.excludeUnpublished : !!config.excludeUnpublished,
      conflicts: allConflicts,
      generatedAt: new Date().toISOString(),
      brandName: brand.name,
      templateName: template ? template.name : null
    };

    // Store in simple issue library
    var issues = load_(ISSUE_KEY);
    issues.unshift({
      id: Utilities.getUuid(),
      documentType: snap.document_type,
      title: snap.title,
      brandName: snap.brandName,
      templateName: snap.templateName,
      itemCount: items.length,
      conflictCount: allConflicts.length,
      createdAt: snap.generatedAt
    });
    save_(ISSUE_KEY, issues.slice(0, 50));

    return snap;
  }

  function listIssues() {
    return load_(ISSUE_KEY);
  }

  return {
    listBrands: listBrands,
    getBrand: getBrand,
    saveBrand: saveBrand,
    listTemplates: listTemplates,
    saveTemplate: saveTemplate,
    publishTemplate: publishTemplate,
    copyTemplate: copyTemplate,
    buildSnapshotFromDomain: buildSnapshotFromDomain,
    listIssues: listIssues
  };
})();

function listBrandsForBrowser() { assertPrimaryUser_(); return DesignStudio.listBrands(); }
function saveBrandFromBrowser(p) { assertPrimaryUser_(); return DesignStudio.saveBrand(p); }
function listTemplatesForBrowser() { assertPrimaryUser_(); return DesignStudio.listTemplates(); }
function saveTemplateFromBrowser(t) { assertPrimaryUser_(); return DesignStudio.saveTemplate(t); }
function publishTemplateFromBrowser(name) { assertPrimaryUser_(); return DesignStudio.publishTemplate(name); }
function copyTemplateFromBrowser(src, dest) { assertPrimaryUser_(); return DesignStudio.copyTemplate(src, dest); }
function buildSnapshotFromDomainForBrowser(config) { assertPrimaryUser_(); return DesignStudio.buildSnapshotFromDomain(config); }
function listIssuesForBrowser() { assertPrimaryUser_(); return DesignStudio.listIssues(); }
