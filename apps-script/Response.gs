function ApiError_(code, message, fields) {
  const error = new Error(message || "ระบบขัดข้อง");
  error.name = "ApiError";
  error.code = code || "INTERNAL_ERROR";
  error.fields = fields || {};
  return error;
}

function Response_success_(data, message, meta) {
  return Response_json_({
    ok: true,
    data: Utils_isPlainObject_(data) ? data : {},
    message: message || "ดำเนินการสำเร็จ",
    meta: Response_createMeta_(meta)
  });
}

function Response_error_(code, message, fields, meta) {
  return Response_json_({
    ok: false,
    error: {
      code: code || "INTERNAL_ERROR",
      message: message || "ระบบขัดข้อง",
      fields: fields || {}
    },
    meta: Response_createMeta_(meta)
  });
}

function Response_fromException_(error, meta) {
  Security_safeLog_("API_ERROR", {
    requestId: meta && meta.requestId ? meta.requestId : "",
    action: meta && meta.action ? meta.action : "",
    code: error && error.code ? error.code : "INTERNAL_ERROR"
  });

  if (error && error.name === "ApiError") {
    return Response_error_(error.code, error.message, error.fields, meta);
  }

  return Response_error_("INTERNAL_ERROR", "ระบบขัดข้อง กรุณาลองใหม่ภายหลัง", {}, meta);
}

function Response_createMeta_(meta) {
  const safeMeta = Utils_isPlainObject_(meta) ? meta : {};

  return {
    requestId: safeMeta.requestId || "",
    timestamp: safeMeta.timestamp || Utils_nowIso_()
  };
}

function Response_json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
