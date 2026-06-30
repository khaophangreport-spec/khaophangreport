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
  Response_logUnhandledBackendError_(error, meta);

  Security_safeLog_("API_EXCEPTION", {
    requestId: meta && meta.requestId ? meta.requestId : "",
    action: meta && meta.action ? meta.action : "",
    handler: meta && meta.handler ? meta.handler : "",
    lastStep: meta && meta.lastStep ? meta.lastStep : "",
    code: error && error.code ? error.code : "INTERNAL_ERROR",
    name: error && error.name ? error.name : "Error",
    message: error && error.message ? error.message : String(error),
    stack: error && error.stack ? error.stack : ""
  });

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

function Response_logUnhandledBackendError_(error, meta) {
  const safeMeta = Utils_isPlainObject_(meta) ? meta : {};

  if (safeMeta.unhandledBackendErrorLogged === true) {
    return;
  }

  safeMeta.unhandledBackendErrorLogged = true;

  const payload = {
    type: "UNHANDLED_BACKEND_ERROR",
    requestId: safeMeta.requestId || "",
    action: safeMeta.action || "",
    route: safeMeta.action || "",
    handler: safeMeta.handler || "",
    lastStep: safeMeta.lastStep || "",
    errorName: error && error.name ? error.name : "Error",
    errorMessage: error && error.message ? error.message : String(error),
    stack: error && error.stack ? error.stack : ""
  };

  Response_writeUnhandledBackendErrorLog_(Response_redactLogPayload_(payload));
}

function Response_writeUnhandledBackendErrorLog_(payload) {
  console.error(JSON.stringify(payload));
}

function Response_redactLogPayload_(value) {
  if (Array.isArray(value)) {
    return value.map(Response_redactLogPayload_);
  }

  if (!Utils_isPlainObject_(value)) {
    return Response_redactLogValue_(value);
  }

  const output = {};

  Object.keys(value).forEach(function (key) {
    if (/token|session|password|secret|email|phone|body|payload|data/i.test(String(key || ""))) {
      output[key] = SECURITY_REDACTED_TEXT_;
      return;
    }

    output[key] = Response_redactLogPayload_(value[key]);
  });

  return output;
}

function Response_redactLogValue_(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, SECURITY_REDACTED_TEXT_)
    .replace(/0\d{8,10}/g, SECURITY_REDACTED_TEXT_);
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
