(function () {
  "use strict";

  const PAGE_SIZE = 20;
  const SEARCH_DEBOUNCE_MS = 500;
  const DEFAULT_COLOR = "#287444";
  const STATUS_LABELS = Object.freeze({
    active: "ใช้งาน",
    inactive: "ปิดใช้งาน"
  });

  const state = {
    currentUser: null,
    categories: [],
    selectedCategory: null,
    permissions: {
      canRead: false,
      canSave: false
    },
    query: {
      page: 1,
      pageSize: PAGE_SIZE,
      keyword: "",
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

  function canManageCategories() {
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

  function normalizeColor(value) {
    const color = String(value || DEFAULT_COLOR).trim();

    return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_COLOR;
  }

  function getErrorMessage(error) {
    if (error && error.code === "VERSION_CONFLICT") {
      return "ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาโหลดรายการใหม่แล้วลองอีกครั้ง";
    }

    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return "ไม่สามารถเชื่อมต่อระบบได้";
  }

  function setControlsDisabled(isDisabled) {
    $all("[data-categories-filter-form] input, [data-categories-filter-form] button, [data-categories-prev], [data-categories-next], [data-categories-retry], [data-categories-empty-clear]").forEach(function (element) {
      element.disabled = !!isDisabled;
    });
    updateCreateButton();
  }

  function updateCreateButton() {
    const button = $("[data-categories-create]");

    if (!button) {
      return;
    }

    button.disabled = state.isLoading || !state.permissions.canSave;
    button.hidden = !state.permissions.canSave;
  }

  function setLoading(isLoading) {
    state.isLoading = !!isLoading;
    setHidden("[data-categories-loading]", !isLoading);
    setHidden("[data-categories-error]", true);
    setHidden("[data-categories-empty]", true);
    setHidden("[data-categories-content]", true);
    setControlsDisabled(isLoading);
  }

  function showForbidden() {
    state.isLoading = false;
    setHidden("[data-categories-forbidden]", false);
    setHidden("[data-categories-loading]", true);
    setHidden("[data-categories-error]", true);
    setHidden("[data-categories-empty]", true);
    setHidden("[data-categories-content]", true);
    const form = $("[data-categories-filter-form]");
    if (form) {
      form.hidden = true;
    }
    updateCreateButton();
  }

  function showError(error) {
    state.isLoading = false;
    setHidden("[data-categories-loading]", true);
    setHidden("[data-categories-content]", true);
    setHidden("[data-categories-empty]", true);
    setHidden("[data-categories-error]", false);
    setText("[data-categories-error-message]", getErrorMessage(error));
    setControlsDisabled(false);
  }

  function showEmpty() {
    state.isLoading = false;
    setHidden("[data-categories-loading]", true);
    setHidden("[data-categories-content]", true);
    setHidden("[data-categories-error]", true);
    setHidden("[data-categories-empty]", false);
    setControlsDisabled(false);
  }

  function showContent() {
    state.isLoading = false;
    setHidden("[data-categories-loading]", true);
    setHidden("[data-categories-error]", true);
    setHidden("[data-categories-empty]", true);
    setHidden("[data-categories-content]", false);
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

    if (state.query.includeInactive) {
      params.set("includeInactive", "1");
    }

    const nextUrl = params.toString() ? "?" + params.toString() : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }

  function syncFiltersFromState() {
    const form = $("[data-categories-filter-form]");

    if (!form) {
      return;
    }

    form.elements.keyword.value = state.query.keyword;
    form.elements.includeInactive.checked = state.query.includeInactive;
  }

  function loadCategories() {
    if (!window.KPR_API) {
      showError(new Error("API is not ready"));
      return Promise.resolve();
    }

    if (!canManageCategories()) {
      state.permissions = {
        canRead: false,
        canSave: false
      };
      showForbidden();
      return Promise.resolve();
    }

    setHidden("[data-categories-forbidden]", true);
    setLoading(true);
    writeQueryToUrl();

    return window.KPR_API.read("admin.category.list", state.query, {
      withSession: true
    }).then(function (response) {
      const data = response && response.data ? response.data : {};

      state.categories = Array.isArray(data.items) ? data.items : [];
      state.pagination = data.pagination || state.pagination;
      state.permissions = data.permissions || {
        canRead: true,
        canSave: canManageCategories()
      };

      renderCategories();
      setText("[data-categories-updated-at]", formatDateTime(new Date().toISOString()));

      if (state.categories.length === 0) {
        showEmpty();
      } else {
        showContent();
      }
    }).catch(showError);
  }

  function renderCategories() {
    renderCategoryTable();
    renderCategoryCards();
  }

  function renderCategoryTable() {
    const body = $("[data-categories-table-body]");

    clearElement(body);

    state.categories.forEach(function (category) {
      const row = document.createElement("tr");

      row.appendChild(createCategoryCell(category));
      row.appendChild(createColorCell(category));
      row.appendChild(createTextTableCell(category.targetDays ? formatNumber(category.targetDays) + " วัน" : "-"));
      row.appendChild(createTextTableCell(formatNumber(category.sortOrder)));
      row.appendChild(createStatusCell(category));
      row.appendChild(createActionsCell(category));

      body.appendChild(row);
    });
  }

  function createCategoryCell(category) {
    const cell = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "categories-item";
    const title = createTextElement("strong", "", category.name || "-");
    const code = createTextElement("span", "", category.code || "-");
    const description = createTextElement("small", "", category.description || "ไม่มีคำอธิบาย");
    const assignee = createTextElement("small", "", category.defaultAssignee ? "ผู้รับผิดชอบเริ่มต้น: " + category.defaultAssignee : "ยังไม่ตั้งผู้รับผิดชอบเริ่มต้น");

    wrap.appendChild(title);
    wrap.appendChild(code);
    wrap.appendChild(description);
    wrap.appendChild(assignee);
    cell.appendChild(wrap);

    return cell;
  }

  function createColorCell(category) {
    const cell = document.createElement("td");
    const wrap = document.createElement("span");
    const swatch = document.createElement("span");
    const label = document.createElement("span");
    const color = normalizeColor(category.color);

    wrap.className = "categories-color";
    swatch.className = "categories-color__swatch";
    swatch.style.backgroundColor = color;
    label.textContent = color;
    wrap.appendChild(swatch);
    wrap.appendChild(label);
    cell.appendChild(wrap);

    return cell;
  }

  function createStatusCell(category) {
    const cell = document.createElement("td");
    const badge = createTextElement("span", "categories-status categories-status--" + (category.isActive ? "active" : "inactive"), category.isActive ? STATUS_LABELS.active : STATUS_LABELS.inactive);

    cell.appendChild(badge);
    return cell;
  }

  function createActionsCell(category) {
    const cell = document.createElement("td");
    const actions = document.createElement("div");
    const editButton = document.createElement("button");

    actions.className = "categories-actions";
    editButton.className = "button button-secondary";
    editButton.type = "button";
    editButton.textContent = "แก้ไข";
    editButton.disabled = !state.permissions.canSave;
    editButton.addEventListener("click", function () {
      openEditor(category);
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

  function renderCategoryCards() {
    const list = $("[data-categories-card-list]");

    clearElement(list);

    state.categories.forEach(function (category) {
      const card = document.createElement("article");
      const header = document.createElement("div");
      const title = createTextElement("h3", "", category.name || "-");
      const code = createTextElement("span", "", category.code || "-");
      const meta = createTextElement("p", "", (category.targetDays ? "กำหนด " + formatNumber(category.targetDays) + " วัน" : "ไม่กำหนดวัน") + " · ลำดับ " + formatNumber(category.sortOrder));
      const description = createTextElement("p", "", category.description || "ไม่มีคำอธิบาย");
      const assignee = createTextElement("p", "", category.defaultAssignee ? "ผู้รับผิดชอบเริ่มต้น: " + category.defaultAssignee : "ยังไม่ตั้งผู้รับผิดชอบเริ่มต้น");
      const footer = document.createElement("div");
      const editButton = document.createElement("button");

      card.className = "categories-card";
      header.className = "categories-card__header";
      footer.className = "categories-card__footer";
      editButton.className = "button button-secondary";
      editButton.type = "button";
      editButton.textContent = "แก้ไข";
      editButton.disabled = !state.permissions.canSave;
      editButton.addEventListener("click", function () {
        openEditor(category);
      });

      header.appendChild(title);
      header.appendChild(code);
      footer.appendChild(createStatusBadge(category));
      footer.appendChild(editButton);
      card.appendChild(header);
      card.appendChild(createColorPreview(category));
      card.appendChild(meta);
      card.appendChild(description);
      card.appendChild(assignee);
      card.appendChild(footer);
      list.appendChild(card);
    });
  }

  function createStatusBadge(category) {
    return createTextElement("span", "categories-status categories-status--" + (category.isActive ? "active" : "inactive"), category.isActive ? STATUS_LABELS.active : STATUS_LABELS.inactive);
  }

  function createColorPreview(category) {
    const wrap = document.createElement("div");
    const swatch = document.createElement("span");
    const text = document.createElement("span");
    const color = normalizeColor(category.color);

    wrap.className = "categories-color";
    swatch.className = "categories-color__swatch";
    swatch.style.backgroundColor = color;
    text.textContent = color + " · " + (category.icon || "circle");
    wrap.appendChild(swatch);
    wrap.appendChild(text);

    return wrap;
  }

  function renderPagination(pagination) {
    const page = Number(pagination && pagination.page ? pagination.page : 1);
    const totalPages = Math.max(1, Number(pagination && pagination.totalPages ? pagination.totalPages : 1));
    const total = Number(pagination && pagination.total ? pagination.total : 0);
    const start = total === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1;
    const end = Math.min(total, page * PAGE_SIZE);

    setText("[data-categories-page-label]", "หน้า " + formatNumber(page) + " จาก " + formatNumber(totalPages));
    setText("[data-categories-pagination-summary]", "แสดง " + formatNumber(start) + "-" + formatNumber(end) + " จาก " + formatNumber(total) + " รายการ");

    const prevButton = $("[data-categories-prev]");
    const nextButton = $("[data-categories-next]");

    if (prevButton) {
      prevButton.disabled = page <= 1 || state.isLoading;
    }

    if (nextButton) {
      nextButton.disabled = page >= totalPages || state.isLoading;
    }
  }

  function openEditor(category) {
    const form = $("[data-categories-form]");

    if (!form || !state.permissions.canSave) {
      return;
    }

    state.selectedCategory = category || null;
    state.lastFocusedElement = document.activeElement;
    clearFormMessages();
    form.reset();

    const color = normalizeColor(category && category.color);
    form.elements.categoryId.value = category ? category.categoryId : "";
    form.elements.version.value = category ? category.version : "";
    form.elements.code.value = category ? category.code : "";
    form.elements.name.value = category ? category.name : "";
    form.elements.description.value = category ? category.description : "";
    form.elements.icon.value = category ? category.icon : "circle";
    form.elements.color.value = color;
    form.elements.colorText.value = color;
    form.elements.defaultAssignee.value = category ? category.defaultAssignee : "";
    form.elements.targetDays.value = category ? category.targetDays : 0;
    form.elements.sortOrder.value = category ? category.sortOrder : 0;
    form.elements.isActive.checked = category ? !!category.isActive : true;

    setText("[data-categories-editor-title]", category ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่");
    setHidden("[data-categories-editor]", false);
    document.body.classList.add("is-categories-modal-open");
    form.elements.code.focus();
  }

  function closeEditor() {
    setHidden("[data-categories-editor]", true);
    document.body.classList.remove("is-categories-modal-open");
    state.selectedCategory = null;

    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
      state.lastFocusedElement.focus();
    }
  }

  function clearFormMessages() {
    $all("[data-categories-form] [data-field-error]").forEach(function (element) {
      element.textContent = "";
    });
    setHidden("[data-categories-form-error]", true);
    setText("[data-categories-form-error]", "");
    setHidden("[data-categories-form-success]", true);
    setText("[data-categories-form-success]", "");
  }

  function showFieldErrors(fields) {
    Object.keys(fields || {}).forEach(function (fieldName) {
      const element = $("[data-categories-form] [data-field-error='" + fieldName + "']");

      if (element) {
        element.textContent = fields[fieldName];
      }
    });
  }

  function getFormPayload(form) {
    return {
      categoryId: form.elements.categoryId.value,
      version: form.elements.version.value ? Number(form.elements.version.value) : "",
      code: form.elements.code.value,
      name: form.elements.name.value,
      description: form.elements.description.value,
      icon: form.elements.icon.value || "circle",
      color: normalizeColor(form.elements.colorText.value || form.elements.color.value),
      defaultAssignee: form.elements.defaultAssignee.value,
      targetDays: Number(form.elements.targetDays.value || 0),
      sortOrder: Number(form.elements.sortOrder.value || 0),
      isActive: form.elements.isActive.checked
    };
  }

  function saveCategory(form) {
    const payload = getFormPayload(form);
    const original = state.selectedCategory;

    if (original && original.isActive && !payload.isActive) {
      openConfirm({
        title: "ยืนยันการปิดใช้งาน",
        message: "หมวดหมู่นี้จะไม่แสดงในแบบฟอร์มแจ้งปัญหาสาธารณะ แต่ข้อมูลเดิมจะยังคงอยู่",
        onConfirm: function () {
          submitSave(form, payload);
        }
      });
      return;
    }

    submitSave(form, payload);
  }

  function submitSave(form, payload) {
    const button = $("[data-categories-save]");

    clearFormMessages();

    if (button) {
      button.disabled = true;
      button.textContent = "กำลังบันทึก...";
    }

    window.KPR_API.write("admin.category.save", payload, {
      withSession: true
    }).then(function (response) {
      const data = response && response.data ? response.data : {};

      setHidden("[data-categories-form-success]", false);
      setText("[data-categories-form-success]", "บันทึกหมวดหมู่สำเร็จ");

      if (data.category) {
        state.selectedCategory = data.category;
      }

      return loadCategories().then(function () {
        closeEditor();
      });
    }).catch(function (error) {
      const fields = error && error.fields ? error.fields : {};

      showFieldErrors(fields);
      setHidden("[data-categories-form-error]", false);
      setText("[data-categories-form-error]", getErrorMessage(error));
    }).finally(function () {
      if (button) {
        button.disabled = false;
        button.textContent = "บันทึก";
      }
    });
  }

  function openConfirm(options) {
    state.confirmAction = options && typeof options.onConfirm === "function" ? options.onConfirm : null;
    setText("[data-categories-confirm-title]", options && options.title ? options.title : "ยืนยันการดำเนินการ");
    setText("[data-categories-confirm-message]", options && options.message ? options.message : "");
    setHidden("[data-categories-confirm]", false);
    document.body.classList.add("is-categories-modal-open");
  }

  function closeConfirm() {
    state.confirmAction = null;
    setHidden("[data-categories-confirm]", true);

    if ($("[data-categories-editor]") && $("[data-categories-editor]").hidden) {
      document.body.classList.remove("is-categories-modal-open");
    }
  }

  function clearFilters() {
    state.query = {
      page: 1,
      pageSize: PAGE_SIZE,
      keyword: "",
      includeInactive: false
    };
    syncFiltersFromState();
    loadCategories();
  }

  function bindEvents() {
    const form = $("[data-categories-filter-form]");
    const editorForm = $("[data-categories-form]");
    const colorInput = $("[data-categories-form] input[name='color']");
    const colorTextInput = $("[data-categories-form] input[name='colorText']");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        state.query.page = 1;
        state.query.keyword = form.elements.keyword.value.trim();
        state.query.includeInactive = form.elements.includeInactive.checked;
        loadCategories();
      });

      form.elements.keyword.addEventListener("input", function () {
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(function () {
          state.query.page = 1;
          state.query.keyword = form.elements.keyword.value.trim();
          loadCategories();
        }, SEARCH_DEBOUNCE_MS);
      });

      form.elements.includeInactive.addEventListener("change", function () {
        state.query.page = 1;
        state.query.includeInactive = form.elements.includeInactive.checked;
        loadCategories();
      });
    }

    if (editorForm) {
      editorForm.addEventListener("submit", function (event) {
        event.preventDefault();
        saveCategory(editorForm);
      });
    }

    if (colorInput && colorTextInput) {
      colorInput.addEventListener("input", function () {
        colorTextInput.value = colorInput.value;
      });
      colorTextInput.addEventListener("input", function () {
        if (/^#[0-9A-Fa-f]{6}$/.test(colorTextInput.value)) {
          colorInput.value = colorTextInput.value;
        }
      });
    }

    $all("[data-categories-clear], [data-categories-empty-clear]").forEach(function (button) {
      button.addEventListener("click", clearFilters);
    });

    const retryButton = $("[data-categories-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", loadCategories);
    }

    const createButton = $("[data-categories-create]");
    if (createButton) {
      createButton.addEventListener("click", function () {
        openEditor(null);
      });
    }

    const prevButton = $("[data-categories-prev]");
    const nextButton = $("[data-categories-next]");

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        if (state.query.page > 1) {
          state.query.page -= 1;
          loadCategories();
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        const totalPages = Math.max(1, Number(state.pagination.totalPages || 1));

        if (state.query.page < totalPages) {
          state.query.page += 1;
          loadCategories();
        }
      });
    }

    $all("[data-categories-editor-close], [data-categories-editor-cancel]").forEach(function (button) {
      button.addEventListener("click", closeEditor);
    });

    $all("[data-categories-confirm-cancel], [data-categories-confirm-back]").forEach(function (button) {
      button.addEventListener("click", closeConfirm);
    });

    const confirmOk = $("[data-categories-confirm-ok]");
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
      loadCategories();
    });
  }

  async function init() {
    document.documentElement.dataset.adminPage = "categories";
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

      if (!canManageCategories()) {
        showForbidden();
        return;
      }

      state.permissions = {
        canRead: true,
        canSave: true
      };
      loadCategories();
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
