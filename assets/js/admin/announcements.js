(function () {
  "use strict";

  const PAGE_SIZE = 20;
  const SEARCH_DEBOUNCE_MS = 500;
  const TYPE_LABELS = Object.freeze({
    info: "ทั่วไป",
    warning: "แจ้งเตือน",
    emergency: "ฉุกเฉิน",
    maintenance: "บำรุงรักษา"
  });
  const STATUS_LABELS = Object.freeze({
    active: "เปิดใช้งาน",
    inactive: "ปิดใช้งาน"
  });

  const state = {
    currentUser: null,
    announcements: [],
    selectedAnnouncement: null,
    permissions: {
      canRead: false,
      canSave: false
    },
    query: {
      page: 1,
      pageSize: PAGE_SIZE,
      keyword: "",
      type: "",
      includeInactive: false
    },
    pagination: {
      page: 1,
      pageSize: PAGE_SIZE,
      total: 0,
      totalPages: 1
    },
    isLoading: false,
    searchTimer: 0,
    confirmAction: null,
    lastFocusedElement: null
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

  function canManageAnnouncements() {
    return hasPermission(state.currentUser, "announcement.manage");
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

  function getTypeLabel(type) {
    return TYPE_LABELS[type] || type || "-";
  }

  function getErrorMessage(error) {
    if (error && error.code === "VERSION_CONFLICT") {
      return "ข้อมูลถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดรายการใหม่แล้วลองอีกครั้ง";
    }

    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return "ไม่สามารถเชื่อมต่อระบบได้";
  }

  function toDateTimeLocal(value) {
    const date = value ? new Date(value) : null;

    if (!date || isNaN(date.getTime())) {
      return "";
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);

    return localDate.toISOString().slice(0, 16);
  }

  function fromDateTimeLocal(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    return isNaN(date.getTime()) ? value : date.toISOString();
  }

  function nowDateTimeLocal() {
    return toDateTimeLocal(new Date().toISOString());
  }

  function updateCreateButton() {
    const button = $("[data-announcements-create]");

    if (!button) {
      return;
    }

    button.disabled = state.isLoading || !state.permissions.canSave;
    button.hidden = !state.permissions.canSave;
  }

  function setControlsDisabled(isDisabled) {
    $all("[data-announcements-filter-form] input, [data-announcements-filter-form] select, [data-announcements-filter-form] button, [data-announcements-prev], [data-announcements-next], [data-announcements-retry], [data-announcements-empty-clear]").forEach(function (element) {
      element.disabled = !!isDisabled;
    });
    updateCreateButton();
  }

  function setLoading(isLoading) {
    state.isLoading = !!isLoading;
    setHidden("[data-announcements-loading]", !isLoading);
    setHidden("[data-announcements-error]", true);
    setHidden("[data-announcements-empty]", true);
    setHidden("[data-announcements-content]", true);
    setControlsDisabled(isLoading);
  }

  function showForbidden() {
    state.isLoading = false;
    setHidden("[data-announcements-forbidden]", false);
    setHidden("[data-announcements-loading]", true);
    setHidden("[data-announcements-error]", true);
    setHidden("[data-announcements-empty]", true);
    setHidden("[data-announcements-content]", true);
    const form = $("[data-announcements-filter-form]");

    if (form) {
      form.hidden = true;
    }

    updateCreateButton();
  }

  function showError(error) {
    state.isLoading = false;
    setHidden("[data-announcements-loading]", true);
    setHidden("[data-announcements-content]", true);
    setHidden("[data-announcements-empty]", true);
    setHidden("[data-announcements-error]", false);
    setText("[data-announcements-error-message]", getErrorMessage(error));
    setControlsDisabled(false);
  }

  function showEmpty() {
    state.isLoading = false;
    setHidden("[data-announcements-loading]", true);
    setHidden("[data-announcements-content]", true);
    setHidden("[data-announcements-error]", true);
    setHidden("[data-announcements-empty]", false);
    setControlsDisabled(false);
  }

  function showContent() {
    state.isLoading = false;
    setHidden("[data-announcements-loading]", true);
    setHidden("[data-announcements-error]", true);
    setHidden("[data-announcements-empty]", true);
    setHidden("[data-announcements-content]", false);
    setControlsDisabled(false);
    renderPagination(state.pagination);
  }

  function readQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page") || 1);

    return {
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
      pageSize: PAGE_SIZE,
      keyword: String(params.get("keyword") || ""),
      type: String(params.get("type") || ""),
      includeInactive: params.get("includeInactive") === "1"
    };
  }

  function writeQueryToUrl() {
    const params = new URLSearchParams();

    if (state.query.page > 1) {
      params.set("page", String(state.query.page));
    }

    if (state.query.keyword) {
      params.set("keyword", state.query.keyword);
    }

    if (state.query.type) {
      params.set("type", state.query.type);
    }

    if (state.query.includeInactive) {
      params.set("includeInactive", "1");
    }

    window.history.replaceState({}, "", window.location.pathname + (params.toString() ? "?" + params.toString() : ""));
  }

  function syncFiltersFromState() {
    const form = $("[data-announcements-filter-form]");

    if (!form) {
      return;
    }

    form.elements.keyword.value = state.query.keyword;
    form.elements.type.value = state.query.type;
    form.elements.includeInactive.checked = state.query.includeInactive;
  }

  function loadAnnouncements() {
    if (!window.KPR_API) {
      showError(new Error("API is not ready"));
      return Promise.resolve();
    }

    if (!canManageAnnouncements()) {
      state.permissions = {
        canRead: false,
        canSave: false
      };
      showForbidden();
      return Promise.resolve();
    }

    setHidden("[data-announcements-forbidden]", true);
    setLoading(true);
    writeQueryToUrl();

    return window.KPR_API.read("admin.announcement.list", state.query, {
      withSession: true
    }).then(function (response) {
      const data = response && response.data ? response.data : {};

      state.announcements = Array.isArray(data.items) ? data.items : [];
      state.pagination = data.pagination || state.pagination;
      state.permissions = data.permissions || {
        canRead: true,
        canSave: canManageAnnouncements()
      };

      renderAnnouncements();
      setText("[data-announcements-updated-at]", formatDateTime(new Date().toISOString()));

      if (state.announcements.length === 0) {
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

  function renderAnnouncements() {
    renderAnnouncementTable();
    renderAnnouncementCards();
  }

  function createAnnouncementCell(announcement) {
    const cell = document.createElement("td");
    const wrap = document.createElement("div");

    wrap.className = "announcements-item";
    wrap.appendChild(createTextElement("strong", "", announcement.title || "-"));
    wrap.appendChild(createTextElement("span", "", announcement.content || "-"));
    cell.appendChild(wrap);

    return cell;
  }

  function createTypeBadge(type) {
    return createTextElement("span", "announcements-type announcements-type--" + (type || "info"), getTypeLabel(type));
  }

  function createStatusBadge(announcement) {
    return createTextElement("span", "announcements-status announcements-status--" + (announcement.isActive ? "active" : "inactive"), announcement.isActive ? STATUS_LABELS.active : STATUS_LABELS.inactive);
  }

  function createTimeText(announcement) {
    return "เริ่ม " + formatDateTime(announcement.startAt) + " | สิ้นสุด " + formatDateTime(announcement.endAt);
  }

  function createActionsCell(announcement) {
    const cell = document.createElement("td");
    const actions = document.createElement("div");
    const editButton = document.createElement("button");

    actions.className = "announcements-actions";
    editButton.className = "button button-secondary";
    editButton.type = "button";
    editButton.textContent = "แก้ไข";
    editButton.disabled = !state.permissions.canSave;
    editButton.addEventListener("click", function () {
      openEditor(announcement);
    });

    actions.appendChild(editButton);
    cell.appendChild(actions);

    return cell;
  }

  function createTextTableCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }

  function renderAnnouncementTable() {
    const body = $("[data-announcements-table-body]");

    clearElement(body);

    state.announcements.forEach(function (announcement) {
      const row = document.createElement("tr");
      const typeCell = document.createElement("td");
      const statusCell = document.createElement("td");

      typeCell.appendChild(createTypeBadge(announcement.type));
      statusCell.appendChild(createStatusBadge(announcement));
      row.appendChild(createAnnouncementCell(announcement));
      row.appendChild(typeCell);
      row.appendChild(createTextTableCell(createTimeText(announcement)));
      row.appendChild(createTextTableCell(formatNumber(announcement.sortOrder)));
      row.appendChild(statusCell);
      row.appendChild(createActionsCell(announcement));
      body.appendChild(row);
    });
  }

  function renderAnnouncementCards() {
    const list = $("[data-announcements-card-list]");

    clearElement(list);

    state.announcements.forEach(function (announcement) {
      const card = document.createElement("article");
      const header = document.createElement("div");
      const meta = document.createElement("div");
      const footer = document.createElement("div");
      const editButton = document.createElement("button");

      card.className = "announcements-card";
      header.className = "announcements-card__header";
      meta.className = "announcements-card__meta";
      footer.className = "announcements-card__footer";
      editButton.className = "button button-secondary";
      editButton.type = "button";
      editButton.textContent = "แก้ไข";
      editButton.disabled = !state.permissions.canSave;
      editButton.addEventListener("click", function () {
        openEditor(announcement);
      });

      header.appendChild(createTextElement("h3", "", announcement.title || "-"));
      header.appendChild(createTypeBadge(announcement.type));
      meta.appendChild(createTextElement("p", "", announcement.content || "-"));
      meta.appendChild(createTextElement("small", "", createTimeText(announcement)));
      meta.appendChild(createTextElement("small", "", "ลำดับ " + formatNumber(announcement.sortOrder)));
      footer.appendChild(createStatusBadge(announcement));
      footer.appendChild(editButton);
      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(footer);
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
    const prevButton = $("[data-announcements-prev]");
    const nextButton = $("[data-announcements-next]");

    state.pagination = {
      page: page,
      pageSize: pageSize,
      total: total,
      totalPages: totalPages
    };
    state.query.page = page;

    setText("[data-announcements-page-label]", "หน้า " + formatNumber(page) + " จาก " + formatNumber(totalPages));
    setText("[data-announcements-pagination-summary]", "แสดง " + formatNumber(start) + "-" + formatNumber(end) + " จาก " + formatNumber(total) + " รายการ");

    if (prevButton) {
      prevButton.disabled = page <= 1 || state.isLoading;
    }

    if (nextButton) {
      nextButton.disabled = page >= totalPages || state.isLoading;
    }
  }

  function clearFormMessages() {
    $all("[data-announcements-form] [data-field-error]").forEach(function (element) {
      element.textContent = "";
    });
    setHidden("[data-announcements-form-error]", true);
    setText("[data-announcements-form-error]", "");
    setHidden("[data-announcements-form-success]", true);
    setText("[data-announcements-form-success]", "");
  }

  function showFieldErrors(fields) {
    Object.keys(fields || {}).forEach(function (fieldName) {
      const element = $("[data-announcements-form] [data-field-error='" + fieldName + "']");

      if (element) {
        element.textContent = fields[fieldName];
      }
    });
  }

  function updatePreview() {
    const form = $("[data-announcements-form]");

    if (!form) {
      return;
    }

    const type = form.elements.type.value || "info";
    const title = form.elements.title.value.trim() || "หัวข้อประกาศ";
    const content = form.elements.content.value.trim() || "เนื้อหาประกาศจะแสดงที่นี่";
    const startAt = fromDateTimeLocal(form.elements.startAt.value);
    const endAt = fromDateTimeLocal(form.elements.endAt.value);
    const card = $("[data-announcements-preview-card]");

    if (card) {
      card.className = "announcements-preview-card announcements-preview-card--" + type;
    }

    setText("[data-announcements-preview-type]", getTypeLabel(type));
    setText("[data-announcements-preview-title]", title);
    setText("[data-announcements-preview-content]", content);
    setText("[data-announcements-preview-time]", "เริ่ม " + formatDateTime(startAt) + " | สิ้นสุด " + formatDateTime(endAt));
  }

  function openEditor(announcement) {
    const form = $("[data-announcements-form]");

    if (!form || !state.permissions.canSave) {
      return;
    }

    state.selectedAnnouncement = announcement || null;
    state.lastFocusedElement = document.activeElement;
    clearFormMessages();
    form.reset();

    form.elements.announcementId.value = announcement ? announcement.announcementId : "";
    form.elements.version.value = announcement ? announcement.version : "";
    form.elements.title.value = announcement ? announcement.title : "";
    form.elements.content.value = announcement ? announcement.content : "";
    form.elements.type.value = announcement ? announcement.type || "info" : "info";
    form.elements.startAt.value = announcement ? toDateTimeLocal(announcement.startAt) : nowDateTimeLocal();
    form.elements.endAt.value = announcement ? toDateTimeLocal(announcement.endAt) : "";
    form.elements.sortOrder.value = announcement ? announcement.sortOrder : 0;
    form.elements.isActive.checked = announcement ? !!announcement.isActive : true;

    setText("[data-announcements-editor-title]", announcement ? "แก้ไขประกาศ" : "เพิ่มประกาศ");
    updatePreview();
    setHidden("[data-announcements-editor]", false);
    document.body.classList.add("is-announcements-modal-open");
    form.elements.title.focus();
  }

  function closeEditor() {
    setHidden("[data-announcements-editor]", true);
    document.body.classList.remove("is-announcements-modal-open");
    state.selectedAnnouncement = null;

    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
      state.lastFocusedElement.focus();
    }
  }

  function getFormPayload(form) {
    return {
      announcementId: form.elements.announcementId.value,
      version: form.elements.version.value ? Number(form.elements.version.value) : "",
      title: form.elements.title.value,
      content: form.elements.content.value,
      type: form.elements.type.value,
      startAt: fromDateTimeLocal(form.elements.startAt.value),
      endAt: fromDateTimeLocal(form.elements.endAt.value),
      isActive: form.elements.isActive.checked,
      sortOrder: Number(form.elements.sortOrder.value || 0)
    };
  }

  function saveAnnouncement(form) {
    const payload = getFormPayload(form);
    const original = state.selectedAnnouncement;

    if (original && original.isActive && !payload.isActive) {
      openConfirm({
        title: "ปิดใช้งานประกาศ",
        message: "ประกาศนี้จะไม่แสดงบนหน้าเว็บสาธารณะ แต่ข้อมูลเดิมจะยังอยู่ในระบบ",
        onConfirm: function () {
          submitSave(form, payload);
        }
      });
      return;
    }

    submitSave(form, payload);
  }

  function submitSave(form, payload) {
    const button = $("[data-announcements-save]");

    clearFormMessages();

    if (button) {
      button.disabled = true;
      button.textContent = "กำลังบันทึก...";
    }

    window.KPR_API.write("admin.announcement.save", payload, {
      withSession: true
    }).then(function (response) {
      const data = response && response.data ? response.data : {};

      setHidden("[data-announcements-form-success]", false);
      setText("[data-announcements-form-success]", "บันทึกประกาศสำเร็จ");

      if (data.announcement) {
        state.selectedAnnouncement = data.announcement;
      }

      return loadAnnouncements().then(function () {
        closeEditor();
      });
    }).catch(function (error) {
      const fields = error && error.fields ? error.fields : {};

      showFieldErrors(fields);
      setHidden("[data-announcements-form-error]", false);
      setText("[data-announcements-form-error]", getErrorMessage(error));
    }).finally(function () {
      if (button) {
        button.disabled = false;
        button.textContent = "บันทึก";
      }
    });
  }

  function openConfirm(options) {
    state.confirmAction = options && typeof options.onConfirm === "function" ? options.onConfirm : null;
    setText("[data-announcements-confirm-title]", options && options.title ? options.title : "ยืนยันการดำเนินการ");
    setText("[data-announcements-confirm-message]", options && options.message ? options.message : "");
    setHidden("[data-announcements-confirm]", false);
    document.body.classList.add("is-announcements-modal-open");
  }

  function closeConfirm() {
    state.confirmAction = null;
    setHidden("[data-announcements-confirm]", true);

    if ($("[data-announcements-editor]") && $("[data-announcements-editor]").hidden) {
      document.body.classList.remove("is-announcements-modal-open");
    }
  }

  function clearFilters() {
    state.query = {
      page: 1,
      pageSize: PAGE_SIZE,
      keyword: "",
      type: "",
      includeInactive: false
    };
    syncFiltersFromState();
    loadAnnouncements();
  }

  function bindEvents() {
    const form = $("[data-announcements-filter-form]");
    const editorForm = $("[data-announcements-form]");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        state.query.page = 1;
        state.query.keyword = form.elements.keyword.value.trim();
        state.query.type = form.elements.type.value;
        state.query.includeInactive = form.elements.includeInactive.checked;
        loadAnnouncements();
      });

      form.elements.keyword.addEventListener("input", function () {
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(function () {
          state.query.page = 1;
          state.query.keyword = form.elements.keyword.value.trim();
          loadAnnouncements();
        }, SEARCH_DEBOUNCE_MS);
      });

      form.elements.type.addEventListener("change", function () {
        state.query.page = 1;
        state.query.type = form.elements.type.value;
        loadAnnouncements();
      });

      form.elements.includeInactive.addEventListener("change", function () {
        state.query.page = 1;
        state.query.includeInactive = form.elements.includeInactive.checked;
        loadAnnouncements();
      });
    }

    if (editorForm) {
      editorForm.addEventListener("submit", function (event) {
        event.preventDefault();
        saveAnnouncement(editorForm);
      });

      Array.prototype.forEach.call(editorForm.querySelectorAll("input, select, textarea"), function (element) {
        element.addEventListener("input", updatePreview);
        element.addEventListener("change", updatePreview);
      });
    }

    $all("[data-announcements-clear], [data-announcements-empty-clear]").forEach(function (button) {
      button.addEventListener("click", clearFilters);
    });

    const retryButton = $("[data-announcements-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", loadAnnouncements);
    }

    const createButton = $("[data-announcements-create]");
    if (createButton) {
      createButton.addEventListener("click", function () {
        openEditor(null);
      });
    }

    const prevButton = $("[data-announcements-prev]");
    const nextButton = $("[data-announcements-next]");

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        if (state.query.page > 1) {
          state.query.page -= 1;
          loadAnnouncements();
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        const totalPages = Math.max(1, Number(state.pagination.totalPages || 1));

        if (state.query.page < totalPages) {
          state.query.page += 1;
          loadAnnouncements();
        }
      });
    }

    $all("[data-announcements-editor-close], [data-announcements-editor-cancel]").forEach(function (button) {
      button.addEventListener("click", closeEditor);
    });

    $all("[data-announcements-confirm-cancel], [data-announcements-confirm-back]").forEach(function (button) {
      button.addEventListener("click", closeConfirm);
    });

    const confirmOk = $("[data-announcements-confirm-ok]");
    if (confirmOk) {
      confirmOk.addEventListener("click", function () {
        const action = state.confirmAction;
        closeConfirm();

        if (action) {
          action();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeConfirm();
        closeEditor();
      }
    });

    window.addEventListener("popstate", function () {
      state.query = readQueryFromUrl();
      syncFiltersFromState();
      loadAnnouncements();
    });
  }

  async function init() {
    document.documentElement.dataset.adminPage = "announcements";
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

      if (!canManageAnnouncements()) {
        showForbidden();
        return;
      }

      state.permissions = {
        canRead: true,
        canSave: true
      };
      loadAnnouncements();
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
