(function () {
  "use strict";

  const PAGE_SIZE = 20;
  const SEARCH_DEBOUNCE_MS = 500;
  const SEVERITY_LABELS = Object.freeze({
    info: "ข้อมูล",
    warning: "เตือน",
    critical: "สำคัญ"
  });

  const state = {
    currentUser: null,
    logs: [],
    actions: [],
    entityTypes: [],
    permissions: {
      canRead: false
    },
    query: {
      page: 1,
      pageSize: PAGE_SIZE,
      userId: "",
      actionName: "",
      entityType: "",
      entity: "",
      dateFrom: "",
      dateTo: "",
      keyword: ""
    },
    pagination: {
      page: 1,
      pageSize: PAGE_SIZE,
      total: 0,
      totalPages: 1
    },
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
    const element = typeof selector === "string" ? $(selector) : selector;

    if (element) {
      element.textContent = value === undefined || value === null ? "" : String(value);
    }
  }

  function setHidden(selector, hidden) {
    const element = typeof selector === "string" ? $(selector) : selector;

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

  function hasPermission(user, permission) {
    const permissions = Array.isArray(user && user.permissions) ? user.permissions : [];

    return permissions.indexOf("admin.full") !== -1 || permissions.indexOf(permission) !== -1;
  }

  function canReadActivityLogs() {
    return hasPermission(state.currentUser, "settings.manage");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("th-TH").format(Number(value || 0));
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

  function getErrorMessage(error) {
    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return "ไม่สามารถเชื่อมต่อระบบได้";
  }

  function getSeverityLabel(severity) {
    return SEVERITY_LABELS[severity] || severity || "ข้อมูล";
  }

  function setControlsDisabled(isDisabled) {
    $all("[data-activity-filter-form] input, [data-activity-filter-form] select, [data-activity-filter-form] button, [data-activity-refresh], [data-activity-retry], [data-activity-empty-clear], [data-activity-prev], [data-activity-next]").forEach(function (element) {
      element.disabled = !!isDisabled;
    });
  }

  function setLoading(isLoading) {
    state.isLoading = !!isLoading;
    setHidden("[data-activity-loading]", !isLoading);
    setHidden("[data-activity-error]", true);
    setHidden("[data-activity-empty]", true);
    setHidden("[data-activity-content]", true);
    setHidden("[data-activity-success]", true);
    setControlsDisabled(isLoading);
  }

  function showForbidden() {
    state.isLoading = false;
    state.permissions = {
      canRead: false
    };
    setHidden("[data-activity-forbidden]", false);
    setHidden("[data-activity-loading]", true);
    setHidden("[data-activity-error]", true);
    setHidden("[data-activity-empty]", true);
    setHidden("[data-activity-content]", true);
    setHidden("[data-activity-success]", true);
    const form = $("[data-activity-filter-form]");

    if (form) {
      form.hidden = true;
    }
  }

  function showError(error) {
    state.isLoading = false;
    setHidden("[data-activity-loading]", true);
    setHidden("[data-activity-content]", true);
    setHidden("[data-activity-empty]", true);
    setHidden("[data-activity-success]", true);
    setHidden("[data-activity-error]", false);
    setText("[data-activity-error-message]", getErrorMessage(error));
    setControlsDisabled(false);
  }

  function showEmpty() {
    state.isLoading = false;
    setHidden("[data-activity-loading]", true);
    setHidden("[data-activity-content]", true);
    setHidden("[data-activity-error]", true);
    setHidden("[data-activity-success]", false);
    setText("[data-activity-success]", "โหลดข้อมูลสำเร็จ แต่ไม่พบรายการตามเงื่อนไข");
    setHidden("[data-activity-empty]", false);
    setControlsDisabled(false);
  }

  function showContent() {
    state.isLoading = false;
    setHidden("[data-activity-loading]", true);
    setHidden("[data-activity-error]", true);
    setHidden("[data-activity-empty]", true);
    setHidden("[data-activity-success]", false);
    setText("[data-activity-success]", "โหลด Activity Logs สำเร็จ");
    setHidden("[data-activity-content]", false);
    setControlsDisabled(false);
    renderPagination(state.pagination);
  }

  function readQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page") || 1);

    return {
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
      pageSize: PAGE_SIZE,
      userId: String(params.get("userId") || ""),
      actionName: String(params.get("actionName") || ""),
      entityType: String(params.get("entityType") || ""),
      entity: String(params.get("entity") || ""),
      dateFrom: String(params.get("dateFrom") || ""),
      dateTo: String(params.get("dateTo") || ""),
      keyword: String(params.get("keyword") || "")
    };
  }

  function writeQueryToUrl() {
    const params = new URLSearchParams();

    Object.keys(state.query).forEach(function (key) {
      if (key === "pageSize") {
        return;
      }

      if (key === "page" && Number(state.query.page) <= 1) {
        return;
      }

      if (state.query[key]) {
        params.set(key, String(state.query[key]));
      }
    });

    window.history.replaceState({}, "", window.location.pathname + (params.toString() ? "?" + params.toString() : ""));
  }

  function syncFiltersFromState() {
    const form = $("[data-activity-filter-form]");

    if (!form) {
      return;
    }

    form.elements.keyword.value = state.query.keyword;
    form.elements.userId.value = state.query.userId;
    form.elements.actionName.value = state.query.actionName;
    form.elements.entityType.value = state.query.entityType;
    form.elements.entity.value = state.query.entity;
    form.elements.dateFrom.value = state.query.dateFrom;
    form.elements.dateTo.value = state.query.dateTo;
  }

  function populateSelect(selectElement, values, selectedValue) {
    const currentValue = selectedValue || "";

    clearElement(selectElement);

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "ทั้งหมด";
    selectElement.appendChild(allOption);

    (values || []).forEach(function (value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      selectElement.appendChild(option);
    });

    if (currentValue && (values || []).indexOf(currentValue) === -1) {
      const currentOption = document.createElement("option");
      currentOption.value = currentValue;
      currentOption.textContent = currentValue;
      selectElement.appendChild(currentOption);
    }

    selectElement.value = currentValue;
  }

  function syncFilterOptions() {
    const form = $("[data-activity-filter-form]");

    if (!form) {
      return;
    }

    populateSelect(form.elements.actionName, state.actions, state.query.actionName);
    populateSelect(form.elements.entityType, state.entityTypes, state.query.entityType);
  }

  function loadLogs() {
    if (!window.KPR_API) {
      showError(new Error("API is not ready"));
      return Promise.resolve();
    }

    if (!canReadActivityLogs()) {
      showForbidden();
      return Promise.resolve();
    }

    setHidden("[data-activity-forbidden]", true);
    const form = $("[data-activity-filter-form]");
    if (form) {
      form.hidden = false;
    }
    setLoading(true);
    writeQueryToUrl();

    return window.KPR_API.read("admin.activity.list", state.query, {
      withSession: true
    }).then(function (response) {
      const data = response && response.data ? response.data : {};

      state.logs = Array.isArray(data.items) ? data.items : [];
      state.pagination = data.pagination || state.pagination;
      state.actions = Array.isArray(data.actions) ? data.actions : [];
      state.entityTypes = Array.isArray(data.entityTypes) ? data.entityTypes : [];
      state.permissions = data.permissions || {
        canRead: canReadActivityLogs()
      };

      syncFilterOptions();
      renderLogs();
      setText("[data-activity-updated-at]", formatDateTime(new Date().toISOString()));

      if (!state.permissions.canRead) {
        showForbidden();
        return;
      }

      if (state.logs.length === 0) {
        showEmpty();
      } else {
        showContent();
      }
    }).catch(function (error) {
      if (error && error.code === "FORBIDDEN") {
        showForbidden();
        return;
      }

      showError(error);
    });
  }

  function renderLogs() {
    renderLogTable();
    renderLogCards();
  }

  function createTableCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text === undefined || text === null ? "" : String(text);
    return cell;
  }

  function createUserCell(log) {
    const cell = document.createElement("td");
    const wrap = document.createElement("div");

    wrap.className = "activity-logs-user";
    wrap.appendChild(createTextElement("strong", "", log.userNameSnapshot || log.userId || "-"));
    wrap.appendChild(createTextElement("span", "", log.roleSnapshot || "-"));
    cell.appendChild(wrap);

    return cell;
  }

  function createEntityCell(log) {
    const cell = document.createElement("td");
    const wrap = document.createElement("div");

    wrap.className = "activity-logs-entity";
    wrap.appendChild(createTextElement("strong", "", log.entityType || "-"));
    wrap.appendChild(createTextElement("span", "", log.entityId || "-"));
    cell.appendChild(wrap);

    return cell;
  }

  function createStatusBadge(log) {
    const badge = document.createElement("span");
    const severity = log.severity || "info";

    badge.className = "activity-logs-status activity-logs-status--" + severity + (log.success ? "" : " activity-logs-status--failed");
    badge.textContent = (log.success ? "สำเร็จ" : "ไม่สำเร็จ") + " · " + getSeverityLabel(severity);
    return badge;
  }

  function createDetailCell(log) {
    const cell = document.createElement("td");
    const wrap = document.createElement("div");

    wrap.className = "activity-logs-detail";
    wrap.appendChild(createTextElement("span", "", log.detailSummary || "-"));
    wrap.appendChild(createTextElement("small", "", log.requestId ? "Request: " + log.requestId : ""));
    cell.appendChild(wrap);

    return cell;
  }

  function renderLogTable() {
    const body = $("[data-activity-table-body]");

    clearElement(body);

    state.logs.forEach(function (log) {
      const row = document.createElement("tr");
      const statusCell = document.createElement("td");

      statusCell.appendChild(createStatusBadge(log));
      row.appendChild(createTableCell(formatDateTime(log.createdAt)));
      row.appendChild(createUserCell(log));
      row.appendChild(createTableCell(log.action || "-"));
      row.appendChild(createEntityCell(log));
      row.appendChild(statusCell);
      row.appendChild(createDetailCell(log));
      body.appendChild(row);
    });
  }

  function renderLogCards() {
    const list = $("[data-activity-card-list]");

    clearElement(list);

    state.logs.forEach(function (log) {
      const card = document.createElement("article");
      const header = document.createElement("div");
      const meta = document.createElement("div");
      const detail = document.createElement("div");

      card.className = "activity-logs-card";
      header.className = "activity-logs-card__header";
      meta.className = "activity-logs-card__meta";
      detail.className = "activity-logs-card__detail";

      header.appendChild(createTextElement("h3", "", log.action || "-"));
      header.appendChild(createStatusBadge(log));
      meta.appendChild(createTextElement("span", "", formatDateTime(log.createdAt)));
      meta.appendChild(createTextElement("span", "", "ผู้ใช้: " + (log.userNameSnapshot || log.userId || "-")));
      meta.appendChild(createTextElement("span", "", "Entity: " + (log.entityType || "-") + " / " + (log.entityId || "-")));
      detail.appendChild(createTextElement("p", "", log.detailSummary || "-"));
      detail.appendChild(createTextElement("small", "", log.requestId ? "Request: " + log.requestId : ""));
      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(detail);
      list.appendChild(card);
    });
  }

  function renderPagination(pagination) {
    const page = Number(pagination && pagination.page ? pagination.page : 1);
    const pageSize = Number(pagination && pagination.pageSize ? pagination.pageSize : PAGE_SIZE);
    const totalPages = Math.max(1, Number(pagination && pagination.totalPages ? pagination.totalPages : 1));
    const total = Number(pagination && pagination.total ? pagination.total : 0);
    const start = total === 0 ? 0 : ((page - 1) * pageSize) + 1;
    const end = Math.min(total, page * pageSize);
    const prevButton = $("[data-activity-prev]");
    const nextButton = $("[data-activity-next]");

    state.pagination = {
      page: page,
      pageSize: pageSize,
      total: total,
      totalPages: totalPages
    };
    state.query.page = page;

    setText("[data-activity-page-label]", "หน้า " + formatNumber(page) + " จาก " + formatNumber(totalPages));
    setText("[data-activity-pagination-summary]", "แสดง " + formatNumber(start) + "-" + formatNumber(end) + " จาก " + formatNumber(total) + " รายการ");
    setText("[data-activity-pagination-summary-mobile]", "หน้า " + formatNumber(page) + " จาก " + formatNumber(totalPages));

    if (prevButton) {
      prevButton.disabled = page <= 1 || state.isLoading;
    }

    if (nextButton) {
      nextButton.disabled = page >= totalPages || state.isLoading;
    }
  }

  function updateQueryFromForm(form) {
    state.query.page = 1;
    state.query.keyword = form.elements.keyword.value.trim();
    state.query.userId = form.elements.userId.value.trim();
    state.query.actionName = form.elements.actionName.value;
    state.query.entityType = form.elements.entityType.value;
    state.query.entity = form.elements.entity.value.trim();
    state.query.dateFrom = form.elements.dateFrom.value;
    state.query.dateTo = form.elements.dateTo.value;
  }

  function clearFilters() {
    state.query = {
      page: 1,
      pageSize: PAGE_SIZE,
      userId: "",
      actionName: "",
      entityType: "",
      entity: "",
      dateFrom: "",
      dateTo: "",
      keyword: ""
    };
    syncFilterOptions();
    syncFiltersFromState();
    loadLogs();
  }

  function bindEvents() {
    const form = $("[data-activity-filter-form]");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        updateQueryFromForm(form);
        loadLogs();
      });

      form.elements.keyword.addEventListener("input", function () {
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(function () {
          updateQueryFromForm(form);
          loadLogs();
        }, SEARCH_DEBOUNCE_MS);
      });

      ["userId", "actionName", "entityType", "entity", "dateFrom", "dateTo"].forEach(function (name) {
        form.elements[name].addEventListener("change", function () {
          updateQueryFromForm(form);
          loadLogs();
        });
      });
    }

    $all("[data-activity-clear], [data-activity-empty-clear]").forEach(function (button) {
      button.addEventListener("click", clearFilters);
    });

    $all("[data-activity-refresh], [data-activity-retry]").forEach(function (button) {
      button.addEventListener("click", loadLogs);
    });

    const prevButton = $("[data-activity-prev]");
    const nextButton = $("[data-activity-next]");

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        if (state.query.page > 1) {
          state.query.page -= 1;
          loadLogs();
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        const totalPages = Math.max(1, Number(state.pagination.totalPages || 1));

        if (state.query.page < totalPages) {
          state.query.page += 1;
          loadLogs();
        }
      });
    }

    window.addEventListener("popstate", function () {
      state.query = readQueryFromUrl();
      syncFiltersFromState();
      loadLogs();
    });
  }

  async function init() {
    document.documentElement.dataset.adminPage = "activity";
    state.query = readQueryFromUrl();
    syncFiltersFromState();
    bindEvents();
    setLoading(true);

    if (!window.KPR_AUTH || typeof window.KPR_AUTH.requireAdminSession !== "function") {
      showError({ code: "UNAUTHORIZED" });
      return;
    }

    try {
      state.currentUser = await window.KPR_AUTH.requireAdminSession();

      if (!state.currentUser) {
        return;
      }

      if (!canReadActivityLogs()) {
        showForbidden();
        return;
      }

      state.permissions = {
        canRead: true
      };
      loadLogs();
    } catch (error) {
      showError(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
