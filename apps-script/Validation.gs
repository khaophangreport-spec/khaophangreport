function validateRequired_(value) {
  return value !== null && value !== undefined && normalizeString_(value) !== '';
}

function validatePlainObject_(value) {
  return isPlainObject_(value);
}

function validateMaxLength_(value, maxLength) {
  return normalizeString_(value).length <= maxLength;
}

function createValidationError_(field, message) {
  var fields = {};
  fields[field] = message;
  return fields;
}

function mergeFieldErrors_(target, source) {
  var result = target || {};
  var keys = Object.keys(source || {});

  keys.forEach(function (key) {
    result[key] = source[key];
  });

  return result;
}

function validateRequestEnvelope_(request) {
  var fields = {};

  if (!validatePlainObject_(request)) {
    return createValidationError_('data', 'รูปแบบคำขอไม่ถูกต้อง');
  }

  if (!validateRequired_(request.action)) {
    fields.action = 'กรุณาระบุ Action';
  } else if (!validateMaxLength_(request.action, 80)) {
    fields.action = 'Action ยาวเกินไป';
  }

  if (request.requestId && !validateMaxLength_(request.requestId, 120)) {
    fields.requestId = 'Request ID ยาวเกินไป';
  }

  if (request.sessionToken && !validateMaxLength_(request.sessionToken, 500)) {
    fields.sessionToken = 'Session Token ยาวเกินไป';
  }

  if (request.data !== undefined && !validatePlainObject_(request.data)) {
    fields.data = 'ข้อมูลต้องเป็น Object';
  }

  return fields;
}

function validateSheetName_(sheetName) {
  return /^[a-z_][a-z0-9_]*$/.test(normalizeString_(sheetName));
}

function validateColumnName_(columnName) {
  return /^[a-z_][a-z0-9_]*$/.test(normalizeString_(columnName));
}

function validateAllowedColumn_(columnName, headers) {
  return validateColumnName_(columnName) && indexOfHeader_(headers, columnName) >= 0;
}

function normalizePageOptions_(options) {
  var rawPage = Number(options && options.page);
  var rawPageSize = Number(options && options.pageSize);
  var page = rawPage > 0 ? Math.floor(rawPage) : 1;
  var pageSize = rawPageSize > 0 ? Math.floor(rawPageSize) : 20;

  return {
    page: page,
    pageSize: Math.min(pageSize, 100)
  };
}

function validateVersionValue_(value) {
  return value === '' || value === undefined || value === null || Number(value) >= 0;
}

function validateMimeType_(mimeType, allowedTypes) {
  return allowedTypes.indexOf(normalizeString_(mimeType)) >= 0;
}
