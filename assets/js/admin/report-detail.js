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

  const STATUS_TRANSITIONS = Object.freeze({
    new: Object.freeze(["reviewing", "assigned", "waiting", "rejected", "duplicate"]),
    reviewing: Object.freeze(["assigned", "in_progress", "waiting", "rejected", "duplicate"]),
    assigned: Object.freeze(["in_progress", "waiting", "resolved"]),
    in_progress: Object.freeze(["waiting", "resolved"]),
    waiting: Object.freeze(["reviewing", "assigned", "in_progress", "rejected"]),
    resolved: Object.freeze(["closed", "in_progress"]),
    closed: Object.freeze([]),
    rejected: Object.freeze(["reviewing"]),
    duplicate: Object.freeze(["reviewing"])
  });

  const CRITICAL_STATUS_VALUES = Object.freeze(["closed", "rejected", "duplicate"]);

  const PRIORITY_LABELS = Object.freeze({
    low: "ต่ำ",
    normal: "ปกติ",
    high: "สูง",
    critical: "วิกฤต"
  });

  const PRIORITY_VALUES = Object.freeze(["low", "normal", "high", "critical"]);
  const PRIORITY_ORDER = Object.freeze({
    low: 1,
    normal: 2,
    high: 3,
    critical: 4
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
    isLoading: false,
    isAssigning: false,
    isUpdatingStatus: false,
    isUpdatingPriority: false,
    isAddingUpdate: false,
    updateAttachments: []
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
    renderAssignmentAction();
    renderStatusAction();
    renderPriorityAction();
    renderUpdateAction();
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

  function renderStatusAction() {
    const button = $("[data-detail-status-open]");
    const report = state.data && state.data.report ? state.data.report : {};
    const options = getAvailableStatusOptions(report.status);
    const canUpdate = hasPermission("canUpdate") && options.length > 0;

    if (!button) {
      return;
    }

    button.hidden = !canUpdate;
    button.disabled = !canUpdate || state.isLoading;
  }

  function renderUpdateAction() {
    const section = $("[data-update-section]");
    const canUpdate = hasPermission("canUpdate");

    if (section) {
      section.hidden = !canUpdate;
    }
  }

  function renderPriorityInfo(report) {
    const list = $("[data-detail-priority-info]");

    clearElement(list);
    appendDefinitionNode(list, "ความสำคัญปัจจุบัน", createPriorityChip(report.priority));
    appendDefinitionNode(list, "ความเร่งด่วนที่ผู้แจ้งเลือก", createPriorityChip(report.priorityReported));
    renderPriorityAction();
  }

  function renderPriorityAction() {
    const button = $("[data-detail-priority-open]");
    const canUpdatePriority = (hasPermission("canUpdatePriority") || hasPermission("canUpdate")) && !state.isLoading;

    if (!button) {
      return;
    }

    button.hidden = !canUpdatePriority;
    button.disabled = !canUpdatePriority;
  }

  function renderAssignment(report) {
    const list = $("[data-detail-assignment]");

    clearElement(list);
    appendDefinition(list, "ผู้รับผิดชอบ", report.assigneeName || "ยังไม่มอบหมาย");
    appendDefinition(list, "รหัสผู้รับผิดชอบ", report.assignedTo);
    appendDefinition(list, "กำหนดเป้าหมาย", formatDateTime(report.targetDueAt));
    renderAssignmentAction();
  }

  function renderAssignmentAction() {
    const button = $("[data-detail-assign-open]");
    const canAssign = hasPermission("canAssign") && Array.isArray(state.data && state.data.eligibleOfficers) &&
      state.data.eligibleOfficers.length > 0;

    if (!button) {
      return;
    }

    button.hidden = !canAssign;
    button.disabled = !canAssign || state.isLoading;
  }

  function getAvailableStatusOptions(status) {
    const currentStatus = String(status || "");
    const options = (STATUS_TRANSITIONS[currentStatus] || []).slice();

    if ((currentStatus === "rejected" || currentStatus === "duplicate") && !hasPermission("canAssign")) {
      return [];
    }

    return options;
  }

  function populateStatusOptions() {
    const select = $("[data-status-new-status]");
    const report = state.data && state.data.report ? state.data.report : {};
    const options = getAvailableStatusOptions(report.status);

    clearElement(select);

    if (!select) {
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "เลือกสถานะใหม่";
    select.appendChild(placeholder);

    options.forEach(function (status) {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = getStatusLabel(status);
      select.appendChild(option);
    });
  }

  function setStatusModalOpen(open) {
    const modal = $("[data-status-modal]");
    const button = $("[data-detail-status-open]");
    const select = $("[data-status-new-status]");

    if (!modal) {
      return;
    }

    modal.hidden = !open;
    document.body.classList.toggle("is-report-detail-modal-open", !!open || !!($("[data-assign-modal]") && !$("[data-assign-modal]").hidden));

    if (open) {
      populateStatusOptions();
      resetStatusForm();
      updateStatusFieldVisibility();
      window.setTimeout(function () {
        if (select) {
          select.focus();
        }
      }, 0);
      return;
    }

    if (button) {
      button.focus();
    }
  }

  function resetStatusForm() {
    const form = $("[data-status-form]");

    if (form) {
      form.reset();
    }

    setStatusError("");
    $all("[data-status-field-error]").forEach(function (element) {
      element.textContent = "";
    });
  }

  function setStatusError(message, fields) {
    const alert = $("[data-status-error]");

    if (alert) {
      alert.hidden = !message;
      alert.textContent = message || "";
    }

    $all("[data-status-field-error]").forEach(function (element) {
      const key = element.getAttribute("data-status-field-error");
      element.textContent = fields && fields[key] ? fields[key] : "";
    });
  }

  function getSelectedStatus() {
    const select = $("[data-status-new-status]");
    return select ? select.value : "";
  }

  function isCriticalStatus(status) {
    return CRITICAL_STATUS_VALUES.indexOf(status) !== -1;
  }

  function isReopenStatus(status) {
    const report = state.data && state.data.report ? state.data.report : {};
    const currentStatus = report.status || "";

    return (currentStatus === "resolved" && status === "in_progress") ||
      ((currentStatus === "rejected" || currentStatus === "duplicate") && status === "reviewing");
  }

  function setStatusFieldVisible(name, visible) {
    const field = $("[data-status-field='" + name + "']");

    if (field) {
      field.hidden = !visible;
    }
  }

  function updateStatusFieldVisibility() {
    const status = getSelectedStatus();
    const confirmRow = $("[data-status-confirm-row]");

    setStatusFieldVisible("publicMessage", status === "waiting");
    setStatusFieldVisible("result", status === "resolved");
    setStatusFieldVisible("rejectionReason", status === "rejected");
    setStatusFieldVisible("duplicate", status === "duplicate");
    setStatusFieldVisible("reason", isReopenStatus(status));

    if (confirmRow) {
      confirmRow.hidden = !isCriticalStatus(status);
    }

    updateStatusPreview();
  }

  function getStatusInputValue(selector) {
    const element = $(selector);
    return element ? element.value.trim() : "";
  }

  function buildStatusPreviewMessage(status) {
    if (!status) {
      return "เลือกสถานะใหม่เพื่อดูข้อความตัวอย่าง";
    }

    if (status === "waiting") {
      return getStatusInputValue("[data-status-public-message]") || "รอข้อมูลเพิ่มเติมจากผู้แจ้ง";
    }

    if (status === "resolved") {
      return getStatusInputValue("[data-status-result]") || "ดำเนินการแล้ว";
    }

    if (status === "closed") {
      return "ปิดเรื่องเรียบร้อยแล้ว";
    }

    if (status === "rejected") {
      return getStatusInputValue("[data-status-rejection-reason]") || "ไม่สามารถดำเนินการต่อได้";
    }

    if (status === "duplicate") {
      return "เรื่องนี้ถูกจัดเป็นเรื่องซ้ำ";
    }

    if (isReopenStatus(status)) {
      return "เปิดเรื่องกลับมาดำเนินการต่อ";
    }

    return "อัปเดตสถานะเป็น " + getStatusLabel(status);
  }

  function updateStatusPreview() {
    const preview = $("[data-status-preview-text]");

    if (preview) {
      preview.textContent = buildStatusPreviewMessage(getSelectedStatus());
    }
  }

  function validateStatusForm(payload) {
    const fields = {};

    if (!payload.newStatus) {
      fields.newStatus = "กรุณาเลือกสถานะใหม่";
    }

    if (payload.newStatus === "waiting" && !payload.publicMessage) {
      fields.publicMessage = "กรุณาระบุข้อความถึงประชาชน";
    }

    if (payload.newStatus === "resolved" && !payload.result) {
      fields.result = "กรุณาระบุผลการดำเนินการ";
    }

    if (payload.newStatus === "rejected" && !payload.rejectionReason) {
      fields.rejectionReason = "กรุณาระบุเหตุผลการปฏิเสธ";
    }

    if (payload.newStatus === "duplicate" && !payload.duplicateOfReportId && !payload.duplicateReason) {
      fields.duplicate = "กรุณาระบุเรื่องอ้างอิงหรือเหตุผลว่าเป็นเรื่องซ้ำ";
    }

    if (isReopenStatus(payload.newStatus) && !payload.reason) {
      fields.reason = "กรุณาระบุเหตุผลการเปิดกลับมาดำเนินการ";
    }

    if (isCriticalStatus(payload.newStatus) && !payload.confirmed) {
      fields.confirmed = "กรุณายืนยันก่อนเปลี่ยนสถานะนี้";
    }

    return fields;
  }

  function buildStatusPayload() {
    const confirm = $("[data-status-confirm]");

    return {
      reportId: state.reportId,
      version: state.version,
      newStatus: getSelectedStatus(),
      publicMessage: getStatusInputValue("[data-status-public-message]"),
      internalNote: getStatusInputValue("[data-status-internal-note]"),
      result: getStatusInputValue("[data-status-result]"),
      rejectionReason: getStatusInputValue("[data-status-rejection-reason]"),
      duplicateOfReportId: getStatusInputValue("[data-status-duplicate-ref]"),
      duplicateReason: getStatusInputValue("[data-status-duplicate-reason]"),
      reason: getStatusInputValue("[data-status-reason]"),
      confirmed: !!(confirm && confirm.checked)
    };
  }

  function setUpdatingStatus(updating) {
    const elements = [
      $("[data-status-submit]"),
      $("[data-status-cancel]"),
      $("[data-status-close]"),
      $("[data-status-new-status]"),
      $("[data-status-public-message]"),
      $("[data-status-result]"),
      $("[data-status-rejection-reason]"),
      $("[data-status-duplicate-ref]"),
      $("[data-status-duplicate-reason]"),
      $("[data-status-reason]"),
      $("[data-status-internal-note]"),
      $("[data-status-confirm]")
    ];
    const submitText = $("[data-status-submit-text]");

    state.isUpdatingStatus = !!updating;
    elements.forEach(function (element) {
      if (element) {
        element.disabled = state.isUpdatingStatus;
      }
    });

    if (submitText) {
      submitText.textContent = state.isUpdatingStatus ? "กำลังบันทึก..." : "บันทึกสถานะ";
    }
  }

  function getStatusErrorMessage(error) {
    if (!error) {
      return "ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่";
    }

    if (error.code === "VERSION_CONFLICT") {
      return "ข้อมูลเรื่องนี้ถูกอัปเดตแล้ว กรุณาโหลดใหม่ก่อนเปลี่ยนสถานะ";
    }

    if (error.code === "INVALID_STATUS_TRANSITION") {
      return "ไม่สามารถเปลี่ยนสถานะจากสถานะปัจจุบันไปยังสถานะที่เลือกได้";
    }

    if (error.code === "FORBIDDEN") {
      return "คุณไม่มีสิทธิ์เปลี่ยนสถานะเรื่องนี้";
    }

    if (error.code === "SESSION_EXPIRED" || error.code === "UNAUTHORIZED") {
      return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
    }

    return error.message || "ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่";
  }

  async function submitStatusUpdate(event) {
    event.preventDefault();

    if (state.isUpdatingStatus || !window.KPR_API) {
      return;
    }

    const payload = buildStatusPayload();
    const fields = validateStatusForm(payload);

    if (Object.keys(fields).length > 0) {
      setStatusError("กรุณาตรวจสอบข้อมูลก่อนบันทึก", fields);
      return;
    }

    setUpdatingStatus(true);
    setStatusError("");

    try {
      await window.KPR_API.write("admin.report.updateStatus", payload, {
        withSession: true
      });

      setStatusModalOpen(false);
      await loadDetail();
    } catch (error) {
      setStatusError(getStatusErrorMessage(error), error && error.fields ? error.fields : {});
    } finally {
      setUpdatingStatus(false);
    }
  }

  function getPriorityRank(priority) {
    return Number(PRIORITY_ORDER[String(priority || "").toLowerCase()] || 0);
  }

  function getCurrentPriority() {
    const report = state.data && state.data.report ? state.data.report : {};
    return String(report.priority || "normal").toLowerCase();
  }

  function isPriorityIncreaseToHighCritical(priority) {
    const newPriority = String(priority || "").toLowerCase();

    return (newPriority === "high" || newPriority === "critical") &&
      getPriorityRank(newPriority) > getPriorityRank(getCurrentPriority());
  }

  function populatePriorityOptions() {
    const select = $("[data-priority-new-priority]");

    clearElement(select);

    if (!select) {
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "เลือกระดับความสำคัญใหม่";
    select.appendChild(placeholder);

    PRIORITY_VALUES.forEach(function (priority) {
      const option = document.createElement("option");
      option.value = priority;
      option.textContent = getPriorityLabel(priority);
      select.appendChild(option);
    });

    select.value = getCurrentPriority();
  }

  function setPriorityModalOpen(open) {
    const modal = $("[data-priority-modal]");
    const button = $("[data-detail-priority-open]");
    const select = $("[data-priority-new-priority]");

    if (!modal) {
      return;
    }

    modal.hidden = !open;
    document.body.classList.toggle("is-report-detail-modal-open", !!open || !!($("[data-status-modal]") && !$("[data-status-modal]").hidden) || !!($("[data-assign-modal]") && !$("[data-assign-modal]").hidden));

    if (open) {
      populatePriorityOptions();
      resetPriorityForm();
      updatePriorityNoteVisibility();
      window.setTimeout(function () {
        if (select) {
          select.focus();
        }
      }, 0);
      return;
    }

    if (button) {
      button.focus();
    }
  }

  function resetPriorityForm() {
    const note = $("[data-priority-note]");

    setPriorityError("");
    setPrioritySuccess("");
    if (note) {
      note.value = "";
    }
  }

  function setPriorityError(message, fields) {
    const alert = $("[data-priority-error]");

    if (alert) {
      alert.hidden = !message;
      alert.textContent = message || "";
    }

    $all("[data-priority-field-error]").forEach(function (element) {
      const key = element.getAttribute("data-priority-field-error");
      element.textContent = fields && fields[key] ? fields[key] : "";
    });
  }

  function setPrioritySuccess(message) {
    const alert = $("[data-priority-success]");

    if (alert) {
      alert.hidden = !message;
      alert.textContent = message || "";
    }
  }

  function updatePriorityNoteVisibility() {
    const select = $("[data-priority-new-priority]");
    const noteRow = $("[data-priority-note-row]");
    const note = $("[data-priority-note]");
    const needsNote = isPriorityIncreaseToHighCritical(select ? select.value : "");

    if (noteRow) {
      noteRow.hidden = !needsNote;
    }

    if (note) {
      note.required = needsNote;
    }
  }

  function buildPriorityPayload() {
    const select = $("[data-priority-new-priority]");
    const note = $("[data-priority-note]");

    return {
      reportId: state.reportId,
      version: state.version,
      priority: select ? select.value : "",
      note: note ? note.value.trim() : ""
    };
  }

  function validatePriorityPayload(payload) {
    const fields = {};

    if (!payload.priority || PRIORITY_VALUES.indexOf(payload.priority) === -1) {
      fields.priority = "กรุณาเลือกระดับความสำคัญ";
    }

    if (payload.priority === getCurrentPriority()) {
      fields.priority = "ระดับความสำคัญยังเป็นค่าเดิม";
    }

    if (isPriorityIncreaseToHighCritical(payload.priority) && !payload.note) {
      fields.note = "กรุณาระบุหมายเหตุเมื่อปรับขึ้นเป็นสูงหรือวิกฤต";
    }

    return fields;
  }

  function setUpdatingPriority(updating) {
    const elements = [
      $("[data-priority-submit]"),
      $("[data-priority-cancel]"),
      $("[data-priority-close]"),
      $("[data-priority-new-priority]"),
      $("[data-priority-note]")
    ];
    const submitText = $("[data-priority-submit-text]");

    state.isUpdatingPriority = !!updating;
    elements.forEach(function (element) {
      if (element) {
        element.disabled = state.isUpdatingPriority;
      }
    });

    if (submitText) {
      submitText.textContent = state.isUpdatingPriority ? "กำลังบันทึก..." : "บันทึกความสำคัญ";
    }
  }

  function getPriorityErrorMessage(error) {
    if (!error) {
      return "ไม่สามารถปรับความสำคัญได้ กรุณาลองใหม่";
    }

    if (error.code === "VERSION_CONFLICT") {
      return "ข้อมูลเรื่องนี้ถูกอัปเดตแล้ว กรุณาโหลดใหม่ก่อนปรับความสำคัญ";
    }

    if (error.code === "FORBIDDEN") {
      return "คุณไม่มีสิทธิ์ปรับความสำคัญเรื่องนี้";
    }

    if (error.code === "SESSION_EXPIRED" || error.code === "UNAUTHORIZED") {
      return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
    }

    return error.message || "ไม่สามารถปรับความสำคัญได้ กรุณาลองใหม่";
  }

  async function submitPriorityUpdate(event) {
    event.preventDefault();

    if (state.isUpdatingPriority || !window.KPR_API) {
      return;
    }

    const payload = buildPriorityPayload();
    const fields = validatePriorityPayload(payload);

    if (Object.keys(fields).length > 0) {
      setPriorityError("กรุณาตรวจสอบข้อมูลก่อนบันทึก", fields);
      return;
    }

    setUpdatingPriority(true);
    setPriorityError("");
    setPrioritySuccess("");

    try {
      await window.KPR_API.write("admin.report.updatePriority", payload, {
        withSession: true
      });
      setPrioritySuccess("บันทึกความสำคัญเรียบร้อยแล้ว");
      setPriorityModalOpen(false);
      await loadDetail();
    } catch (error) {
      setPriorityError(getPriorityErrorMessage(error), error && error.fields ? error.fields : {});
    } finally {
      setUpdatingPriority(false);
    }
  }

  function populateAssignOfficerOptions() {
    const select = $("[data-assign-officer]");
    const officers = Array.isArray(state.data && state.data.eligibleOfficers) ? state.data.eligibleOfficers : [];

    clearElement(select);

    if (!select) {
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "เลือกเจ้าหน้าที่";
    select.appendChild(placeholder);

    officers.forEach(function (officer) {
      const option = document.createElement("option");
      option.value = officer.userId || "";
      option.textContent = officer.displayName || officer.userId || "เจ้าหน้าที่";
      select.appendChild(option);
    });
  }

  function setAssignModalOpen(open) {
    const modal = $("[data-assign-modal]");
    const button = $("[data-detail-assign-open]");
    const select = $("[data-assign-officer]");

    if (!modal) {
      return;
    }

    modal.hidden = !open;
    document.body.classList.toggle("is-report-detail-modal-open", !!open);

    if (open) {
      populateAssignOfficerOptions();
      setAssignError("");
      const currentAssignee = state.data && state.data.report ? state.data.report.assignedTo : "";
      if (select && currentAssignee) {
        select.value = currentAssignee;
      }
      window.setTimeout(function () {
        if (select) {
          select.focus();
        }
      }, 0);
      return;
    }

    if (button) {
      button.focus();
    }
  }

  function setAssignError(message, fields) {
    const alert = $("[data-assign-error]");
    const fieldError = $("[data-assign-field-error='assigneeId']");

    if (alert) {
      alert.hidden = !message;
      alert.textContent = message || "";
    }

    if (fieldError) {
      fieldError.textContent = fields && fields.assigneeId ? fields.assigneeId : "";
    }
  }

  function setAssigning(assigning) {
    const submit = $("[data-assign-submit]");
    const cancel = $("[data-assign-cancel]");
    const close = $("[data-assign-close]");
    const select = $("[data-assign-officer]");
    const note = $("[data-assign-note]");
    const submitText = $("[data-assign-submit-text]");

    state.isAssigning = !!assigning;
    [submit, cancel, close, select, note].forEach(function (element) {
      if (element) {
        element.disabled = state.isAssigning;
      }
    });

    if (submitText) {
      submitText.textContent = state.isAssigning ? "กำลังบันทึก..." : "บันทึกการมอบหมาย";
    }
  }

  function getAssignErrorMessage(error) {
    if (!error) {
      return "ไม่สามารถมอบหมายงานได้ กรุณาลองใหม่";
    }

    if (error.code === "VERSION_CONFLICT") {
      return "ข้อมูลเรื่องนี้ถูกอัปเดตแล้ว กรุณาโหลดใหม่ก่อนมอบหมายงาน";
    }

    if (error.code === "REPORT_CLOSED") {
      return "เรื่องนี้ปิดแล้ว ไม่สามารถมอบหมายงานได้";
    }

    if (error.code === "FORBIDDEN") {
      return "คุณไม่มีสิทธิ์มอบหมายงาน";
    }

    if (error.code === "SESSION_EXPIRED" || error.code === "UNAUTHORIZED") {
      return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
    }

    return error.message || "ไม่สามารถมอบหมายงานได้ กรุณาลองใหม่";
  }

  async function submitAssignment(event) {
    event.preventDefault();

    if (state.isAssigning || !window.KPR_API) {
      return;
    }

    const select = $("[data-assign-officer]");
    const note = $("[data-assign-note]");
    const assigneeId = select ? select.value : "";

    if (!assigneeId) {
      setAssignError("กรุณาเลือกเจ้าหน้าที่", {
        assigneeId: "กรุณาเลือกเจ้าหน้าที่"
      });
      return;
    }

    setAssigning(true);
    setAssignError("");

    try {
      await window.KPR_API.write("admin.report.assign", {
        reportId: state.reportId,
        assigneeId: assigneeId,
        note: note ? note.value : "",
        version: state.version
      }, {
        withSession: true
      });

      if (note) {
        note.value = "";
      }
      setAssignModalOpen(false);
      await loadDetail();
    } catch (error) {
      setAssignError(getAssignErrorMessage(error), error && error.fields ? error.fields : {});
    } finally {
      setAssigning(false);
    }
  }

  function setUpdateError(message, fields) {
    const alert = $("[data-update-error]");

    if (alert) {
      alert.hidden = !message;
      alert.textContent = message || "";
    }

    $all("[data-update-field-error]").forEach(function (element) {
      const key = element.getAttribute("data-update-field-error");
      if (!key || key === "attachments") {
        if (fields && fields[key]) {
          element.textContent = fields[key];
        } else if (key !== "attachments") {
          element.textContent = "";
        }
        return;
      }

      element.textContent = fields && fields[key] ? fields[key] : "";
    });
  }

  function setUpdateSuccess(message) {
    const alert = $("[data-update-success]");

    if (alert) {
      alert.hidden = !message;
      alert.textContent = message || "";
    }
  }

  function getUpdateInputValue(selector) {
    const element = $(selector);
    return element ? element.value.trim() : "";
  }

  function buildUpdatePayload() {
    const isPublic = $("[data-update-is-public]");

    return {
      reportId: state.reportId,
      version: state.version,
      publicMessage: getUpdateInputValue("[data-update-public-message]"),
      internalNote: getUpdateInputValue("[data-update-internal-note]"),
      isPublic: !!(isPublic && isPublic.checked),
      attachments: state.updateAttachments.map(function (attachment) {
        return {
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          base64: attachment.base64,
          fileSize: attachment.fileSize,
          width: attachment.width,
          height: attachment.height,
          isPublic: !!attachment.isPublic,
          fileRole: "progress"
        };
      })
    };
  }

  function validateUpdatePayload(payload) {
    const fields = {};

    if (!payload.publicMessage && !payload.internalNote) {
      fields.update = "กรุณาระบุ Public Message หรือ Internal Note";
    }

    if (payload.isPublic && !payload.publicMessage && payload.attachments.filter(function (attachment) {
      return attachment.isPublic;
    }).length === 0) {
      fields.publicMessage = "อัปเดตสาธารณะควรมีข้อความหรือไฟล์ที่เปิดเผยได้";
    }

    return fields;
  }

  function updatePublicPreview() {
    const isPublic = $("[data-update-is-public]");
    const preview = $("[data-update-preview-text]");
    const publicMessage = getUpdateInputValue("[data-update-public-message]");
    const publicAttachmentCount = state.updateAttachments.filter(function (attachment) {
      return attachment.isPublic;
    }).length;

    if (!preview) {
      return;
    }

    if (!isPublic || !isPublic.checked) {
      preview.textContent = "อัปเดตนี้ยังไม่แสดงต่อประชาชน";
      return;
    }

    preview.textContent = [
      publicMessage || "จะแสดงเฉพาะไฟล์แนบที่เปิดเผย",
      publicAttachmentCount > 0 ? "ไฟล์แนบสาธารณะ " + formatNumber(publicAttachmentCount) + " รายการ" : ""
    ].filter(Boolean).join(" | ");
  }

  function setAddingUpdate(adding) {
    const elements = [
      $("[data-update-submit]"),
      $("[data-update-reset]"),
      $("[data-update-public-message]"),
      $("[data-update-internal-note]"),
      $("[data-update-is-public]"),
      $("[data-update-attachments]")
    ];
    const submitText = $("[data-update-submit-text]");

    state.isAddingUpdate = !!adding;
    elements.forEach(function (element) {
      if (element) {
        element.disabled = state.isAddingUpdate;
      }
    });

    if (submitText) {
      submitText.textContent = state.isAddingUpdate ? "กำลังบันทึก..." : "บันทึกอัปเดต";
    }
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();

      reader.onload = function () {
        const result = String(reader.result || "");
        resolve(result.replace(/^data:[^;]+;base64,/, ""));
      };
      reader.onerror = function () {
        reject(new Error("ไม่สามารถอ่านไฟล์แนบได้"));
      };
      reader.readAsDataURL(file);
    });
  }

  async function buildAttachmentPayload(file) {
    const compressed = window.KPR_IMAGE_COMPRESS && typeof window.KPR_IMAGE_COMPRESS.compress === "function"
      ? await window.KPR_IMAGE_COMPRESS.compress(file)
      : {
        file: file,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        width: 1,
        height: 1
      };
    const sourceFile = compressed.file || compressed.blob || file;
    const base64 = await readFileAsBase64(sourceFile);

    return {
      fileName: compressed.fileName || file.name,
      mimeType: compressed.mimeType || file.type,
      fileSize: compressed.fileSize || sourceFile.size || file.size,
      width: compressed.width || 1,
      height: compressed.height || 1,
      base64: base64,
      isPublic: false
    };
  }

  function renderUpdateAttachments() {
    const container = $("[data-update-attachment-list]");

    clearElement(container);
    if (!container) {
      return;
    }

    state.updateAttachments.forEach(function (attachment, index) {
      const item = document.createElement("article");
      const meta = createTextElement("small", "", [
        attachment.mimeType,
        formatBytes(attachment.fileSize),
        attachment.width && attachment.height ? attachment.width + " × " + attachment.height + " px" : "",
        attachment.isPublic ? "Public" : "Private"
      ].filter(Boolean).join(" | "));
      const checkLabel = document.createElement("label");
      const checkbox = document.createElement("input");
      const checkText = document.createElement("span");
      const remove = document.createElement("button");

      item.className = "report-update-attachment";
      item.appendChild(createTextElement("strong", "", attachment.fileName));
      item.appendChild(meta);

      checkLabel.className = "report-detail-check report-update-attachment__check";
      checkbox.type = "checkbox";
      checkbox.checked = !!attachment.isPublic;
      checkbox.addEventListener("change", function () {
        state.updateAttachments[index].isPublic = checkbox.checked;
        renderUpdateAttachments();
        updatePublicPreview();
      });
      checkText.textContent = "เปิดเผยไฟล์นี้ในหน้า Public";
      checkLabel.appendChild(checkbox);
      checkLabel.appendChild(checkText);
      item.appendChild(checkLabel);

      remove.type = "button";
      remove.className = "button button-outline report-update-attachment__remove";
      remove.textContent = "ลบ";
      remove.addEventListener("click", function () {
        state.updateAttachments.splice(index, 1);
        renderUpdateAttachments();
        updatePublicPreview();
      });
      item.appendChild(remove);
      container.appendChild(item);
    });
  }

  async function handleUpdateAttachmentChange(event) {
    const input = event.target;
    const files = Array.prototype.slice.call(input.files || []);
    const maxImages = window.KPR_IMAGE_COMPRESS && typeof window.KPR_IMAGE_COMPRESS.maxImages === "function"
      ? window.KPR_IMAGE_COMPRESS.maxImages()
      : 3;

    setUpdateError("");
    setUpdateSuccess("");

    if (state.updateAttachments.length + files.length > maxImages) {
      setUpdateError("แนบไฟล์ได้สูงสุด " + formatNumber(maxImages) + " รายการ", {
        attachments: "แนบไฟล์ได้สูงสุด " + formatNumber(maxImages) + " รายการ"
      });
      input.value = "";
      return;
    }

    setAddingUpdate(true);
    try {
      for (let index = 0; index < files.length; index += 1) {
        state.updateAttachments.push(await buildAttachmentPayload(files[index]));
      }
      renderUpdateAttachments();
      updatePublicPreview();
    } catch (error) {
      setUpdateError(error && error.message ? error.message : "ไม่สามารถเตรียมไฟล์แนบได้");
    } finally {
      input.value = "";
      setAddingUpdate(false);
    }
  }

  function resetUpdateForm() {
    const form = $("[data-update-form]");
    const fileInput = $("[data-update-attachments]");

    if (form) {
      form.reset();
    }
    if (fileInput) {
      fileInput.value = "";
    }
    state.updateAttachments = [];
    renderUpdateAttachments();
    setUpdateError("");
    setUpdateSuccess("");
    updatePublicPreview();
  }

  function getUpdateErrorMessage(error) {
    if (!error) {
      return "ไม่สามารถบันทึกอัปเดตได้ กรุณาลองใหม่";
    }

    if (error.code === "VERSION_CONFLICT") {
      return "ข้อมูลเรื่องนี้ถูกอัปเดตแล้ว กรุณาโหลดใหม่ก่อนบันทึกอัปเดต";
    }

    if (error.code === "FORBIDDEN") {
      return "คุณไม่มีสิทธิ์เพิ่มอัปเดตเรื่องนี้";
    }

    if (error.code === "SESSION_EXPIRED" || error.code === "UNAUTHORIZED") {
      return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
    }

    return error.message || "ไม่สามารถบันทึกอัปเดตได้ กรุณาลองใหม่";
  }

  async function submitReportUpdate(event) {
    event.preventDefault();

    if (state.isAddingUpdate || !window.KPR_API) {
      return;
    }

    const payload = buildUpdatePayload();
    const fields = validateUpdatePayload(payload);

    if (Object.keys(fields).length > 0) {
      setUpdateError("กรุณาตรวจสอบข้อมูลก่อนบันทึก", fields);
      return;
    }

    setAddingUpdate(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      await window.KPR_API.write("admin.report.addUpdate", payload, {
        withSession: true
      });
      resetUpdateForm();
      setUpdateSuccess("บันทึกอัปเดตเรียบร้อยแล้ว");
      await loadDetail();
    } catch (error) {
      setUpdateError(getUpdateErrorMessage(error), error && error.fields ? error.fields : {});
    } finally {
      setAddingUpdate(false);
    }
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
      header.appendChild(createStatusChip(update.status || update.newStatus || update.oldStatus));
      header.appendChild(createTextElement("time", "", formatDateTime(update.createdAt)));
      card.appendChild(header);
      card.appendChild(createTextElement("p", "", update.message || update.publicMessage || "-"));

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
    const statusOpen = $("[data-detail-status-open]");
    const statusForm = $("[data-status-form]");
    const statusModal = $("[data-status-modal]");
    const statusCloseButtons = $all("[data-status-close], [data-status-cancel]");
    const statusInputs = $all("[data-status-new-status], [data-status-public-message], [data-status-result], [data-status-rejection-reason], [data-status-duplicate-ref], [data-status-duplicate-reason], [data-status-reason]");
    const priorityOpen = $("[data-detail-priority-open]");
    const priorityForm = $("[data-priority-form]");
    const priorityModal = $("[data-priority-modal]");
    const priorityCloseButtons = $all("[data-priority-close], [data-priority-cancel]");
    const priorityInputs = $all("[data-priority-new-priority], [data-priority-note]");
    const assignOpen = $("[data-detail-assign-open]");
    const assignForm = $("[data-assign-form]");
    const assignModal = $("[data-assign-modal]");
    const assignCloseButtons = $all("[data-assign-close], [data-assign-cancel]");
    const updateForm = $("[data-update-form]");
    const updateReset = $("[data-update-reset]");
    const updateFileInput = $("[data-update-attachments]");
    const updatePreviewInputs = $all("[data-update-public-message], [data-update-is-public]");

    if (refresh) {
      refresh.addEventListener("click", loadDetail);
    }

    if (retry) {
      retry.addEventListener("click", loadDetail);
    }

    if (statusOpen) {
      statusOpen.addEventListener("click", function () {
        setStatusModalOpen(true);
      });
    }

    if (statusForm) {
      statusForm.addEventListener("submit", submitStatusUpdate);
    }

    statusCloseButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (!state.isUpdatingStatus) {
          setStatusModalOpen(false);
        }
      });
    });

    statusInputs.forEach(function (input) {
      input.addEventListener("input", updateStatusFieldVisibility);
      input.addEventListener("change", updateStatusFieldVisibility);
    });

    if (statusModal) {
      statusModal.addEventListener("click", function (event) {
        if (event.target === statusModal && !state.isUpdatingStatus) {
          setStatusModalOpen(false);
        }
      });
    }

    if (priorityOpen) {
      priorityOpen.addEventListener("click", function () {
        setPriorityModalOpen(true);
      });
    }

    if (priorityForm) {
      priorityForm.addEventListener("submit", submitPriorityUpdate);
    }

    priorityCloseButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (!state.isUpdatingPriority) {
          setPriorityModalOpen(false);
        }
      });
    });

    priorityInputs.forEach(function (input) {
      input.addEventListener("input", updatePriorityNoteVisibility);
      input.addEventListener("change", updatePriorityNoteVisibility);
    });

    if (priorityModal) {
      priorityModal.addEventListener("click", function (event) {
        if (event.target === priorityModal && !state.isUpdatingPriority) {
          setPriorityModalOpen(false);
        }
      });
    }

    if (assignOpen) {
      assignOpen.addEventListener("click", function () {
        setAssignModalOpen(true);
      });
    }

    if (assignForm) {
      assignForm.addEventListener("submit", submitAssignment);
    }

    assignCloseButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (!state.isAssigning) {
          setAssignModalOpen(false);
        }
      });
    });

    if (assignModal) {
      assignModal.addEventListener("click", function (event) {
        if (event.target === assignModal && !state.isAssigning) {
          setAssignModalOpen(false);
        }
      });
    }

    if (updateForm) {
      updateForm.addEventListener("submit", submitReportUpdate);
    }

    if (updateReset) {
      updateReset.addEventListener("click", resetUpdateForm);
    }

    if (updateFileInput) {
      updateFileInput.addEventListener("change", handleUpdateAttachmentChange);
    }

    updatePreviewInputs.forEach(function (input) {
      input.addEventListener("input", updatePublicPreview);
      input.addEventListener("change", updatePublicPreview);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && statusModal && !statusModal.hidden && !state.isUpdatingStatus) {
        setStatusModalOpen(false);
        return;
      }

      if (event.key === "Escape" && assignModal && !assignModal.hidden && !state.isAssigning) {
        setAssignModalOpen(false);
        return;
      }

      if (event.key === "Escape" && priorityModal && !priorityModal.hidden && !state.isUpdatingPriority) {
        setPriorityModalOpen(false);
      }
    });
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
