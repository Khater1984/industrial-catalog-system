function assertPrimaryUser_() {
  var props = PropertiesService.getScriptProperties();
  var expected = (props.getProperty("ALLOWED_USER_EMAIL") || "").trim().toLowerCase();
  var actual = (Session.getActiveUser().getEmail() || "").trim().toLowerCase();
  if (!expected) throw new Error("AUTH_NOT_CONFIGURED: ALLOWED_USER_EMAIL");
  if (!actual || actual !== expected) throw new Error("UNAUTHORIZED");
  return APP.ACTOR_ID;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
