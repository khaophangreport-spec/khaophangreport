var SENSITIVE_LOG_KEYS_ = Object.freeze({
  password: true,
  sessionToken: true,
  token: true,
  rawToken: true,
  tokenHash: true,
  passwordHash: true,
  passwordSalt: true,
  salt: true,
  base64: true,
  appSecret: true,
  sessionSecret: true,
  adminSetupKey: true
});

function sanitizeString_(value) {
  return normalizeString_(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeObject_(value) {
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return sanitizeObject_(item);
    });
  }

  if (!isPlainObject_(value)) {
    return typeof value === 'string' ? sanitizeString_(value) : value;
  }

  var result = {};
  Object.keys(value).forEach(function (key) {
    result[key] = sanitizeObject_(value[key]);
  });

  return result;
}

function hashValue_(value, salt) {
  var input = String(salt || '') + String(value || '');
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);

  return bytes.map(function (byte) {
    var normalizedByte = byte < 0 ? byte + 256 : byte;
    return ('0' + normalizedByte.toString(16)).slice(-2);
  }).join('');
}

function redactForLog_(value) {
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return redactForLog_(item);
    });
  }

  if (!isPlainObject_(value)) {
    return value;
  }

  var result = {};
  Object.keys(value).forEach(function (key) {
    if (SENSITIVE_LOG_KEYS_[key]) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactForLog_(value[key]);
    }
  });

  return result;
}

function safeLog_(eventName, details) {
  var payload = {
    event: eventName || 'app.log',
    timestamp: nowIso_(),
    details: redactForLog_(details || {})
  };

  console.log(JSON.stringify(payload));
}
