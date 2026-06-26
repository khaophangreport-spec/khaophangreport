function createUuid_() {
  return Utilities.getUuid();
}

function nowIso_() {
  return new Date().toISOString();
}

function normalizeString_(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeUpperCode_(value) {
  return normalizeString_(value).replace(/\s+/g, '').toUpperCase();
}

function safeJsonParse_(text, fallbackValue) {
  if (text === null || text === undefined || text === '') {
    return fallbackValue;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return fallbackValue;
  }
}

function isPlainObject_(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function createRequestId_() {
  return 'REQ-' + createUuid_();
}

function arrayToMap_(items, keyName) {
  var map = {};

  items.forEach(function (item) {
    map[item[keyName]] = item;
  });

  return map;
}

function arraysEqual_(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  for (var index = 0; index < left.length; index += 1) {
    if (String(left[index]) !== String(right[index])) {
      return false;
    }
  }

  return true;
}

function indexOfHeader_(headers, columnName) {
  return headers.indexOf(columnName);
}

function createAppError_(code, message, details) {
  var error = new Error(message || 'เกิดข้อผิดพลาด');
  error.code = code || 'INTERNAL_ERROR';
  error.details = details || {};
  return error;
}

function assertCondition_(condition, code, message, details) {
  if (!condition) {
    throw createAppError_(code, message, details);
  }
}

function getFileExtension_(fileName) {
  var safeName = normalizeString_(fileName).toLowerCase();
  var match = safeName.match(/\.([a-z0-9]+)$/);

  return match ? match[1] : '';
}

function getExtensionFromMimeType_(mimeType) {
  var map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'text/csv': 'csv',
    'application/pdf': 'pdf'
  };

  return map[mimeType] || '';
}

function sanitizeFileNamePart_(value) {
  return normalizeString_(value)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function compactObject_(value) {
  var result = {};

  Object.keys(value || {}).forEach(function (key) {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  });

  return result;
}
