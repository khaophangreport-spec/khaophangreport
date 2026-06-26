function createJsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function createMeta_(requestId) {
  return {
    requestId: requestId || '',
    timestamp: nowIso_()
  };
}

function createSuccessPayload_(data, message, requestId) {
  return {
    ok: true,
    data: data || {},
    message: message || 'ดำเนินการสำเร็จ',
    meta: createMeta_(requestId)
  };
}

function createErrorPayload_(code, message, requestId, fields, extra) {
  var error = {
    code: code || 'INTERNAL_ERROR',
    message: message || 'ระบบขัดข้อง กรุณาลองใหม่ภายหลัง'
  };

  if (fields && Object.keys(fields).length > 0) {
    error.fields = fields;
  }

  if (extra && extra.retryAfterSeconds) {
    error.retryAfterSeconds = extra.retryAfterSeconds;
  }

  return {
    ok: false,
    error: error,
    meta: createMeta_(requestId)
  };
}

function createSuccessResponse_(data, message, requestId) {
  return createJsonResponse_(createSuccessPayload_(data, message, requestId));
}

function createErrorResponse_(code, message, requestId, fields, extra) {
  return createJsonResponse_(createErrorPayload_(code, message, requestId, fields, extra));
}
