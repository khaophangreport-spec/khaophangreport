function Utils_createUuid_() {
  return Utilities.getUuid();
}

function Utils_nowIso_() {
  return new Date().toISOString();
}

function Utils_normalizeString_(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().replace(/\s+/g, " ");
}

function Utils_safeJsonParse_(value) {
  try {
    return {
      ok: true,
      data: JSON.parse(value || "{}")
    };
  } catch (error) {
    return {
      ok: false,
      error: "INVALID_JSON"
    };
  }
}

function Utils_isPlainObject_(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function Utils_createRequestId_() {
  return "REQ-" + Utils_createUuid_().toUpperCase();
}
