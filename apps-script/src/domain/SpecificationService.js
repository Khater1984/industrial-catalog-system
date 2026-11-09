/** Specification change lifecycle.
 * Approval acquires LockService, re-reads state, validates transition, allocates Sequence_No.
 */
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

  function currentStateForKey_(logicalKey) {
    var approved = (SheetsRepository.listAll("Specification_Changes") || [])
      .filter(function (c) { return c.Logical_Specification_Key === logicalKey && c.Change_Status === "APPROVED"; })
      .sort(function (a, b) { return Number(a.Sequence_No) - Number(b.Sequence_No); });
    var state = logicalKey.indexOf("SRC:") === 0 ? "ACTIVE" : "ABSENT";
    approved.forEach(function (c) {
      if (c.Operation === "ADD" && state === "ABSENT") state = "ACTIVE";
      else if (c.Operation === "UPDATE" && state === "ACTIVE") state = "ACTIVE";
      else if (c.Operation === "DELETE" && state === "ACTIVE") state = "DELETED";
      else state = "QUARANTINED";
    });
    return state;
  }

  function appendDraft(options) {
    require_(options && options.actor && options.operation, "SPEC_CHANGE_INVALID");
    require_(["ADD", "UPDATE", "DELETE"].indexOf(options.operation) >= 0, "INVALID_OPERATION");
    var changeId = stableId_("schg", options.idempotencyKey || Utilities.getUuid());
    var existing = SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId);
    if (existing) {
      // Idempotent only if payload matches; otherwise reject
      if (existing.Operation !== options.operation || existing.Product_ID !== options.productId) {
        throw new Error("IDEMPOTENCY_PAYLOAD_MISMATCH");
      }
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
      Value_JSON: options.operation === "DELETE" ? "" : (options.valueJson || ""),
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
    if (!lock.tryLock(30000)) throw new Error("LOCK_TIMEOUT");
    try {
      var change = SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId);
      require_(change && change.Change_Status === "DRAFT", "CHANGE_NOT_DRAFT");
      var state = currentStateForKey_(change.Logical_Specification_Key);
      var op = change.Operation;
      if (state === "QUARANTINED") throw new Error("LOGICAL_KEY_QUARANTINED");
      if (op === "ADD" && state !== "ABSENT") throw new Error("INVALID_TRANSITION");
      if ((op === "UPDATE" || op === "DELETE") && state !== "ACTIVE") throw new Error("INVALID_TRANSITION");
      if (op !== "DELETE" && !change.Value_JSON) throw new Error("VALUE_REQUIRED");

      var existing = (SheetsRepository.listAll("Specification_Changes") || [])
        .filter(function (c) { return c.Logical_Specification_Key === change.Logical_Specification_Key && c.Change_Status === "APPROVED"; });
      var maxSeq = existing.reduce(function (m, c) { return Math.max(m, Number(c.Sequence_No) || 0); }, 0);
      var nextSeq = maxSeq + 1;
      var payloadHash = sha_(JSON.stringify({
        id: change.Specification_Change_ID,
        op: change.Operation,
        key: change.Logical_Specification_Key,
        value: change.Value_JSON
      }));
      SheetsRepository.updateBy("Specification_Changes", "Specification_Change_ID", changeId, {
        Change_Status: "APPROVED",
        Sequence_No: nextSeq,
        Approved_At: now_(),
        Approved_By: actor,
        Approval_Payload_SHA256: payloadHash
      });
      SheetsRepository.append("Audit_Log", {
        Audit_ID: stableId_("aud", "APPROVE|" + changeId + "|" + nextSeq),
        Event_Idempotency_Key: "APPROVE|" + changeId,
        Payload_SHA256: payloadHash,
        Event_At: now_(),
        Actor_ID: actor,
        Action: "APPROVE",
        Entity_Type: "SPECIFICATION_CHANGE",
        Entity_ID: changeId,
        Reason: "Change approved with sequence " + nextSeq
      });
      return { ok: true, sequence: nextSeq, logicalKey: change.Logical_Specification_Key };
    } finally {
      lock.releaseLock();
    }
  }

  function reject(changeId, actor) {
    var change = SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId);
    require_(change && change.Change_Status === "DRAFT", "CHANGE_NOT_DRAFT");
    SheetsRepository.updateBy("Specification_Changes", "Specification_Change_ID", changeId, { Change_Status: "REJECTED" });
    SheetsRepository.append("Audit_Log", {
      Audit_ID: stableId_("aud", "REJECT|" + changeId),
      Event_Idempotency_Key: "REJECT|" + changeId,
      Payload_SHA256: sha_(changeId),
      Event_At: now_(),
      Actor_ID: actor,
      Action: "REJECT",
      Entity_Type: "SPECIFICATION_CHANGE",
      Entity_ID: changeId,
      Reason: "Change rejected"
    });
    return { ok: true };
  }

  return { appendDraft: appendDraft, approve: approve, reject: reject };
})();
