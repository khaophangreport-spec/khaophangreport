function Validation_validateEnvelope_(payload) {
  const fields = {};

  if (!Utils_isPlainObject_(payload)) {
    throw ApiError_("VALIDATION_ERROR", "รูปแบบคำขอไม่ถูกต้อง", {
      request: "Request ต้องเป็น Object"
    });
  }

  if (!Validation_isNonEmptyString_(payload.action)) {
    fields.action = "กรุณาระบุ Action";
  }

  if (payload.requestId !== undefined && payload.requestId !== "" && String(payload.requestId).length > 120) {
    fields.requestId = "Request ID ยาวเกินกำหนด";
  }

  if (payload.data !== undefined && !Utils_isPlainObject_(payload.data)) {
    fields.data = "Data ต้องเป็น Object";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูล", fields);
  }
}

function Validation_isNonEmptyString_(value) {
  return typeof value === "string" && Utils_normalizeString_(value).length > 0;
}

function Validation_required_(value, fieldName, fields) {
  if (!Validation_isNonEmptyString_(value)) {
    fields[fieldName] = "กรุณากรอกข้อมูล";
  }
}

function Validation_maxLength_(value, maxLength, fieldName, fields) {
  if (String(value || "").length > maxLength) {
    fields[fieldName] = "กรุณากรอกไม่เกิน " + maxLength + " ตัวอักษร";
  }
}

function Validation_latLng_(latitude, longitude, fields) {
  const hasLatitude = latitude !== null && latitude !== undefined && latitude !== "";
  const hasLongitude = longitude !== null && longitude !== undefined && longitude !== "";

  if (!hasLatitude && !hasLongitude) {
    return;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!hasLatitude || !hasLongitude || !isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    fields.location = "กรุณาระบุพิกัดให้ถูกต้อง";
  }
}

function Validation_requiredObject_(value, fieldName, fields) {
  if (!Utils_isPlainObject_(value)) {
    fields[fieldName] = "รูปแบบข้อมูลไม่ถูกต้อง";
  }
}

function Validation_positiveInteger_(value, fieldName, fields) {
  const parsedValue = parseInt(value, 10);

  if (!isFinite(parsedValue) || parsedValue < 1) {
    fields[fieldName] = "กรุณาระบุตัวเลขจำนวนเต็มที่ถูกต้อง";
  }
}

function Validation_allowedValue_(value, allowedValues, fieldName, fields) {
  if (allowedValues.indexOf(value) === -1) {
    fields[fieldName] = "ค่าที่ระบุไม่อยู่ในรายการที่อนุญาต";
  }
}
