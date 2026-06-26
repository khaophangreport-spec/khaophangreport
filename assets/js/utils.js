(function () {
  "use strict";

  const THAI_LOCALE = "th-TH";
  const BANGKOK_TIME_ZONE = "Asia/Bangkok";

  function toText(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function escapeText(value) {
    return toText(value).replace(/[&<>"']/g, function (character) {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  function toValidDate(value) {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatThaiDate(value) {
    const date = toValidDate(value);
    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat(THAI_LOCALE, {
      dateStyle: "medium",
      timeZone: BANGKOK_TIME_ZONE
    }).format(date);
  }

  function formatThaiDateTime(value) {
    const date = toValidDate(value);
    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat(THAI_LOCALE, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: BANGKOK_TIME_ZONE
    }).format(date);
  }

  function normalizeTrackingCode(value) {
    return toText(value)
      .trim()
      .toUpperCase()
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, "");
  }

  function debounce(callback, delay) {
    let timeoutId = null;
    const wait = Number.isFinite(delay) ? delay : 300;

    return function debouncedCallback() {
      const context = this;
      const args = arguments;

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function () {
        callback.apply(context, args);
      }, wait);
    };
  }

  function generateRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "REQ-" + window.crypto.randomUUID().toUpperCase();
    }

    return "REQ-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function setText(element, value) {
    if (element) {
      element.textContent = toText(value);
    }
  }

  window.KPR_UTILS = Object.freeze({
    escapeText: escapeText,
    formatThaiDate: formatThaiDate,
    formatThaiDateTime: formatThaiDateTime,
    normalizeTrackingCode: normalizeTrackingCode,
    debounce: debounce,
    generateRequestId: generateRequestId,
    setText: setText
  });

  // Example: window.KPR_UTILS.formatThaiDateTime(new Date());
})();
