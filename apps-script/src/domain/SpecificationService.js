/** Specification change lifecycle. Approval allocates Sequence_No under lock. */
var SpecificationService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(seed).slice(0, 16); }
  function text_(v, limit) { var t = v == null ? "" : String(v).trim(); return t.length > limit ? t.slice(0, limit) : t; }
  function require_(c, code) { if (!c) throw new Error(code); }

  function appendDraft(options) {
    require_(options && options.actor && options.operation, "SPEC_CHANGE_INVALID");
    var changeId = stableId_("schg", options.idempotencyKey || Utilities.getUuid());
    if (SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId)) {
      return { changeId: changeId, reused: true };
    }
    var logical = options.targetSpecificationId ? ("SRC:" + options.targetSpecificationId) : ("ADD:" + changeId);
    SheetsRepository.append("Specification_Changes", {
      Specification_Change_ID: changeId,
      Logical_Specification_Key: logical,
      Sequence_No: "",
      Operation: options.operation,
      Target_Specification_ID: options.targetSpecificationId || "",
      Product_ID: options.productId,
      Variant_ID: options.variantId || "",
      Attribute_Key: text_(options.attributeKey, 160),
      Value_JSON: options.valueJson || "",
      Unit_Code: text_(options.unitCode, 40),
      Change_Status: "DRAFT",
      Reason: text_(options.reason, 1000),
      Created_At: now_(),
      Created_By: options.actor
    });
    return { changeId: changeId, reused: false };
  }

  function approve(changeId, actor) {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var change = SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId);
      require_(change && change.Change_Status === "DRAFT", "CHANGE_NOT_DRAFT");
      var existing = (SheetsRepository.listAll("Specification_Changes") || [])
        .filter(function (c) { return c.Logical_Specification_Key === change.Logical_Specification_Key && c.Change_Status === "APPROVED"; });
      var maxSeq = existing.reduce(function (m, c) { return Math.max(m, Number(c.Sequence_No) || 0); }, 0);
      var nextSeq = maxSeq + 1;
      var payloadHash = sha_(JSON.stringify(change));
      SheetsRepository.updateBy("Specification_Changes", "Specification_Change_ID", changeId, {
        Change_Status: "APPROVED",
        Sequence_No: nextSeq,
        Approved_At: now_(),
        Approved_By: actor,
        Approval_Payload_SHA256: payloadHash
      });
      SheetsRepository.append("Audit_Log", {
        Audit_ID: stableId_("aud", "APPROVE|" + changeId),
        Event_Idempotency_Key: "APPROVE|" + changeId,
        Payload_SHA256: payloadHash,
        Event_At: now_(),
        Actor_ID: actor,
        Action: "APPROVE",
        Entity_Type: "SPECIFICATION_CHANGE",
        Entity_ID: changeId,
        Reason: "Change approved"
      });
      return { ok: true, sequence: nextSeq };
    } finally {
      lock.releaseLock();
    }
  }

  function reject(changeId, actor) {
    var change = SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId);
    require_(change && change.Change_Status === "DRAFT", "CHANGE_NOT_DRAFT");
    SheetsRepository.updateBy("Specification_Changes", "Specification_Change_ID", changeId, { Change_Status: "REJECTED" });
    return { ok: true };
  }

  return { appendDraft: appendDraft, approve: approve, reject: reject };
})();
