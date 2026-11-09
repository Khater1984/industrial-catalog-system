/** Product family hierarchy.
 * Cycle prevention, dependency-safe archive, no physical deletion.
 */
var ProductFamilyService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(v) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v)).map(function (b) { var n = b < 0 ? b + 256 : b, h = n.toString(16); return h.length === 1 ? "0" + h : h; }).join(""); }
  function stableId_(p, s) { return p + "_" + sha_(s).slice(0, 16); }
  function require_(c, code) { if (!c) throw new Error(code); }
  function text_(v, limit) { var t = v == null ? "" : String(v).trim(); return t.length > limit ? t.slice(0, limit) : t; }

  function create(nameEn, nameAr, parentId, actor) {
    require_(nameEn && actor, "FAMILY_ARGUMENTS_INVALID");
    if (parentId) {
      var parent = SheetsRepository.getBy("Product_Families", "Product_Family_ID", parentId);
      require_(parent && parent.Status === "ACTIVE", "PARENT_FAMILY_NOT_ACTIVE");
    }
    var id = stableId_("fam", nameEn + "|" + (parentId || "root") + "|" + (actor || ""));
    if (SheetsRepository.getBy("Product_Families", "Product_Family_ID", id)) {
      return { familyId: id, reused: true };
    }
    SheetsRepository.append("Product_Families", {
      Product_Family_ID: id,
      Family_Name_EN: text_(nameEn, 180),
      Family_Name_AR: text_(nameAr, 180),
      Parent_Family_ID: parentId || "",
      Description: "",
      Sort_Order: 0,
      Status: "ACTIVE",
      Created_At: now_(),
      Updated_At: now_()
    });
    return { familyId: id, reused: false };
  }

  function wouldCycle_(familyId, newParentId) {
    if (!newParentId) return false;
    var current = newParentId;
    var seen = {};
    var depth = 0;
    while (current && depth < 50) {
      if (current === familyId || seen[current]) return true;
      seen[current] = true;
      var f = SheetsRepository.getBy("Product_Families", "Product_Family_ID", current);
      current = f ? f.Parent_Family_ID : null;
      depth++;
    }
    return false;
  }

  function updateParent(familyId, newParentId, actor) {
    require_(SheetsRepository.getBy("Product_Families", "Product_Family_ID", familyId), "FAMILY_NOT_FOUND");
    require_(!wouldCycle_(familyId, newParentId), "FAMILY_CYCLE_DETECTED");
    if (newParentId) {
      var parent = SheetsRepository.getBy("Product_Families", "Product_Family_ID", newParentId);
      require_(parent && parent.Status === "ACTIVE", "PARENT_FAMILY_NOT_ACTIVE");
    }
    SheetsRepository.updateBy("Product_Families", "Product_Family_ID", familyId, {
      Parent_Family_ID: newParentId || "",
      Updated_At: now_()
    });
    return { ok: true };
  }

  function archive(familyId, actor) {
    var family = SheetsRepository.getBy("Product_Families", "Product_Family_ID", familyId);
    require_(family, "FAMILY_NOT_FOUND");
    var activeChildren = (SheetsRepository.listAll("Product_Families") || []).filter(function (f) {
      return f.Parent_Family_ID === familyId && f.Status === "ACTIVE";
    });
    require_(activeChildren.length === 0, "FAMILY_HAS_ACTIVE_CHILDREN");
    var activeProducts = (SheetsRepository.listAll("Product_Company") || []).filter(function (pc) {
      return pc.Product_Family_ID === familyId;
    }).filter(function (pc) {
      var p = SheetsRepository.getBy("Products", "Product_ID", pc.Product_ID);
      return p && p.Lifecycle_Status === "ACTIVE";
    });
    require_(activeProducts.length === 0, "FAMILY_HAS_ACTIVE_PRODUCTS");
    SheetsRepository.updateBy("Product_Families", "Product_Family_ID", familyId, { Status: "ARCHIVED", Updated_At: now_() });
    return { ok: true };
  }

  function reactivate(familyId, actor) {
    require_(SheetsRepository.getBy("Product_Families", "Product_Family_ID", familyId), "FAMILY_NOT_FOUND");
    SheetsRepository.updateBy("Product_Families", "Product_Family_ID", familyId, { Status: "ACTIVE", Updated_At: now_() });
    return { ok: true };
  }

  return { create: create, updateParent: updateParent, archive: archive, reactivate: reactivate };
})();
