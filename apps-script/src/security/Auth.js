/**
 * Defense in depth: the deployed web app must remain restricted to the owner.
 * With executeAs=USER_DEPLOYING, the effective user is the deploying account.
 * Fail closed if Apps Script does not expose that identity.
 */
function assertPrimaryUser_() {
  var props = PropertiesService.getScriptProperties();
  var expected = (props.getProperty("ALLOWED_USER_EMAIL") || "").trim().toLowerCase();
  var actual = (Session.getEffectiveUser().getEmail() || "").trim().toLowerCase();
  if (!expected) throw new Error("AUTH_NOT_CONFIGURED");
  if (!actual) throw new Error("AUTH_IDENTITY_UNAVAILABLE");
  if (actual !== expected) throw new Error("UNAUTHORIZED");
  return APP.ACTOR_ID;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
