(function () {
  "use strict";

  function toText(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function createResult(isValid, message) {
    return {
      isValid: isValid,
      message: isValid ? "" : message
    };
  }

  function required(value, message) {
    return createResult(toText(value).trim().length > 0, message || "กรุณากรอกข้อมูลให้ครบถ้วน");
  }

  function phone(value, message) {
    const text = toText(value).trim();
    if (!text) {
      return createResult(true, "");
    }

    const normalizedPhone = text.replace(/[\s-]/g, "");
    return createResult(/^0[0-9]{8,9}$/.test(normalizedPhone), message || "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
  }

  function email(value, message) {
    const text = toText(value).trim();
    if (!text) {
      return createResult(true, "");
    }

    return createResult(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text), message || "กรุณากรอกอีเมลให้ถูกต้อง");
  }

  function date(value, message) {
    const text = toText(value).trim();
    if (!text) {
      return createResult(true, "");
    }

    const parsedDate = new Date(text);
    return createResult(!Number.isNaN(parsedDate.getTime()), message || "กรุณากรอกวันที่ให้ถูกต้อง");
  }

  function latLng(latitude, longitude, message) {
    const latText = toText(latitude).trim();
    const lngText = toText(longitude).trim();

    if (!latText && !lngText) {
      return createResult(true, "");
    }

    if (!latText || !lngText) {
      return createResult(false, message || "กรุณากรอกพิกัดละติจูดและลองจิจูดให้ครบ");
    }

    const lat = Number(latText);
    const lng = Number(lngText);
    const isValid = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

    return createResult(isValid, message || "กรุณากรอกพิกัดให้ถูกต้อง");
  }

  function maxLength(value, max, message) {
    const limit = Number(max);
    if (!Number.isFinite(limit) || limit < 0) {
      return createResult(false, "กำหนดจำนวนตัวอักษรสูงสุดไม่ถูกต้อง");
    }

    return createResult(toText(value).length <= limit, message || "กรุณากรอกไม่เกิน " + limit + " ตัวอักษร");
  }

  function minLength(value, min, message) {
    const limit = Number(min);
    if (!Number.isFinite(limit) || limit < 0) {
      return createResult(false, "กำหนดจำนวนตัวอักษรขั้นต่ำไม่ถูกต้อง");
    }

    return createResult(toText(value).trim().length >= limit, message || "กรุณากรอกอย่างน้อย " + limit + " ตัวอักษร");
  }

  function notFutureDate(value, message) {
    const text = toText(value).trim();
    if (!text) {
      return createResult(true, "");
    }

    const dateResult = date(text, message || "กรุณากรอกวันที่ให้ถูกต้อง");
    if (!dateResult.isValid) {
      return dateResult;
    }

    const selectedDate = new Date(text + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return createResult(selectedDate.getTime() <= today.getTime(), message || "วันที่ต้องไม่เป็นวันในอนาคต");
  }

  function allowedValue(value, allowedValues, message) {
    const values = Array.isArray(allowedValues) ? allowedValues : [];

    return createResult(values.indexOf(value) !== -1, message || "ค่าที่เลือกไม่ถูกต้อง");
  }

  window.KPR_VALIDATION = Object.freeze({
    required: required,
    phone: phone,
    email: email,
    date: date,
    latLng: latLng,
    maxLength: maxLength,
    minLength: minLength,
    notFutureDate: notFutureDate,
    allowedValue: allowedValue,
    isRequired: function (value) {
      return required(value).isValid;
    }
  });

  // Example: window.KPR_VALIDATION.required(reportTitle).isValid;
})();
