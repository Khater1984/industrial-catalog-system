/** Product family hierarchy with cycle prevention. */
var ProductFamilyService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(v) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v)).map(function (b) { var n = b < 0 ? b + 256 : b, h = n.toString(16); return h.length === 1 ? "0" + h : h; }).join(""); }
  function stableId_(p, s) { return p + "_" + sha_(s).slice(0, 16); }
  function require_(c, code) { if (!c) throw new Error(code); }

  function create(nameEn, nameAr, parentId, actor) {
    if (parentId) {
      var parent = SheetsRepository.getBy("Product_Families", "Product_Family_ID", parentId);
      require_(parent, "PARENT_FAMILY_NOT_FOUND");
    }
    var id = stableId_("fam", nameEn + "|" + (parentId || "root"));
    SheetsRepository.append("Product_Families", {
      Product_Family_ID: id,
      Family_Name_EN: nameEn,
      Family_Name_AR: nameAr || "",
      Parent_Family_ID: parentId || "",
      Description: "",
      Sort_Order: 0,
      Status: "ACTIVE",
      Created_At: now_(),
      Updated_At: now_()
    });
    return { familyId: id };
  }

  function wouldCycle_(familyId, newParentId) {
    var current = newParentId;
    var seen = {};
    while (current) {
      if (current === familyId || seen[current]) return true;
      seen[current] = true;
      var f = SheetsRepository.getBy("Product_Families", "Product_Family_ID", current);
      current = f ? f.Parent_Family_ID : null;
    }
    return false;
  }

  function updateParent(familyId, newParentId, actor) {
    require_(!wouldCycle_(familyId, newParentId), "FAMILY_CYCLE_DETECTED");
    SheetsRepository.updateBy("Product_Families", "Product_Family_ID", familyId, { Parent_Family_ID: newParentId || "", Updated_At: now_() });
    return { ok: true };
  }

  return { create: create, updateParent: updateParent };
})();
