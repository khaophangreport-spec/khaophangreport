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

  const SORT_FIELDS = ["created_at", "updated_at", "priority", "status", "target_due_at"];
  const PAGE_SIZE = 20;
  const SEARCH_DEBOUNCE_MS = 500;

  const state = {
    user: null,
    query: getDefaultQuery(),
    pagination: {
      page: 1,
      pageSize: PAGE_SIZE,
      total: 0,
      totalPages: 1
    },
    categories: [],
    assignees: {},
    isLoading: false,
    searchTimer: 0
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
      element.textContent = value === undefined || value === null ? "" : String(value);
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

    element.textContent = text === undefined || text === null ? "" : String(text);
    return element;
  }

  function getDefaultQuery() {
    return {
      page: 1,
      pageSize: PAGE_SIZE,
      keyword: "",
      status: "",
      categoryId: "",
      priority: "",
      assigneeId: "",
      dateFrom: "",
      dateTo: "",
      scope: "global",
      sortBy: "created_at",
      sortDirection: "desc"
    };
  }

  function getUserRole(user) {
    return String(user && user.role ? user.role : "").toLowerCase();
  }

  function canUseGlobalScope(user) {
    return getUserRole(user) !== "officer";
  }

  function normalizeScope(value, user) {
    const scope = String(value || "").toLowerCase();

    if (scope === "mine" || scope === "assigned") {
      return "mine";
    }

    if (scope === "global" && canUseGlobalScope(user)) {
      return "global";
    }

    return canUseGlobalScope(user) ? "global" : "mine";
  }

  function parsePositiveInteger(value, fallback) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 1) {
      return fallback;
    }

    return Math.floor(numberValue);
  }

  function readQueryFromUrl(user) {
    const params = new URLSearchParams(window.location.search);
    const defaults = getDefaultQuery();
    const sortBy = params.get("sortBy") || defaults.sortBy;
    const sortDirection = String(params.get("sortDirection") || defaults.sortDirection).toLowerCase();

    return {
      page: parsePositiveInteger(params.get("page"), defaults.page),
      pageSize: Math.min(parsePositiveInteger(params.get("pageSize"), defaults.pageSize), 100),
      keyword: String(params.get("keyword") || ""),
      status: String(params.get("status") || ""),
      categoryId: String(params.get("categoryId") || ""),
      priority: String(params.get("priority") || ""),
      assigneeId: String(params.get("assigneeId") || ""),
      dateFrom: String(params.get("dateFrom") || ""),
      dateTo: String(params.get("dateTo") || ""),
      scope: normalizeScope(params.get("scope") || defaults.scope, user),
      sortBy: SORT_FIELDS.indexOf(sortBy) === -1 ? defaults.sortBy : sortBy,
      sortDirection: sortDirection === "asc" ? "asc" : "desc"
    };
  }

  function buildQueryParams(query) {
    const params = new URLSearchParams();
    const defaults = getDefaultQuery();

    Object.keys(defaults).forEach(function (key) {
      const value = query[key];

      if (value === undefined || value === null || String(value) === "" || String(value) === String(defaults[key])) {
        return;
      }

      params.set(key, String(value));
    });

    return params;
  }

  function syncUrl(replace) {
    const params = buildQueryParams(state.query);
    const nextUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");

    if (replace) {
      window.history.replaceState({}, "", nextUrl);
      return;
    }

    window.history.pushState({}, "", nextUrl);
  }

  function setFormValues() {
    const form = $("[data-reports-filter-form]");

    if (!form) {
      return;
    }

    Object.keys(state.query).forEach(function (key) {
      if (form.elements[key]) {
        form.elements[key].value = state.query[key];
      }
    });
  }

  function readFormValues() {
    const form = $("[data-reports-filter-form]");

    if (!form) {
      return getDefaultQuery();
    }

    return {
      page: state.query.page,
      pageSize: PAGE_SIZE,
      keyword: String(form.elements.keyword && form.elements.keyword.value || "").trim(),
      status: String(form.elements.status && form.elements.status.value || ""),
      categoryId: String(form.elements.categoryId && form.elements.categoryId.value || ""),
      priority: String(form.elements.priority && form.elements.priority.value || ""),
      assigneeId: String(form.elements.assigneeId && form.elements.assigneeId.value || ""),
      dateFrom: String(form.elements.dateFrom && form.elements.dateFrom.value || ""),
      dateTo: String(form.elements.dateTo && form.elements.dateTo.value || ""),
      scope: state.query.scope,
      sortBy: String(form.elements.sortBy && form.elements.sortBy.value || "created_at"),
      sortDirection: String(form.elements.sortDirection && form.elements.sortDirection.value || "desc")
    };
  }

  function validateDateRange(query) {
    return !query.dateFrom || !query.dateTo || query.dateFrom <= query.dateTo;
  }

  function setControlsDisabled(isDisabled) {
    $all("[data-reports-filter-form] input, [data-reports-filter-form] select, [data-reports-filter-form] button, [data-reports-scope], [data-reports-prev], [data-reports-next], [data-reports-retry], [data-reports-empty-clear]").forEach(function (element) {
      element.disabled = !!isDisabled;
    });
  }

  function updateScopeControls() {
    $all("[data-reports-scope]").forEach(function (button) {
      const scope = button.dataset.reportsScope || "";
      const isGlobal = scope === "global";
      const isActive = scope === state.query.scope;

      button.hidden = isGlobal && !canUseGlobalScope(state.user);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    setText(
      "[data-reports-scope-text]",
      state.query.scope === "mine" ? "แสดงเฉพาะเรื่องที่มอบหมายให้คุณ" : "แสดงรายการเรื่องแจ้งทั้งหมดตามสิทธิ์ของคุณ"
    );
  }

  function setLoading(isLoading) {
    state.isLoading = !!isLoading;
    setHidden("[data-reports-loading]", !isLoading);
    setHidden("[data-reports-error]", true);
    setHidden("[data-reports-empty]", true);
    setHidden("[data-reports-content]", true);
    setControlsDisabled(isLoading);
    updateScopeControls();
  }

  function showError(error) {
    state.isLoading = false;
    const message = window.KPR_API && typeof window.KPR_API.getErrorMessage === "function"
      ? window.KPR_API.getErrorMessage(error)
      : "ไม่สามารถเชื่อมต่อระบบได้";

    setHidden("[data-reports-loading]", true);
    setHidden("[data-reports-content]", true);
    setHidden("[data-reports-empty]", true);
    setHidden("[data-reports-error]", false);
    setText("[data-reports-error-message]", message);
    setControlsDisabled(false);
    updateScopeControls();
  }

  function showEmpty() {
    state.isLoading = false;
    setHidden("[data-reports-loading]", true);
    setHidden("[data-reports-content]", true);
    setHidden("[data-reports-error]", true);
    setHidden("[data-reports-empty]", false);
    setControlsDisabled(false);
    updateScopeControls();
  }

  function showContent() {
    state.isLoading = false;
    setHidden("[data-reports-loading]", true);
    setHidden("[data-reports-error]", true);
    setHidden("[data-reports-empty]", true);
    setHidden("[data-reports-content]", false);
    setControlsDisabled(false);
    updateScopeControls();
    renderPagination(state.pagination);
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
    const date = value ? new Date(value) : new Date();

    if (isNaN(date.getTime())) {
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

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status || "-";
  }

  function getPriorityLabel(priority) {
    return PRIORITY_LABELS[priority] || priority || "-";
  }

  function createStatusChip(status) {
    const chip = createTextElement("span", "status-chip " + (STATUS_CLASSES[status] || "status-chip-info"), getStatusLabel(status));
    return chip;
  }

  function createPriorityChip(priority) {
    const chip = createTextElement("span", "reports-priority reports-priority--" + (priority || "normal"), getPriorityLabel(priority));
    return chip;
  }

  function getDetailUrl(item) {
    const returnUrl = "reports.html" + window.location.search;
    const params = new URLSearchParams();

    if (item.reportId) {
      params.set("reportId", item.reportId);
    }

    params.set("returnUrl", returnUrl);

    return "report-detail.html?" + params.toString();
  }

  function rememberAssignees(items) {
    (items || []).forEach(function (item) {
      if (!item.assigneeId || !item.assigneeName) {
        return;
      }

      state.assignees[item.assigneeId] = item.assigneeName;
    });

    renderAssigneeOptions();
  }

  function renderCategoryOptions() {
    const select = $("#reports-category");
    const currentValue = state.query.categoryId;

    if (!select) {
      return;
    }

    clearElement(select);
    select.appendChild(new Option("ทุกหมวด", ""));

    state.categories.forEach(function (category) {
      select.appendChild(new Option(category.name || category.code || category.categoryId, category.categoryId));
    });

    select.value = currentValue;
  }

  function renderAssigneeOptions() {
    const select = $("#reports-assignee");
    const currentValue = state.query.assigneeId;

    if (!select) {
      return;
    }

    clearElement(select);
    select.appendChild(new Option("ทุกคน", ""));

    Object.keys(state.assignees).sort(function (left, right) {
      return state.assignees[left].localeCompare(state.assignees[right], "th");
    }).forEach(function (userId) {
      select.appendChild(new Option(state.assignees[userId], userId));
    });

    if (currentValue && !state.assignees[currentValue]) {
      select.appendChild(new Option("ผู้รับผิดชอบที่เลือกไว้", currentValue));
    }

    select.value = currentValue;
  }

  function renderTable(items) {
    const body = $("[data-reports-table-body]");

    clearElement(body);

    (items || []).forEach(function (item) {
      const row = document.createElement("tr");
      const titleCell = document.createElement("td");
      const titleWrap = document.createElement("div");
      const titleLink = document.createElement("a");

      titleWrap.className = "reports-title-cell";
      titleLink.href = getDetailUrl(item);
      titleLink.textContent = item.title || item.trackingCode || "เรื่องแจ้ง";
      titleWrap.appendChild(titleLink);
      titleWrap.appendChild(createTextElement("small", "", item.trackingCode || "-"));
      if (item.locationName || item.villageNo) {
        titleWrap.appendChild(createTextElement("small", "", [item.locationName, item.villageNo ? "หมู่ " + item.villageNo : ""].filter(Boolean).join(" | ")));
      }
      titleCell.appendChild(titleWrap);

      row.appendChild(titleCell);
      row.appendChild(createTextElement("td", "", item.category && item.category.name ? item.category.name : "-"));

      const statusCell = document.createElement("td");
      statusCell.appendChild(createStatusChip(item.status));
      row.appendChild(statusCell);

      const priorityCell = document.createElement("td");
      priorityCell.appendChild(createPriorityChip(item.priority));
      row.appendChild(priorityCell);

      row.appendChild(createTextElement("td", "", item.assigneeName || "ยังไม่มอบหมาย"));
      row.appendChild(createTextElement("td", "", formatDateTime(item.createdAt)));
      row.appendChild(createTextElement("td", "", item.isOverdue ? "เกินกำหนด" : formatDate(item.targetDueAt)));

      const actionCell = document.createElement("td");
      const actionLink = document.createElement("a");
      actionLink.className = "reports-row-link";
      actionLink.href = getDetailUrl(item);
      actionLink.textContent = "เปิด";
      actionCell.appendChild(actionLink);
      row.appendChild(actionCell);

      body.appendChild(row);
    });
  }

  function renderCards(items) {
    const container = $("[data-reports-card-list]");

    clearElement(container);

    (items || []).forEach(function (item) {
      const card = document.createElement("article");
      const header = document.createElement("div");
      const meta = document.createElement("div");
      const footer = document.createElement("div");
      const title = document.createElement("a");
      const detailLink = document.createElement("a");

      card.className = "reports-card";
      header.className = "reports-card__header";
      meta.className = "reports-card__meta";
      footer.className = "reports-card__footer";

      title.href = getDetailUrl(item);
      title.textContent = item.title || item.trackingCode || "เรื่องแจ้ง";
      header.appendChild(title);
      header.appendChild(createTextElement("small", "", item.trackingCode || "-"));
      card.appendChild(header);

      meta.appendChild(createTextElement("span", "", item.category && item.category.name ? item.category.name : "ไม่ระบุหมวด"));
      meta.appendChild(createTextElement("span", "", formatDateTime(item.createdAt)));
      meta.appendChild(createTextElement("span", "", item.assigneeName || "ยังไม่มอบหมาย"));
      if (item.locationName || item.villageNo) {
        meta.appendChild(createTextElement("span", "", [item.locationName, item.villageNo ? "หมู่ " + item.villageNo : ""].filter(Boolean).join(" | ")));
      }
      card.appendChild(meta);

      footer.appendChild(createStatusChip(item.status));
      footer.appendChild(createPriorityChip(item.priority));
      if (item.isOverdue) {
        footer.appendChild(createTextElement("span", "reports-overdue", "เกินกำหนด"));
      }
      detailLink.className = "reports-row-link";
      detailLink.href = getDetailUrl(item);
      detailLink.textContent = "เปิดรายละเอียด";
      footer.appendChild(detailLink);
      card.appendChild(footer);

      container.appendChild(card);
    });
  }

  function renderPagination(pagination) {
    const safePagination = pagination || {};
    const page = Number(safePagination.page || 1);
    const totalPages = Math.max(Number(safePagination.totalPages || 1), 1);
    const total = Number(safePagination.total || 0);
    const start = total === 0 ? 0 : ((page - 1) * Number(safePagination.pageSize || PAGE_SIZE)) + 1;
    const end = Math.min(page * Number(safePagination.pageSize || PAGE_SIZE), total);

    state.pagination = {
      page: page,
      pageSize: Number(safePagination.pageSize || PAGE_SIZE),
      total: total,
      totalPages: totalPages
    };
    state.query.page = page;
    state.query.pageSize = state.pagination.pageSize;

    setText("[data-reports-page-label]", "หน้า " + formatNumber(page) + " จาก " + formatNumber(totalPages));
    setText("[data-reports-pagination-summary]", "แสดง " + formatNumber(start) + "-" + formatNumber(end) + " จาก " + formatNumber(total) + " เรื่อง");

    const prev = $("[data-reports-prev]");
    const next = $("[data-reports-next]");

    if (prev) {
      prev.disabled = page <= 1 || state.isLoading;
    }

    if (next) {
      next.disabled = page >= totalPages || state.isLoading;
    }
  }

  function renderReports(data) {
    const safeData = data || {};
    const items = Array.isArray(safeData.items) ? safeData.items : [];

    rememberAssignees(items);
    setText("[data-reports-updated-at]", formatDateTime(new Date().toISOString()));

    if (safeData.filters && safeData.filters.scope) {
      state.query.scope = normalizeScope(safeData.filters.scope, state.user);
    }

    renderPagination(safeData.pagination);

    if (items.length === 0) {
      showEmpty();
      return;
    }

    renderTable(items);
    renderCards(items);
    showContent();
  }

  async function loadCategories() {
    if (!window.KPR_API) {
      return;
    }

    try {
      const result = await window.KPR_API.read("category.list", {}, {
        withSession: false
      });
      state.categories = Array.isArray(result.data && result.data.items) ? result.data.items : [];
      renderCategoryOptions();
    } catch (error) {
      state.categories = [];
      renderCategoryOptions();
    }
  }

  async function loadReports(replaceUrl) {
    if (!window.KPR_API) {
      showError({ code: "NETWORK_ERROR" });
      return;
    }

    if (!validateDateRange(state.query)) {
      showError({
        code: "VALIDATION_ERROR",
        message: "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น"
      });
      return;
    }

    setLoading(true);
    syncUrl(!!replaceUrl);

    try {
      const result = await window.KPR_API.read("admin.report.list", state.query, {
        withSession: true
      });
      renderReports(result.data || {});
    } catch (error) {
      showError(error);
    }
  }

  function applyQueryFromForm() {
    state.query = readFormValues();
    state.query.page = 1;
    state.query.scope = normalizeScope(state.query.scope, state.user);
    setFormValues();
    loadReports(false);
  }

  function clearFilters() {
    const currentScope = state.query.scope;
    state.query = getDefaultQuery();
    state.query.scope = normalizeScope(currentScope, state.user);
    setFormValues();
    loadReports(false);
  }

  function goToPage(page) {
    const totalPages = Math.max(state.pagination.totalPages || 1, 1);
    state.query.page = Math.min(Math.max(page, 1), totalPages);
    setFormValues();
    loadReports(false);
  }

  function bindEvents() {
    const form = $("[data-reports-filter-form]");
    const keyword = $("#reports-keyword");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        applyQueryFromForm();
      });

      $all("#reports-status, #reports-category, #reports-priority, #reports-assignee, #reports-date-from, #reports-date-to, #reports-sort-by, #reports-sort-direction").forEach(function (field) {
        field.addEventListener("change", applyQueryFromForm);
      });
    }

    if (keyword) {
      keyword.addEventListener("input", function () {
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(applyQueryFromForm, SEARCH_DEBOUNCE_MS);
      });
    }

    $all("[data-reports-scope]").forEach(function (button) {
      button.addEventListener("click", function () {
        const nextScope = normalizeScope(button.dataset.reportsScope, state.user);

        if (nextScope === state.query.scope || state.isLoading) {
          return;
        }

        state.query.scope = nextScope;
        state.query.page = 1;
        updateScopeControls();
        loadReports(false);
      });
    });

    const clearButton = $("[data-reports-clear]");
    const emptyClearButton = $("[data-reports-empty-clear]");
    const retryButton = $("[data-reports-retry]");
    const prevButton = $("[data-reports-prev]");
    const nextButton = $("[data-reports-next]");

    if (clearButton) {
      clearButton.addEventListener("click", clearFilters);
    }

    if (emptyClearButton) {
      emptyClearButton.addEventListener("click", clearFilters);
    }

    if (retryButton) {
      retryButton.addEventListener("click", function () {
        loadReports(true);
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        goToPage(state.query.page - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        goToPage(state.query.page + 1);
      });
    }

    window.addEventListener("popstate", function () {
      state.query = readQueryFromUrl(state.user);
      setFormValues();
      updateScopeControls();
      loadReports(true);
    });
  }

  async function init() {
    document.documentElement.dataset.adminPage = "reports";
    bindEvents();

    if (!window.KPR_AUTH || typeof window.KPR_AUTH.requireAdminSession !== "function") {
      showError({ code: "UNAUTHORIZED" });
      return;
    }

    state.user = await window.KPR_AUTH.requireAdminSession();
    if (!state.user) {
      return;
    }

    state.query = readQueryFromUrl(state.user);
    setFormValues();
    updateScopeControls();

    await loadCategories();
    setFormValues();
    loadReports(true);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
