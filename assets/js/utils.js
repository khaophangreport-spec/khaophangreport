(function () {
  "use strict";

  const THAI_LOCALE = "th-TH";
  const THAI_TIME_ZONE = "Asia/Bangkok";
  const HTML_ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  };

  function toSafeString(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  }

  function escapeText(value) {
    return toSafeString(value).replace(/[&<>"']/g, function (character) {
      return HTML_ESCAPE_MAP[character];
    });
  }

  function parseDate(value) {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  function formatThaiDate(value, options) {
    const date = parseDate(value);

    if (!date) {
      return "";
    }

    const formatter = new Intl.DateTimeFormat(THAI_LOCALE, Object.assign({
      dateStyle: "medium",
      timeZone: THAI_TIME_ZONE
    }, options || {}));

    return formatter.format(date);
  }

  function formatThaiDateTime(value, options) {
    const date = parseDate(value);

    if (!date) {
      return "";
    }

    const formatter = new Intl.DateTimeFormat(THAI_LOCALE, Object.assign({
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: THAI_TIME_ZONE
    }, options || {}));

    return formatter.format(date);
  }

  function normalizeTrackingCode(value) {
    return toSafeString(value)
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .toUpperCase();
  }

  function debounce(callback, delay) {
    let timeoutId = null;

    return function debouncedCallback() {
      const context = this;
      const args = arguments;

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function () {
        callback.apply(context, args);
      }, Number(delay) || 250);
    };
  }

  function generateRequestId(prefix) {
    const requestPrefix = normalizeTrackingCode(prefix || "REQ") || "REQ";

    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return requestPrefix + "-" + window.crypto.randomUUID();
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
    return requestPrefix + "-" + timestamp + "-" + randomPart;
  }

  function getCurrentPublicSection() {
    const page = document.body ? document.body.dataset.page : "";

    if (page) {
      return page;
    }

    const fileName = window.location.pathname.split("/").pop() || "index.html";
    const sectionByFile = {
      "index.html": "home",
      "report.html": "report",
      "report-success.html": "report",
      "track.html": "track",
      "track-detail.html": "track",
      "faq.html": "faq",
      "privacy.html": "privacy",
      "terms.html": "terms",
      "contact.html": "contact"
    };

    return sectionByFile[fileName] || "";
  }

  function markActiveNavigation() {
    const currentSection = getCurrentPublicSection();

    if (!currentSection) {
      return;
    }

    document.querySelectorAll("[data-nav-target]").forEach(function (link) {
      if (link.dataset.navTarget === currentSection) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateFooterYear() {
    const yearElement = document.querySelector("[data-current-year]");

    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }
  }

  function initPublicLayout() {
    markActiveNavigation();
    updateFooterYear();
  }

  document.addEventListener("DOMContentLoaded", initPublicLayout);

  window.KPRUtils = {
    debounce: debounce,
    escapeText: escapeText,
    formatThaiDate: formatThaiDate,
    formatThaiDateTime: formatThaiDateTime,
    generateRequestId: generateRequestId,
    getCurrentPublicSection: getCurrentPublicSection,
    initPublicLayout: initPublicLayout,
    markActiveNavigation: markActiveNavigation,
    normalizeTrackingCode: normalizeTrackingCode,
    setText: function (element, value) {
      if (element) {
        element.textContent = toSafeString(value);
      }
    }
  };

  // Examples:
  // const requestId = window.KPRUtils.generateRequestId();
  // const trackingCode = window.KPRUtils.normalizeTrackingCode(" kpr-260626-a7f4 ");
})();
