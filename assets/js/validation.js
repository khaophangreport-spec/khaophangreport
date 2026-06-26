(function () {
  "use strict";

  function toText(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value).trim();
  }

  function isRequired(value) {
    return toText(value).length > 0;
  }

  function isPhone(value) {
    const phone = toText(value).replace(/[\s-]/g, "");

    if (!phone) {
      return true;
    }

    return /^0\d{8,9}$/.test(phone);
  }

  function isEmail(value) {
    const email = toText(value);

    if (!email) {
      return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isDate(value) {
    const text = toText(value);

    if (!text) {
      return true;
    }

    const parsedDate = new Date(text);
    return !Number.isNaN(parsedDate.getTime());
  }

  function isLatitude(value) {
    if (value === "" || value === null || value === undefined) {
      return true;
    }

    const latitude = Number(value);
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
  }

  function isLongitude(value) {
    if (value === "" || value === null || value === undefined) {
      return true;
    }

    const longitude = Number(value);
    return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  }

  function isLatLng(latitude, longitude) {
    const hasLatitude = latitude !== "" && latitude !== null && latitude !== undefined;
    const hasLongitude = longitude !== "" && longitude !== null && longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      return false;
    }

    return isLatitude(latitude) && isLongitude(longitude);
  }

  function hasMaxLength(value, maxLength) {
    const limit = Number(maxLength);

    if (!Number.isFinite(limit) || limit < 0) {
      return false;
    }

    return toText(value).length <= limit;
  }

  window.KPRValidation = {
    date: isDate,
    email: isEmail,
    isDate: isDate,
    isEmail: isEmail,
    isLatitude: isLatitude,
    isLatLng: isLatLng,
    isLongitude: isLongitude,
    isPhone: isPhone,
    isRequired: isRequired,
    latLng: isLatLng,
    maxLength: hasMaxLength,
    phone: isPhone,
    required: isRequired
  };

  // Examples:
  // const isValidPhone = window.KPRValidation.phone("0812345678");
  // const hasTitle = window.KPRValidation.required(titleInput.value);
})();
