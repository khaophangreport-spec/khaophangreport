(function () {
  "use strict";

  const TRACK_CACHE_KEY = "KPR_TRACK_RESULT_V1";
  const TRACKING_CODE_PATTERN = /^KPR-\d{6}-[A-Z0-9]{4}$/;

  const STATUS_LABELS = {
    new: "รับเรื่องแล้ว",
    reviewing: "กำลังตรวจสอบ",
    assigned: "มอบหมายแล้ว",
    in_progress: "กำลังดำเนินการ",
    waiting: "รอข้อมูลเพิ่มเติม",
    resolved: "ดำเนินการแล้ว",
    closed: "ปิดเรื่อง",
    rejected: "ไม่รับดำเนินการ",
    duplicate: "เรื่องซ้ำ"
  };
  const STATUS_CLASSES = {
    new: "status-chip-info",
    reviewing: "status-chip-info",
    assigned: "status-chip-pending",
    in_progress: "status-chip-in-progress",
    waiting: "status-chip-warning",
    resolved: "status-chip-success",
    closed: "status-chip-completed",
    rejected: "status-chip-danger",
    duplicate: "status-chip-warning"
  };
  const PRIORITY_LABELS = {
    low: "ต่ำ",
    normal: "ปกติ",
    high: "สูง",
    critical: "เร่งด่วนมาก"
  };

  const state = {
    lastTrackingCode: "",
    isLoading: false
  };
  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const page = document.body.dataset.trackPage || "";

    if (page === "search") {
      initSearchPage();
      return;
    }

    if (page === "detail") {
      initDetailPage();
    }
  }

  function initSearchPage() {
    cacheSearchElements();
    bindSearchEvents();

    const codeFromUrl = getTrackingCodeFromUrl();
    if (codeFromUrl) {
      setInputValue(codeFromUrl);
      submitSearch(codeFromUrl);
    } else {
      setInputValue("");
      resetSearchStates();
    }
  }

  function initDetailPage() {
    cacheDetailElements();
    bindDetailEvents();

    const codeFromUrl = getTrackingCodeFromUrl();
    if (!codeFromUrl) {
      showDetailState("missing");
      return;
    }

    state.lastTrackingCode = codeFromUrl;
    const cached = readCachedTrackResult();

    if (cached && cached.trackingCode === codeFromUrl) {
      renderTrackDetail(cached);
      fetchTrackDetail(codeFromUrl, { keepContentVisible: true });
      return;
    }

    fetchTrackDetail(codeFromUrl);
  }

  function cacheSearchElements() {
    elements.form = document.querySelector("[data-track-form]");
    elements.input = document.querySelector("[data-tracking-input]");
    elements.error = document.querySelector("[data-tracking-error]");
    elements.submit = document.querySelector("[data-track-submit]");
    elements.clear = document.querySelector("[data-track-clear]");
    elements.loading = document.querySelector("[data-track-loading]");
    elements.notFound = document.querySelector("[data-track-not-found]");
    elements.rateLimit = document.querySelector("[data-track-rate-limit]");
    elements.rateLimitMessage = document.querySelector("[data-track-rate-limit-message]");
    elements.errorState = document.querySelector("[data-track-error]");
    elements.errorMessage = document.querySelector("[data-track-error-message]");
    elements.retryButtons = document.querySelectorAll("[data-track-retry]");
  }

  function cacheDetailElements() {
    elements.detailLoading = document.querySelector("[data-track-detail-loading]");
    elements.detailMissing = document.querySelector("[data-track-detail-missing]");
    elements.detailError = document.querySelector("[data-track-detail-error]");
    elements.detailErrorMessage = document.querySelector("[data-track-detail-error-message]");
    elements.detailRetry = document.querySelector("[data-track-detail-retry]");
    elements.detailContent = document.querySelector("[data-track-detail-content]");
    elements.detailTrackingCode = document.querySelector("[data-detail-tracking-code]");
    elements.detailStatusChip = document.querySelector("[data-detail-status-chip]");
    elements.detailCategoryIcon = document.querySelector("[data-detail-category-icon]");
    elements.detailCategoryName = document.querySelector("[data-detail-category-name]");
    elements.detailTitle = document.querySelector("[data-detail-title]");
    elements.detailCreatedAt = document.querySelector("[data-detail-created-at]");
    elements.detailIncidentDate = document.querySelector("[data-detail-incident-date]");
    elements.detailPriority = document.querySelector("[data-detail-priority]");
    elements.detailStatusText = document.querySelector("[data-detail-status-text]");
    elements.detailTimeline = document.querySelector("[data-detail-timeline]");
    elements.detailTimelineEmpty = document.querySelector("[data-detail-timeline-empty]");
    elements.detailPublicResult = document.querySelector("[data-detail-public-result]");
    elements.detailAttachments = document.querySelector("[data-detail-attachments]");
    elements.detailAttachmentsEmpty = document.querySelector("[data-detail-attachments-empty]");
  }

  function bindSearchEvents() {
    if (elements.form) {
      elements.form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitSearch(elements.input ? elements.input.value : "");
      });
    }

    if (elements.input) {
      elements.input.addEventListener("input", function () {
        setInputValue(elements.input.value);
        clearFieldError();
        hideSearchResultStates();
      });
      elements.input.addEventListener("blur", function () {
        setInputValue(elements.input.value);
      });
    }

    if (elements.clear) {
      elements.clear.addEventListener("click", function () {
        setInputValue("");
        resetSearchStates();
        focusElement(elements.input);
      });
    }

    Array.prototype.forEach.call(elements.retryButtons || [], function (button) {
      button.addEventListener("click", function () {
        submitSearch(state.lastTrackingCode || (elements.input ? elements.input.value : ""));
      });
    });
  }

  function bindDetailEvents() {
    if (elements.detailRetry) {
      elements.detailRetry.addEventListener("click", function () {
        fetchTrackDetail(state.lastTrackingCode);
      });
    }
  }

  async function submitSearch(rawCode) {
    const trackingCode = normalizeTrackingCode(rawCode);

    setInputValue(trackingCode);
    state.lastTrackingCode = trackingCode;

    if (!validateTrackingCode(trackingCode)) {
      setFieldError("กรุณากรอกรหัสติดตามให้ถูกต้อง เช่น KPR-260626-A7F4");
      focusElement(elements.input);
      return;
    }

    setSearchLoading(true);
    hideSearchResultStates();

    try {
      const report = await requestTrack(trackingCode);
      cacheTrackResult(report);
      window.location.href = "track-detail.html?code=" + encodeURIComponent(report.trackingCode || trackingCode);
    } catch (error) {
      handleSearchError(error);
    } finally {
      setSearchLoading(false);
    }
  }

  async function fetchTrackDetail(trackingCode, options) {
    if (!validateTrackingCode(trackingCode)) {
      showDetailState("missing");
      return;
    }

    const safeOptions = options || {};
    state.lastTrackingCode = trackingCode;

    if (!safeOptions.keepContentVisible) {
      showDetailState("loading");
    }

    try {
      const report = await requestTrack(trackingCode);
      cacheTrackResult(report);
      renderTrackDetail(report);
    } catch (error) {
      showDetailError(error);
    }
  }

  async function requestTrack(trackingCode) {
    if (!window.KPR_API || typeof window.KPR_API.request !== "function") {
      throw createLocalError("NETWORK_ERROR", "ยังไม่สามารถเชื่อมต่อระบบ API ได้");
    }

    const response = await window.KPR_API.request("report.track", {
      trackingCode: trackingCode
    }, {
      retries: 0
    });

    return response.data || {};
  }

  function handleSearchError(error) {
    hideSearchResultStates();

    if (error && error.code === "NOT_FOUND") {
      setHidden(elements.notFound, false);
      return;
    }

    if (error && error.code === "RATE_LIMITED") {
      setText(elements.rateLimitMessage, buildRateLimitMessage(getRetryAfterSeconds(error)));
      setHidden(elements.rateLimit, false);
      return;
    }

    setText(elements.errorMessage, getErrorMessage(error));
    setHidden(elements.errorState, false);
  }

  function showDetailError(error) {
    if (error && error.code === "NOT_FOUND") {
      setText(elements.detailErrorMessage, "ไม่พบรหัสติดตามนี้ กรุณาตรวจสอบรหัสอีกครั้ง");
    } else if (error && error.code === "RATE_LIMITED") {
      setText(elements.detailErrorMessage, buildRateLimitMessage(getRetryAfterSeconds(error)));
    } else {
      setText(elements.detailErrorMessage, getErrorMessage(error));
    }

    showDetailState("error");
  }

  function renderTrackDetail(report) {
    const category = report.category || {};
    const status = String(report.status || "");

    showDetailState("content");
    setText(elements.detailTrackingCode, report.trackingCode || "-");
    setText(elements.detailCategoryIcon, getCategoryIconText(category));
    setText(elements.detailCategoryName, category.name || "ไม่ระบุหมวด");
    setText(elements.detailTitle, report.title || "เรื่องแจ้ง");
    setText(elements.detailCreatedAt, formatDateTime(report.createdAt));
    setText(elements.detailIncidentDate, formatDate(report.incidentDate));
    setText(elements.detailPriority, PRIORITY_LABELS[report.priority] || report.priority || "-");
    setText(elements.detailStatusText, getStatusLabel(status));
    renderStatusChip(elements.detailStatusChip, status);
    renderTimeline(report.timeline || []);
    renderPublicResult(report.publicResult || "");
    renderAttachments(report.attachments || []);
  }

  function renderStatusChip(element, status) {
    if (!element) {
      return;
    }

    element.className = "status-chip " + (STATUS_CLASSES[status] || "status-chip-info");
    element.textContent = getStatusLabel(status);
  }

  function renderTimeline(items) {
    clearChildren(elements.detailTimeline);
    const safeItems = Array.isArray(items) ? items : [];

    setHidden(elements.detailTimelineEmpty, safeItems.length > 0);

    safeItems.forEach(function (item) {
      const li = document.createElement("li");
      li.className = "track-timeline__item";

      const marker = document.createElement("span");
      marker.className = "track-timeline__marker";
      marker.setAttribute("aria-hidden", "true");

      const body = document.createElement("div");
      body.className = "track-timeline__body";

      const header = document.createElement("div");
      header.className = "track-timeline__header";

      const type = document.createElement("strong");
      type.textContent = getTimelineTypeLabel(item.type);

      const date = document.createElement("time");
      date.textContent = formatDateTime(item.createdAt);
      if (item.createdAt) {
        date.dateTime = item.createdAt;
      }

      const message = document.createElement("p");
      message.textContent = item.message || getStatusLabel(item.status) || "มีการอัปเดตสถานะ";

      header.appendChild(type);
      header.appendChild(date);
      body.appendChild(header);
      body.appendChild(message);

      if (item.status) {
        const chip = document.createElement("span");
        chip.className = "status-chip " + (STATUS_CLASSES[item.status] || "status-chip-info");
        chip.textContent = getStatusLabel(item.status);
        body.appendChild(chip);
      }

      const attachments = Array.isArray(item.attachments) ? item.attachments : [];
      if (attachments.length > 0) {
        body.appendChild(createAttachmentList(attachments, "track-attachment-list--timeline"));
      }

      li.appendChild(marker);
      li.appendChild(body);
      elements.detailTimeline.appendChild(li);
    });
  }

  function renderPublicResult(value) {
    clearChildren(elements.detailPublicResult);
    const paragraph = document.createElement("p");
    paragraph.textContent = value || "ยังไม่มีผลการดำเนินงานที่เผยแพร่";
    elements.detailPublicResult.appendChild(paragraph);
  }

  function renderAttachments(items) {
    clearChildren(elements.detailAttachments);
    const safeItems = Array.isArray(items) ? items : [];

    setHidden(elements.detailAttachmentsEmpty, safeItems.length > 0);

    if (safeItems.length > 0) {
      elements.detailAttachments.appendChild(createAttachmentList(safeItems, ""));
    }
  }

  function createAttachmentList(items, modifierClass) {
    const list = document.createElement("div");
    list.className = modifierClass ? "track-attachment-list " + modifierClass : "track-attachment-list";

    items.forEach(function (attachment) {
      const card = document.createElement("article");
      card.className = "track-attachment-card";

      const icon = document.createElement("span");
      icon.className = "track-attachment-card__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "รูป";

      const detail = document.createElement("div");
      detail.className = "track-attachment-card__detail";

      const name = document.createElement("strong");
      name.textContent = attachment.fileName || "ไฟล์แนบ";

      const meta = document.createElement("small");
      meta.textContent = buildAttachmentMeta(attachment);

      detail.appendChild(name);
      detail.appendChild(meta);
      card.appendChild(icon);
      card.appendChild(detail);
      list.appendChild(card);
    });

    return list;
  }

  function buildAttachmentMeta(attachment) {
    const parts = [];

    if (attachment.mimeType) {
      parts.push(attachment.mimeType);
    }

    if (attachment.fileSize) {
      parts.push(formatFileSize(attachment.fileSize));
    }

    if (attachment.width && attachment.height) {
      parts.push(Number(attachment.width) + " x " + Number(attachment.height) + " px");
    }

    if (attachment.createdAt) {
      parts.push(formatDateTime(attachment.createdAt));
    }

    return parts.join(" · ") || "ไฟล์แนบสาธารณะ";
  }

  function setSearchLoading(isLoading) {
    state.isLoading = isLoading;
    setHidden(elements.loading, !isLoading);

    if (elements.submit) {
      elements.submit.disabled = isLoading;
      elements.submit.setAttribute("aria-busy", isLoading ? "true" : "false");
      elements.submit.textContent = isLoading ? "กำลังตรวจสอบ..." : "ตรวจสอบสถานะ";
    }

    if (elements.input) {
      elements.input.disabled = isLoading;
    }
  }

  function showDetailState(stateName) {
    setHidden(elements.detailLoading, stateName !== "loading");
    setHidden(elements.detailMissing, stateName !== "missing");
    setHidden(elements.detailError, stateName !== "error");
    setHidden(elements.detailContent, stateName !== "content");
  }

  function resetSearchStates() {
    clearFieldError();
    hideSearchResultStates();
    setSearchLoading(false);
  }

  function hideSearchResultStates() {
    setHidden(elements.notFound, true);
    setHidden(elements.rateLimit, true);
    setHidden(elements.errorState, true);
  }

  function setInputValue(value) {
    if (elements.input) {
      elements.input.value = normalizeTrackingCode(value);
    }
  }

  function setFieldError(message) {
    setText(elements.error, message);
    if (elements.input) {
      elements.input.setAttribute("aria-invalid", message ? "true" : "false");
    }
  }

  function clearFieldError() {
    setFieldError("");
  }

  function normalizeTrackingCode(value) {
    const fallback = value === null || value === undefined ? "" : String(value);
    const normalized = window.KPR_UTILS && typeof window.KPR_UTILS.normalizeTrackingCode === "function"
      ? window.KPR_UTILS.normalizeTrackingCode(fallback)
      : fallback.trim().toUpperCase().replace(/\s+/g, "");

    return normalized.replace(/[\u2010-\u2015]/g, "-").replace(/\s+/g, "");
  }

  function validateTrackingCode(value) {
    return TRACKING_CODE_PATTERN.test(String(value || ""));
  }

  function getTrackingCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return normalizeTrackingCode(params.get("code") || params.get("trackingCode") || "");
  }

  function cacheTrackResult(report) {
    try {
      window.sessionStorage.setItem(TRACK_CACHE_KEY, JSON.stringify(report || {}));
    } catch (error) {
      // Session cache is only a convenience for refresh; API remains the source of truth.
    }
  }

  function readCachedTrackResult() {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem(TRACK_CACHE_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function getErrorMessage(error) {
    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return error && error.message ? error.message : "กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";
  }

  function buildRateLimitMessage(seconds) {
    const safeSeconds = Number(seconds || 0);

    if (safeSeconds > 0) {
      return "มีการค้นหาถี่เกินไป กรุณารอประมาณ " + safeSeconds + " วินาที แล้วลองใหม่";
    }

    return "มีการค้นหาถี่เกินไป กรุณารอสักครู่แล้วลองใหม่";
  }

  function getRetryAfterSeconds(error) {
    if (!error) {
      return 0;
    }

    if (Number(error.retryAfterSeconds) > 0) {
      return Number(error.retryAfterSeconds);
    }

    if (error.fields && Number(error.fields.retryAfterSeconds) > 0) {
      return Number(error.fields.retryAfterSeconds);
    }

    return 0;
  }

  function getStatusLabel(value) {
    return STATUS_LABELS[value] || value || "-";
  }

  function getTimelineTypeLabel(value) {
    const labels = {
      status: "อัปเดตสถานะ",
      note: "ข้อความแจ้ง",
      result: "ผลการดำเนินงาน",
      request_info: "ขอข้อมูลเพิ่มเติม",
      info_received: "ได้รับข้อมูลเพิ่มเติม",
      assignment: "การมอบหมาย",
      system: "ระบบ"
    };

    return labels[value] || "อัปเดต";
  }

  function getCategoryIconText(category) {
    const icon = category && category.icon ? String(category.icon) : "";
    return icon ? icon.slice(0, 2).toUpperCase() : "หม";
  }

  function formatDate(value) {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.formatThaiDate === "function") {
      return window.KPR_UTILS.formatThaiDate(value) || "-";
    }

    return value || "-";
  }

  function formatDateTime(value) {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.formatThaiDateTime === "function") {
      return window.KPR_UTILS.formatThaiDateTime(value) || "-";
    }

    return value || "-";
  }

  function formatFileSize(value) {
    const bytes = Number(value || 0);

    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "";
    }

    if (bytes >= 1024 * 1024) {
      return (bytes / 1024 / 1024).toFixed(1) + " MB";
    }

    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function createLocalError(code, message) {
    return {
      code: code,
      message: message
    };
  }

  function focusElement(element) {
    if (element && typeof element.focus === "function") {
      element.focus();
    }
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value === null || value === undefined ? "" : String(value);
    }
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = hidden;
    }
  }

  function clearChildren(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
})();
