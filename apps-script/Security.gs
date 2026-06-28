const SECURITY_REDACTED_TEXT_ = "[REDACTED]";

function Security_sanitizeText_(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function Security_hashSha256_(value, salt) {
  const text = String(salt || "") + String(value || "");
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);

  return Security_bytesToHex_(bytes);
}

function Security_hashBytesSha256_(bytes) {
  return Security_bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes || []));
}

function Security_generateSalt_() {
  return Security_hashSha256_([
    Utilities.getUuid(),
    Utilities.getUuid(),
    String(new Date().getTime())
  ].join("|"), "salt");
}

function Security_generateSessionToken_() {
  return [
    Utilities.getUuid(),
    Utilities.getUuid(),
    Utilities.getUuid(),
    Security_generateSalt_()
  ].join(".");
}

function Security_hashPassword_(password, salt) {
  if (!salt) {
    throw ApiError_("INTERNAL_ERROR", "ไม่พบ Salt สำหรับรหัสผ่าน");
  }

  return Security_hashWithSecret_(String(salt) + "|" + String(password || ""), CONFIG_KEYS_.APP_SECRET);
}

function Security_hashSessionToken_(sessionToken) {
  return Security_hashWithSecret_(String(sessionToken || ""), CONFIG_KEYS_.SESSION_SECRET);
}

function Security_constantTimeEquals_(left, right) {
  const leftText = String(left || "");
  const rightText = String(right || "");
  let diff = leftText.length ^ rightText.length;
  const maxLength = Math.max(leftText.length, rightText.length);

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (leftText.charCodeAt(index) || 0) ^ (rightText.charCodeAt(index) || 0);
  }

  return diff === 0;
}

function Security_bytesToHex_(bytes) {
  return bytes.map(function (byte) {
    const normalized = byte < 0 ? byte + 256 : byte;
    return ("0" + normalized.toString(16)).slice(-2);
  }).join("");
}

function Security_sanitizeUserText_(value, maxLength) {
  const normalizedValue = Utils_normalizeString_(value)
    .replace(/[\u0000-\u001F\u007F]/g, "");
  const limitedValue = maxLength ? normalizedValue.slice(0, maxLength) : normalizedValue;

  return Security_sanitizeSheetText_(limitedValue);
}

function Security_sanitizeSheetText_(value) {
  const text = value === null || value === undefined ? "" : String(value);

  return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
}

function Security_hashWithSecret_(value, secretPropertyKey) {
  const secret = Config_getProperty_(secretPropertyKey, "");
  if (!secret) {
    throw ApiError_("INTERNAL_ERROR", "ยังไม่ได้ตั้งค่าความปลอดภัยของระบบ");
  }

  return Security_hashSha256_(value, secret);
}

function Security_safeLog_(eventName, details) {
  const safeDetails = Security_redactSensitive_(details || {});
  console.log(JSON.stringify({
    event: eventName,
    timestamp: Utils_nowIso_(),
    details: safeDetails
  }));
}

function Security_redactSensitive_(value) {
  if (Array.isArray(value)) {
    return value.map(Security_redactSensitive_);
  }

  if (!Utils_isPlainObject_(value)) {
    return Security_shouldRedactValue_(value) ? SECURITY_REDACTED_TEXT_ : value;
  }

  const output = {};
  Object.keys(value).forEach(function (key) {
    if (Security_isSensitiveKey_(key)) {
      output[key] = SECURITY_REDACTED_TEXT_;
      return;
    }

    output[key] = Security_redactSensitive_(value[key]);
  });

  return output;
}

function Security_isSensitiveKey_(key) {
  return /password|token|secret|salt|base64/i.test(String(key || ""));
}

function Security_shouldRedactValue_(value) {
  return typeof value === "string" && /^[A-Za-z0-9+/]{80,}={0,2}$/.test(value);
}
