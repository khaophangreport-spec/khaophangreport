(function () {
  "use strict";

  const STATUS_LABELS = Object.freeze({
    new: "รับเรื่องแล้ว",
    reviewing: "กำลังตรวจสอบ",
    accepted: "รับดำเนินการ",
    assigned: "มอบหมายแล้ว",
    in_progress: "กำลังดำเนินการ",
    waiting: "รอข้อมูลเพิ่มเติม",
    waiting_info: "รอข้อมูลเพิ่มเติม",
    resolved: "ดำเนินการแล้ว",
    closed: "ปิดเรื่อง",
    rejected: "ไม่รับดำเนินการ",
    duplicate: "เรื่องซ้ำ"
  });

  const STATUS_CLASSES = Object.freeze({
    new: "status-chip-info",
    reviewing: "status-chip-info",
    accepted: "status-chip-info",
    assigned: "status-chip-pending",
    in_progress: "status-chip-in-progress",
    waiting: "status-chip-warning",
    waiting_info: "status-chip-warning",
    resolved: "status-chip-success",
    closed: "status-chip-completed",
    rejected: "status-chip-danger",
    duplicate: "status-chip-warning"
  });

  const PRIORITY_LABELS = Object.freeze({
    low: "ต่ำ",
    normal: "ปกติ",
    high: "สูง",
    critical: "วิกฤต"
  });

  const CONTACT_METHOD_LABELS = Object.freeze({
    phone: "โทรศัพท์",
    email: "อีเมล",
    none: "ไม่ระบุ"
  });

  const state = {
    user: null,
    reportId: "",
    returnUrl: "reports.html",
    version: 0,
    data: null,
    isLoading: false
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function setText(selector, value) {
    const element = $(selector);

    if (element) {
      element.textContent = value === undefined || value === null || value === "" ? "-" : String(value);
    }
  }

  function setHidden(selector, hidden) {
    const element = $(selector);

    if (element) {
      element.hidden = !!hidden;
    }
  }

  function clearElement(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    element.textContent = text === undefined || text === null || text === "" ? "-" : String(text);
    return element;
  }

  function appendDefinition(list, label, value) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");

    term.textContent = label;
    detail.textContent = value === undefined || value === null || value === "" ? "-" : String(value);
    wrapper.appendChild(term);
    wrapper.appendChild(detail);
    list.appendChild(wrapper);
  }

  function appendDefinitionNode(list, label, node) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");

    term.textContent = label;
    detail.appendChild(node);
    wrapper.appendChild(term);
    wrapper.appendChild(detail);
    list.appendChild(wrapper);
  }

  function getSafeReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    const rawReturnUrl = String(params.get("returnUrl") || "").trim();

    if (!rawReturnUrl) {
      return "reports.html";
    }

    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(rawReturnUrl) || rawReturnUrl.indexOf("\\") !== -1) {
      return "reports.html";
    }

    try {
      const targetUrl = new URL(rawReturnUrl, window.location.href);
      const adminMarker = "/admin/";

      if (targetUrl.origin !== window.location.origin || targetUrl.pathname.indexOf(adminMarker) === -1) {
        return "reports.html";
      }

      const relativePath = targetUrl.pathname.split(adminMarker).pop() + targetUrl.search + targetUrl.hash;

      if (!/^reports\.html(?:[?#].*)?$/i.test(relativePath)) {
        return "reports.html";
      }

      return relativePath;
    } catch (error) {
      return "reports.html";
    }
  }

  function readReportId() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get("reportId") || params.get("id") || "").trim();
  }

  function setupBackLinks() {
    $all("[data-detail-back], [data-detail-error-back], [data-detail-not-found-back]").forEach(function (link) {
      link.href = state.returnUrl;
    });
  }

  function setLoading(isLoading) {
    state.isLoading = !!isLoading;
    setHidden("[data-detail-loading]", !isLoading);
    setHidden("[data-detail-error]", true);
    setHidden("[data-detail-not-found]", true);
    setHidden("[data-detail-content]", true);

    const refresh = $("[data-detail-refresh]");
    const retry = $("[data-detail-retry]");

    if (refresh) {
      refresh.disabled = !!isLoading;
    }

    if (retry) {
      retry.disabled = !!isLoading;
    }
  }

  function showError(error) {
    const message = window.KPR_API && typeof window.KPR_API.getErrorMessage === "function"
      ? window.KPR_API.getErrorMessage(error)
      : "ไม่สามารถเชื่อมต่อระบบได้";

    state.isLoading = false;
    setHidden("[data-detail-loading]", true);
    setHidden("[data-detail-content]", true);
    setHidden("[data-detail-not-found]", true);
    setHidden("[data-detail-error]", false);
    setText("[data-detail-error-message]", message);
    setRefreshEnabled(true);
  }

  function showNotFound() {
    state.isLoading = false;
    setHidden("[data-detail-loading]", true);
    setHidden("[data-detail-content]", true);
    setHidden("[data-detail-error]", true);
    setHidden("[data-detail-not-found]", false);
    setRefreshEnabled(true);
  }

  function showContent() {
    state.isLoading = false;
    setHidden("[data-detail-loading]", true);
    setHidden("[data-detail-error]", true);
    setHidden("[data-detail-not-found]", true);
    setHidden("[data-detail-content]", false);
    setRefreshEnabled(true);
  }

  function setRefreshEnabled(isEnabled) {
    const refresh = $("[data-detail-refresh]");
    const retry = $("[data-detail-retry]");

    if (refresh) {
      refresh.disabled = !isEnabled;
    }

    if (retry) {
      retry.disabled = !isEnabled;
    }
  }

  function formatDate(value) {
    const date = value ? new Date(value) : null;

    if (!date || isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium"
    }).format(date);
  }

  function formatDateTime(value) {
    const date = value ? new Date(value) : null;

    if (!date || isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("th-TH").format(Number(value || 0));
  }

  function formatBytes(value) {
    const bytes = Number(value || 0);

    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "-";
    }

    if (bytes >= 1024 * 1024) {
      return formatNumber((bytes / 1024 / 1024).toFixed(2)) + " MB";
    }

    return formatNumber(Math.ceil(bytes / 1024)) + " KB";
  }

  function formatCoordinate(value) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return "-";
    }

    return numberValue.toFixed(6);
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status || "-";
  }

  function getPriorityLabel(priority) {
    return PRIORITY_LABELS[priority] || priority || "-";
  }

  function createStatusChip(status) {
    return createTextElement("span", "status-chip " + (STATUS_CLASSES[status] || "status-chip-info"), getStatusLabel(status));
  }

  function createPriorityChip(priority) {
    return createTextElement("span", "reports-priority reports-priority--" + (priority || "normal"), getPriorityLabel(priority));
  }

  function hasPermission(permissionKey) {
    const permissions = state.data && state.data.permissions ? state.data.permissions : {};

    return !!permissions[permissionKey];
  }

  function renderSummary(report) {
    const statusElement = $("[data-detail-status]");
    const priorityElement = $("[data-detail-priority]");

    if (statusElement) {
      statusElement.className = "status-chip " + (STATUS_CLASSES[report.status] || "status-chip-info");
      statusElement.textContent = getStatusLabel(report.status);
    }

    if (priorityElement) {
      priorityElement.className = "reports-priority reports-priority--" + (report.priority || "normal");
      priorityElement.textContent = getPriorityLabel(report.priority);
    }

    state.version = Number(report.version || 0);
    setText("[data-detail-tracking-code]", report.trackingCode);
    setText("[data-detail-title]", report.title);
    setText("[data-detail-category]", report.category && report.category.name ? report.category.name : report.categoryId);
    setText("[data-detail-version]", "Version " + formatNumber(state.version));
    setText("[data-detail-created-at]", formatDateTime(report.createdAt));
    setText("[data-detail-updated-at]", formatDateTime(report.updatedAt));
    setText("[data-detail-incident-date]", formatDate(report.incidentDate));
    setText("[data-detail-target-due-at]", formatDateTime(report.targetDueAt));
    setText("[data-detail-subtitle]", report.trackingCode ? "รหัสติดตาม " + report.trackingCode : "รายละเอียดเรื่องแจ้ง");
  }

  function renderReportDetails(report) {
    const list = $("[data-detail-report]");

    clearElement(list);
    appendDefinition(list, "หัวข้อ", report.title);
    appendDefinition(list, "รายละเอียด", report.description);
    appendDefinition(list, "แหล่งที่มา", report.source || "web");
    appendDefinition(list, "รหัสเรื่องภายใน", report.reportId);
    appendDefinition(list, "เรื่องซ้ำกับ", report.duplicateOfReportId);
  }

  function renderLocation(report) {
    const list = $("[data-detail-location]");
    const location = report.location || {};

    clearElement(list);
    appendDefinition(list, "สถานที่", location.name);
    appendDefinition(list, "หมู่ที่", location.villageNo);
    appendDefinition(list, "จุดสังเกต", location.landmark);
    appendDefinition(list, "ละติจูด", formatCoordinate(location.latitude));
    appendDefinition(list, "ลองจิจูด", formatCoordinate(location.longitude));

    if (location.mapUrl) {
      const link = document.createElement("a");
      link.href = location.mapUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "เปิดแผนที่";
      appendDefinitionNode(list, "แผนที่", link);
    } else {
      appendDefinition(list, "แผนที่", "");
    }
  }

  function renderReporter(report) {
    const list = $("[data-detail-reporter]");
    const reporter = report.reporter || {};

    clearElement(list);
    appendDefinition(list, "รูปแบบการแจ้ง", reporter.isAnonymous ? "ไม่ระบุตัวตน" : "ระบุตัวตน");
    appendDefinition(list, "ชื่อ", reporter.name);
    appendDefinition(list, "โทรศัพท์", reporter.phone);
    appendDefinition(list, "อีเมล", reporter.email);
    appendDefinition(list, "ช่องทางติดต่อ", CONTACT_METHOD_LABELS[reporter.contactMethod] || reporter.contactMethod);
  }

  function renderStatusInfo(report) {
    const list = $("[data-detail-status-info]");

    clearElement(list);
    appendDefinitionNode(list, "สถานะปัจจุบัน", createStatusChip(report.status));
    appendDefinition(list, "ดำเนินการเสร็จ", formatDateTime(report.resolvedAt));
    appendDefinition(list, "ปิดเรื่อง", formatDateTime(report.closedAt));
    appendDefinition(list, "ปฏิเสธเมื่อ", formatDateTime(report.rejectedAt));
    appendDefinition(list, "เหตุผลปฏิเสธ", report.rejectionReason);
  }

  function renderPriorityInfo(report) {
    const list = $("[data-detail-priority-info]");

    clearElement(list);
    appendDefinitionNode(list, "ความสำคัญปัจจุบัน", createPriorityChip(report.priority));
    appendDefinitionNode(list, "ความเร่งด่วนที่ผู้แจ้งเลือก", createPriorityChip(report.priorityReported));
  }

  function renderAssignment(report) {
    const list = $("[data-detail-assignment]");

    clearElement(list);
    appendDefinition(list, "ผู้รับผิดชอบ", report.assigneeName || "ยังไม่มอบหมาย");
    appendDefinition(list, "รหัสผู้รับผิดชอบ", report.assignedTo);
    appendDefinition(list, "กำหนดเป้าหมาย", formatDateTime(report.targetDueAt));
  }

  function renderAttachments(attachments) {
    const container = $("[data-detail-attachments]");
    const empty = $("[data-detail-attachments-empty]");

    clearElement(container);
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    if (empty) {
      empty.hidden = safeAttachments.length > 0;
    }

    safeAttachments.forEach(function (attachment) {
      const item = document.createElement("article");
      const title = createTextElement("strong", "", attachment.fileName || attachment.originalFileName || "ไฟล์แนบ");
      const meta = createTextElement("span", "", [
        attachment.mimeType,
        formatBytes(attachment.fileSize),
        attachment.width && attachment.height ? attachment.width + " × " + attachment.height + " px" : "",
        attachment.fileRole
      ].filter(Boolean).join(" | "));

      item.className = "report-detail-attachment";
      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(createTextElement("small", "", formatDateTime(attachment.createdAt)));
      container.appendChild(item);
    });
  }

  function renderTimeline(timeline) {
    const container = $("[data-detail-timeline]");
    const empty = $("[data-detail-timeline-empty]");
    const safeTimeline = Array.isArray(timeline) ? timeline : [];

    clearElement(container);
    if (empty) {
      empty.hidden = safeTimeline.length > 0;
    }

    safeTimeline.forEach(function (update) {
      const item = document.createElement("li");
      const card = document.createElement("article");
      const header = document.createElement("div");

      card.className = "report-detail-timeline__item";
      header.className = "report-detail-timeline__header";
      header.appendChild(createStatusChip(update.status));
      header.appendChild(createTextElement("time", "", formatDateTime(update.createdAt)));
      card.appendChild(header);
      card.appendChild(createTextElement("p", "", update.message || "-"));

      if (update.internalNote && hasPermission("canViewInternalNotes")) {
        card.appendChild(createTextElement("small", "report-detail-internal-note", "บันทึกภายใน: " + update.internalNote));
      }

      if (Array.isArray(update.attachments) && update.attachments.length > 0) {
        card.appendChild(createTextElement("small", "", "ไฟล์แนบ " + formatNumber(update.attachments.length) + " รายการ"));
      }

      item.appendChild(card);
      container.appendChild(item);
    });
  }

  function renderInternalNotes(report, timeline) {
    const section = $("[data-detail-internal-section]");
    const container = $("[data-detail-internal-notes]");
    const empty = $("[data-detail-internal-empty]");
    const notes = [];

    if (!hasPermission("canViewInternalNotes")) {
      if (section) {
        section.hidden = true;
      }
      return;
    }

    if (section) {
      section.hidden = false;
    }

    if (report.internalSummary) {
      notes.push({
        title: "สรุปภายใน",
        message: report.internalSummary,
        createdAt: report.updatedAt
      });
    }

    (timeline || []).forEach(function (update) {
      if (update.internalNote) {
        notes.push({
          title: update.type || "บันทึกภายใน",
          message: update.internalNote,
          createdAt: update.createdAt
        });
      }
    });

    clearElement(container);
    if (empty) {
      empty.hidden = notes.length > 0;
    }

    notes.forEach(function (note) {
      const item = document.createElement("article");

      item.className = "report-detail-note";
      item.appendChild(createTextElement("strong", "", note.title));
      item.appendChild(createTextElement("p", "", note.message));
      item.appendChild(createTextElement("small", "", formatDateTime(note.createdAt)));
      container.appendChild(item);
    });
  }

  function renderAdditionalInfo(items) {
    const container = $("[data-detail-additional]");
    const empty = $("[data-detail-additional-empty]");
    const safeItems = Array.isArray(items) ? items : [];

    clearElement(container);
    if (empty) {
      empty.hidden = safeItems.length > 0;
    }

    safeItems.forEach(function (info) {
      const item = document.createElement("article");
      const meta = [
        "สถานะตรวจสอบ: " + (info.reviewStatus || "-"),
        formatDateTime(info.createdAt)
      ];

      item.className = "report-detail-note";
      item.appendChild(createTextElement("p", "", info.message));
      item.appendChild(createTextElement("small", "", meta.join(" | ")));

      if (info.contactName || info.contactPhone) {
        item.appendChild(createTextElement("small", "", "ผู้ส่งข้อมูล: " + [info.contactName, info.contactPhone].filter(Boolean).join(" | ")));
      }

      if (Array.isArray(info.attachments) && info.attachments.length > 0) {
        item.appendChild(createTextElement("small", "", "ไฟล์แนบ " + formatNumber(info.attachments.length) + " รายการ"));
      }

      container.appendChild(item);
    });
  }

  function renderHistory(assignments) {
    const container = $("[data-detail-history]");
    const empty = $("[data-detail-history-empty]");
    const safeAssignments = Array.isArray(assignments) ? assignments : [];

    clearElement(container);
    if (empty) {
      empty.hidden = safeAssignments.length > 0;
    }

    safeAssignments.forEach(function (assignment) {
      const item = document.createElement("article");

      item.className = "report-detail-history-item";
      item.appendChild(createTextElement("strong", "", assignment.assignedToName || assignment.assignedTo || "ไม่ระบุผู้รับผิดชอบ"));
      item.appendChild(createTextElement("span", "", "สถานะ: " + (assignment.assignmentStatus || "-")));
      item.appendChild(createTextElement("small", "", "มอบหมายโดย " + (assignment.assignedByName || assignment.assignedBy || "-") + " | " + formatDateTime(assignment.assignedAt || assignment.createdAt)));

      if (assignment.note) {
        item.appendChild(createTextElement("p", "", assignment.note));
      }

      container.appendChild(item);
    });
  }

  function renderDetail(data) {
    const safeData = data || {};
    const report = safeData.report || {};
    const timeline = Array.isArray(safeData.timeline) ? safeData.timeline : [];

    state.data = safeData;
    renderSummary(report);
    renderReportDetails(report);
    renderLocation(report);
    renderReporter(report);
    renderAttachments(safeData.attachments || []);
    renderStatusInfo(report);
    renderPriorityInfo(report);
    renderAssignment(report);
    setText("[data-detail-public-result]", report.publicResult || "ยังไม่มีผลดำเนินการสาธารณะ");
    renderTimeline(timeline);
    renderInternalNotes(report, timeline);
    renderAdditionalInfo(safeData.additionalInfo || []);
    renderHistory(safeData.assignments || []);
    showContent();
  }

  async function loadDetail() {
    if (!state.reportId) {
      showNotFound();
      return;
    }

    if (!window.KPR_API) {
      showError({ code: "NETWORK_ERROR" });
      return;
    }

    setLoading(true);

    try {
      const result = await window.KPR_API.read("admin.report.detail", {
        reportId: state.reportId
      }, {
        withSession: true
      });

      renderDetail(result.data || {});
    } catch (error) {
      if (error && (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")) {
        showNotFound();
        return;
      }

      showError(error);
    }
  }

  function bindEvents() {
    const refresh = $("[data-detail-refresh]");
    const retry = $("[data-detail-retry]");

    if (refresh) {
      refresh.addEventListener("click", loadDetail);
    }

    if (retry) {
      retry.addEventListener("click", loadDetail);
    }
  }

  async function init() {
    document.documentElement.dataset.adminPage = "report-detail";
    state.returnUrl = getSafeReturnUrl();
    state.reportId = readReportId();
    setupBackLinks();
    bindEvents();

    if (!window.KPR_AUTH || typeof window.KPR_AUTH.requireAdminSession !== "function") {
      showError({ code: "UNAUTHORIZED" });
      return;
    }

    state.user = await window.KPR_AUTH.requireAdminSession();
    if (!state.user) {
      return;
    }

    loadDetail();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
