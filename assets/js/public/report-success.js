(function () {
  "use strict";

  const RESULT_KEY = "KPR_REPORT_RESULT_V1";
  const TRACKING_CODE_PATTERN = /^KPR-\d{6}-[A-Z0-9]{4}$/;

  const elements = {};
  let trackingCode = "";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    renderResult(readResult());
  }

  function cacheElements() {
    elements.content = document.querySelector("[data-success-content]");
    elements.empty = document.querySelector("[data-success-empty]");
    elements.title = document.querySelector("[data-success-title]");
    elements.lead = document.querySelector("[data-success-lead]");
    elements.trackingCode = document.querySelector("[data-tracking-code]");
    elements.reportTitle = document.querySelector("[data-report-title]");
    elements.categoryName = document.querySelector("[data-category-name]");
    elements.createdAt = document.querySelector("[data-created-at]");
    elements.reportStatus = document.querySelector("[data-report-status]");
    elements.copyButton = document.querySelector("[data-copy-code]");
    elements.copyStatus = document.querySelector("[data-copy-status]");
    elements.trackLink = document.querySelector("[data-track-link]");
  }

  function bindEvents() {
    if (elements.copyButton) {
      elements.copyButton.addEventListener("click", copyTrackingCode);
    }
  }

  function renderResult(result) {
    if (!result || !isValidTrackingCode(result.trackingCode)) {
      renderDirectAccess();
      return;
    }

    trackingCode = result.trackingCode;
    setHidden(elements.content, false);
    setHidden(elements.empty, true);
    setHidden(elements.copyButton, false);
    setText(elements.title, "ส่งเรื่องสำเร็จ");
    setText(elements.lead, "ระบบรับเรื่องของคุณเรียบร้อยแล้ว กรุณาเก็บรหัสติดตามไว้เพื่อตรวจสอบความคืบหน้า");
    setText(elements.trackingCode, trackingCode);
    setText(elements.reportTitle, result.title || "-");
    setText(elements.categoryName, result.categoryName || "-");
    setText(elements.createdAt, formatDateTime(result.createdAt));
    setText(elements.reportStatus, getStatusLabel(result.status));
    updateTrackLink(trackingCode);
  }

  function renderDirectAccess() {
    trackingCode = "";
    setHidden(elements.content, true);
    setHidden(elements.empty, false);
    setHidden(elements.copyButton, true);
    setText(elements.title, "ไม่พบข้อมูลการส่งเรื่อง");
    setText(elements.lead, "หน้านี้ใช้แสดงผลหลังส่งเรื่องสำเร็จเท่านั้น");
    setText(elements.copyStatus, "");
    updateTrackLink("");
  }

  function readResult() {
    try {
      const result = JSON.parse(window.sessionStorage.getItem(RESULT_KEY) || "null");
      return result && typeof result === "object" ? result : null;
    } catch (error) {
      return null;
    }
  }

  async function copyTrackingCode() {
    if (!trackingCode) {
      setCopyStatus("ไม่พบรหัสสำหรับคัดลอก");
      return;
    }

    setCopyButtonBusy(true);

    try {
      await copyText(trackingCode);
      setCopyStatus("คัดลอกรหัสติดตามแล้ว");
      showToast("คัดลอกรหัสติดตามแล้ว", "success");
    } catch (error) {
      setCopyStatus("คัดลอกอัตโนมัติไม่สำเร็จ กรุณาเลือกและคัดลอกรหัสด้วยตนเอง");
      focusTrackingCode();
    } finally {
      setCopyButtonBusy(false);
    }
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    if (copyTextFallback(value)) {
      return;
    }

    throw new Error("Clipboard unavailable");
  }

  function copyTextFallback(value) {
    const textarea = document.createElement("textarea");

    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.className = "clipboard-fallback-input";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } catch (error) {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  function setCopyButtonBusy(isBusy) {
    if (!elements.copyButton) {
      return;
    }

    elements.copyButton.disabled = isBusy;
    elements.copyButton.setAttribute("aria-busy", isBusy ? "true" : "false");
    elements.copyButton.textContent = isBusy ? "กำลังคัดลอก..." : "คัดลอกรหัส";
  }

  function setCopyStatus(message) {
    setText(elements.copyStatus, message);
  }

  function focusTrackingCode() {
    if (!elements.trackingCode) {
      return;
    }

    elements.trackingCode.setAttribute("tabindex", "-1");
    elements.trackingCode.focus();
  }

  function updateTrackLink(code) {
    if (!elements.trackLink) {
      return;
    }

    elements.trackLink.href = code ? "track.html?code=" + encodeURIComponent(code) : "track.html";
  }

  function isValidTrackingCode(value) {
    return TRACKING_CODE_PATTERN.test(String(value || "").trim());
  }

  function formatDateTime(value) {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.formatThaiDateTime === "function") {
      return window.KPR_UTILS.formatThaiDateTime(value) || "-";
    }

    return value || "-";
  }

  function getStatusLabel(value) {
    const labels = {
      new: "รับเรื่องแล้ว",
      reviewing: "กำลังตรวจสอบ",
      assigned: "มอบหมายเจ้าหน้าที่แล้ว",
      in_progress: "กำลังดำเนินการ",
      waiting: "รอข้อมูลเพิ่มเติม",
      resolved: "ดำเนินการแล้ว",
      closed: "ปิดเรื่อง",
      rejected: "ไม่รับดำเนินการ",
      duplicate: "เรื่องซ้ำ"
    };

    return labels[value] || value || "-";
  }

  function showToast(message, type) {
    if (window.KPR_TOAST && typeof window.KPR_TOAST.show === "function") {
      window.KPR_TOAST.show(message, type || "info");
    }
  }

  function setText(element, value) {
    if (!element) {
      return;
    }

    element.textContent = value === null || value === undefined ? "" : String(value);
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = hidden;
    }
  }
})();
