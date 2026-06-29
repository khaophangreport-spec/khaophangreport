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

function Utils_toBoolean_(value) {
  if (value === true) {
    return true;
  }

  if (value === false || value === null || value === undefined || value === "") {
    return false;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalizedValue = Utils_normalizeString_(value).toLowerCase();

  return normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes" ||
    normalizedValue === "active";
}

function Utils_findIndex_(items, predicate) {
  for (let index = 0; index < items.length; index += 1) {
    if (predicate(items[index], index)) {
      return index;
    }
  }

  return -1;
}

function Utils_clampInteger_(value, fallbackValue, minValue, maxValue) {
  const parsedValue = parseInt(value, 10);
  const safeValue = isFinite(parsedValue) ? parsedValue : fallbackValue;

  return Math.min(Math.max(safeValue, minValue), maxValue);
}

function Utils_getYear_(value) {
  const date = value ? new Date(value) : new Date();

  if (isNaN(date.getTime())) {
    return String(new Date().getFullYear());
  }

  return String(date.getFullYear());
}

function Utils_sanitizeFileName_(value) {
  const normalizedValue = Utils_normalizeString_(value);
  const fallbackName = "file";
  const sanitizedName = normalizedValue
    .replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");

  return sanitizedName ? sanitizedName.slice(0, 120) : fallbackName;
}

function Utils_getFileExtensionFromMime_(mimeType) {
  const normalizedMimeType = Utils_normalizeString_(mimeType).toLowerCase();
  const extensionMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "text/csv": "csv",
    "application/pdf": "pdf"
  };

  return extensionMap[normalizedMimeType] || "bin";
}
