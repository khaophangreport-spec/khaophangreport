(function () {
  "use strict";

  const DEFAULT_TIMEOUT_MS = 10000;

  function toText(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  }

  function isSupported() {
    return "geolocation" in navigator;
  }

  function isValidLatitude(value) {
    const number = toNumber(value);

    return number !== null && number >= -90 && number <= 90;
  }

  function isValidLongitude(value) {
    const number = toNumber(value);

    return number !== null && number >= -180 && number <= 180;
  }

  function hasCompleteCoordinates(latitude, longitude) {
    return isValidLatitude(latitude) && isValidLongitude(longitude);
  }

  function normalizeCoordinate(value) {
    const number = toNumber(value);

    return number === null ? "" : number.toFixed(6);
  }

  function formatCoordinates(latitude, longitude) {
    if (!hasCompleteCoordinates(latitude, longitude)) {
      return "";
    }

    return "Lat " + normalizeCoordinate(latitude) + ", Lng " + normalizeCoordinate(longitude);
  }

  function buildGoogleMapsUrl(latitude, longitude) {
    if (!hasCompleteCoordinates(latitude, longitude)) {
      return "";
    }

    return "https://www.google.com/maps?q=" + encodeURIComponent(normalizeCoordinate(latitude) + "," + normalizeCoordinate(longitude));
  }

  function getCurrentPosition(options) {
    const settings = options || {};

    return new Promise(function (resolve, reject) {
      if (!isSupported()) {
        reject({
          code: "UNSUPPORTED",
          message: "เบราว์เซอร์นี้ไม่รองรับการใช้ตำแหน่งปัจจุบัน"
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(function (position) {
        resolve({
          latitude: normalizeCoordinate(position.coords.latitude),
          longitude: normalizeCoordinate(position.coords.longitude),
          accuracy: position.coords.accuracy || 0
        });
      }, function (error) {
        reject(normalizePositionError(error));
      }, {
        enableHighAccuracy: settings.enableHighAccuracy !== false,
        timeout: Number(settings.timeout) > 0 ? Number(settings.timeout) : DEFAULT_TIMEOUT_MS,
        maximumAge: Number(settings.maximumAge) >= 0 ? Number(settings.maximumAge) : 60000
      });
    });
  }

  function normalizePositionError(error) {
    if (!error) {
      return {
        code: "UNKNOWN",
        message: "ไม่สามารถอ่านตำแหน่งได้ กรุณากรอกสถานที่เอง"
      };
    }

    if (error.code === 1) {
      return {
        code: "PERMISSION_DENIED",
        message: "ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง กรุณากรอกสถานที่หรือจุดสังเกตเอง"
      };
    }

    if (error.code === 3) {
      return {
        code: "TIMEOUT",
        message: "ใช้เวลาค้นหาตำแหน่งนานเกินไป กรุณาลองใหม่หรือกรอกสถานที่เอง"
      };
    }

    return {
      code: "POSITION_UNAVAILABLE",
      message: "ไม่สามารถอ่านตำแหน่งได้ กรุณากรอกสถานที่เอง"
    };
  }

  window.KPR_LOCATION = {
    isSupported: isSupported,
    getCurrentPosition: getCurrentPosition,
    buildGoogleMapsUrl: buildGoogleMapsUrl,
    formatCoordinates: formatCoordinates,
    hasCompleteCoordinates: hasCompleteCoordinates,
    normalizeCoordinate: normalizeCoordinate,
    toText: toText
  };
})();
