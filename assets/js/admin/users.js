(function () {
  "use strict";

  const PAGE_SIZE = 20;
  const SEARCH_DEBOUNCE_MS = 500;
  const ROLE_LABELS = Object.freeze({
    super_admin: "Super Admin",
    admin: "Admin",
    officer: "เจ้าหน้าที่",
    viewer: "ผู้ดูข้อมูล"
  });
  const STATUS_LABELS = Object.freeze({
    active: "ใช้งาน",
    inactive: "ปิดใช้งาน"
  });

  const state = {
    currentUser: null,
    users: [],
    selectedUser: null,
    permissions: {
      canRead: false,
      canSave: false,
      canResetPassword: false,
      canRevokeSessions: false
    },
    query: {
      page: 1,
      pageSize: PAGE_SIZE,
      keyword: "",
      role: "",
      status: ""
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

  function canManageUsers() {
    return hasPermission(state.currentUser, "user.manage");
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

  function getRoleLabel(role) {
    return ROLE_LABELS[role] || role || "-";
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status || "-";
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

  function updateCreateButton() {
    const button = $("[data-users-create]");

    if (!button) {
      return;
    }

    button.disabled = state.isLoading || !state.permissions.canSave;
    button.hidden = !state.permissions.canSave;
  }

  function setControlsDisabled(isDisabled) {
    $all("[data-users-filter-form] input, [data-users-filter-form] select, [data-users-filter-form] button, [data-users-prev], [data-users-next], [data-users-retry], [data-users-empty-clear]").forEach(function (element) {
      element.disabled = !!isDisabled;
    });
    updateCreateButton();
  }

  function setLoading(isLoading) {
    state.isLoading = !!isLoading;
    setHidden("[data-users-loading]", !isLoading);
    setHidden("[data-users-error]", true);
    setHidden("[data-users-empty]", true);
    setHidden("[data-users-content]", true);
    setControlsDisabled(isLoading);
  }

  function showForbidden() {
    state.isLoading = false;
    setHidden("[data-users-forbidden]", false);
    setHidden("[data-users-loading]", true);
    setHidden("[data-users-error]", true);
    setHidden("[data-users-empty]", true);
    setHidden("[data-users-content]", true);
    const form = $("[data-users-filter-form]");
    if (form) {
      form.hidden = true;
    }
    updateCreateButton();
  }

  function showError(error) {
    state.isLoading = false;
    setHidden("[data-users-loading]", true);
    setHidden("[data-users-content]", true);
    setHidden("[data-users-empty]", true);
    setHidden("[data-users-error]", false);
    setText("[data-users-error-message]", getErrorMessage(error));
    setControlsDisabled(false);
  }

  function showEmpty() {
    state.isLoading = false;
    setHidden("[data-users-loading]", true);
    setHidden("[data-users-content]", true);
    setHidden("[data-users-error]", true);
    setHidden("[data-users-empty]", false);
    setControlsDisabled(false);
  }

  function showContent() {
    state.isLoading = false;
    setHidden("[data-users-loading]", true);
    setHidden("[data-users-error]", true);
    setHidden("[data-users-empty]", true);
    setHidden("[data-users-content]", false);
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
      role: String(params.get("role") || ""),
      status: String(params.get("status") || "")
    };
  }

  function syncUrl(replace) {
    const params = new URLSearchParams();

    ["page", "keyword", "role", "status"].forEach(function (key) {
      const value = state.query[key];
      const isDefaultPage = key === "page" && Number(value) === 1;

      if (value === undefined || value === null || String(value) === "" || isDefaultPage) {
        return;
      }

      params.set(key, String(value));
    });

    const nextUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");

    if (replace) {
      window.history.replaceState({}, "", nextUrl);
      return;
    }

    window.history.pushState({}, "", nextUrl);
  }

  function setFormValues() {
    const form = $("[data-users-filter-form]");

    if (!form) {
      return;
    }

    form.elements.keyword.value = state.query.keyword;
    form.elements.role.value = state.query.role;
    form.elements.status.value = state.query.status;
  }

  function readFormValues() {
    const form = $("[data-users-filter-form]");

    if (!form) {
      return state.query;
    }

    return {
      page: state.query.page,
      pageSize: PAGE_SIZE,
      keyword: String(form.elements.keyword.value || "").trim(),
      role: String(form.elements.role.value || ""),
      status: String(form.elements.status.value || "")
    };
  }

  function renderStatusChip(status) {
    const className = status === "active" ? "status-chip status-chip-success" : "status-chip status-chip-warning";
    return createTextElement("span", className, getStatusLabel(status));
  }

  function renderUserIdentity(item) {
    const wrap = document.createElement("div");
    wrap.className = "users-identity";
    wrap.appendChild(createTextElement("strong", "", item.displayName || item.username || "-"));
    wrap.appendChild(createTextElement("span", "", item.username || "-"));

    const contacts = [item.email, item.phone].filter(Boolean).join(" | ");
    if (contacts) {
      wrap.appendChild(createTextElement("small", "", contacts));
    }

    return wrap;
  }

  function createActionButton(label, action, item, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className || "button button-secondary";
    button.textContent = label;
    button.dataset.userId = item.userId || "";
    button.dataset.userAction = action;
    return button;
  }

  function renderUserActions(item) {
    const actions = document.createElement("div");
    actions.className = "users-actions";

    if (state.permissions.canSave) {
      actions.appendChild(createActionButton("แก้ไข", "edit", item, "button button-secondary"));
    }

    if (state.permissions.canResetPassword) {
      actions.appendChild(createActionButton("รีเซ็ตรหัส", "reset", item, "button button-secondary"));
    }

    if (state.permissions.canRevokeSessions) {
      actions.appendChild(createActionButton("ยกเลิก Sessions", "revoke", item, "button button-danger"));
    }

    if (!actions.firstChild) {
      actions.appendChild(createTextElement("span", "users-muted", "อ่านอย่างเดียว"));
    }

    return actions;
  }

  function renderTable(items) {
    const body = $("[data-users-table-body]");

    clearElement(body);

    (items || []).forEach(function (item) {
      const row = document.createElement("tr");
      const identityCell = document.createElement("td");
      const statusCell = document.createElement("td");
      const actionCell = document.createElement("td");

      identityCell.appendChild(renderUserIdentity(item));
      statusCell.appendChild(renderStatusChip(item.status));
      actionCell.appendChild(renderUserActions(item));

      row.appendChild(identityCell);
      row.appendChild(createTextElement("td", "", getRoleLabel(item.role)));
      row.appendChild(statusCell);
      row.appendChild(createTextElement("td", "", formatDateTime(item.lastLoginAt)));
      row.appendChild(createTextElement("td", "", item.mustChangePassword ? "ต้องเปลี่ยน" : "ไม่บังคับ"));
      row.appendChild(actionCell);

      body.appendChild(row);
    });
  }

  function renderCards(items) {
    const list = $("[data-users-card-list]");

    clearElement(list);

    (items || []).forEach(function (item) {
      const card = document.createElement("article");
      const header = document.createElement("div");
      const meta = document.createElement("div");

      card.className = "users-card";
      header.className = "users-card__header";
      meta.className = "users-card__meta";

      header.appendChild(renderUserIdentity(item));
      header.appendChild(renderStatusChip(item.status));
      card.appendChild(header);

      meta.appendChild(createTextElement("span", "", "บทบาท: " + getRoleLabel(item.role)));
      meta.appendChild(createTextElement("span", "", "เข้าสู่ระบบล่าสุด: " + formatDateTime(item.lastLoginAt)));
      meta.appendChild(createTextElement("span", "", item.mustChangePassword ? "ต้องเปลี่ยนรหัสผ่าน" : "ไม่บังคับเปลี่ยนรหัส"));
      card.appendChild(meta);
      card.appendChild(renderUserActions(item));

      list.appendChild(card);
    });
  }

  function renderPagination(pagination) {
    const safePagination = pagination || {};
    const page = Number(safePagination.page || 1);
    const pageSize = Number(safePagination.pageSize || PAGE_SIZE);
    const total = Number(safePagination.total || 0);
    const totalPages = Math.max(Number(safePagination.totalPages || 1), 1);
    const start = total === 0 ? 0 : ((page - 1) * pageSize) + 1;
    const end = Math.min(page * pageSize, total);
    const prev = $("[data-users-prev]");
    const next = $("[data-users-next]");

    state.pagination = {
      page: page,
      pageSize: pageSize,
      total: total,
      totalPages: totalPages
    };
    state.query.page = page;

    setText("[data-users-page-label]", "หน้า " + formatNumber(page) + " จาก " + formatNumber(totalPages));
    setText("[data-users-pagination-summary]", "แสดง " + formatNumber(start) + "-" + formatNumber(end) + " จาก " + formatNumber(total) + " คน");

    if (prev) {
      prev.disabled = page <= 1 || state.isLoading;
    }

    if (next) {
      next.disabled = page >= totalPages || state.isLoading;
    }
  }

  function renderUsers(data) {
    const safeData = data || {};
    const items = Array.isArray(safeData.items) ? safeData.items : [];

    state.users = items;
    if (safeData.permissions) {
      state.permissions = Object.assign({}, state.permissions, safeData.permissions);
    }

    setText("[data-users-updated-at]", formatDateTime(new Date().toISOString()));
    renderPagination(safeData.pagination);

    if (items.length === 0) {
      showEmpty();
      return;
    }

    renderTable(items);
    renderCards(items);
    showContent();
  }

  async function loadUsers(replaceUrl) {
    if (!window.KPR_API) {
      showError({ code: "NETWORK_ERROR" });
      return;
    }

    setLoading(true);
    syncUrl(!!replaceUrl);

    try {
      const result = await window.KPR_API.read("admin.user.list", state.query, {
        withSession: true
      });
      renderUsers(result.data || {});
    } catch (error) {
      if (error && error.code === "FORBIDDEN") {
        showForbidden();
        return;
      }

      showError(error);
    }
  }

  function findUser(userId) {
    return state.users.filter(function (item) {
      return String(item.userId || "") === String(userId || "");
    })[0] || null;
  }

  function resetFieldErrors(form) {
    $all("[data-field-error]").forEach(function (element) {
      element.textContent = "";
    });

    Array.prototype.forEach.call(form.elements, function (field) {
      if (field && field.removeAttribute) {
        field.removeAttribute("aria-invalid");
      }
    });
  }

  function showFieldErrors(form, fields) {
    Object.keys(fields || {}).forEach(function (fieldName) {
      const message = fields[fieldName];
      const errorElement = form.querySelector('[data-field-error="' + fieldName + '"]');
      const input = form.elements[fieldName];

      setText(errorElement, message);

      if (input) {
        input.setAttribute("aria-invalid", "true");
      }
    });

    const firstField = Object.keys(fields || {})[0];
    if (firstField && form.elements[firstField]) {
      form.elements[firstField].focus();
    }
  }

  function setModalOpen(selector, isOpen) {
    const modal = $(selector);

    if (!modal) {
      return;
    }

    if (isOpen) {
      state.lastFocusedElement = document.activeElement;
      modal.hidden = false;
      document.body.classList.add("is-users-modal-open");
      const focusTarget = modal.querySelector("input, select, button, textarea");
      if (focusTarget) {
        focusTarget.focus();
      }
      return;
    }

    modal.hidden = true;
    if (!$all(".users-modal-backdrop").some(function (item) {
      return !item.hidden;
    })) {
      document.body.classList.remove("is-users-modal-open");
    }
    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
      state.lastFocusedElement.focus();
    }
  }

  function setFormLoading(isLoading) {
    const form = $("[data-users-form]");
    const submitButton = $("[data-users-save]");

    if (form) {
      form.setAttribute("aria-busy", isLoading ? "true" : "false");
      Array.prototype.forEach.call(form.querySelectorAll("input, select, button"), function (element) {
        element.disabled = !!isLoading;
      });
    }

    if (submitButton) {
      submitButton.textContent = isLoading ? "กำลังบันทึก..." : "บันทึก";
    }
  }

  function openEditor(user) {
    const form = $("[data-users-form]");
    const isEdit = !!(user && user.userId);

    if (!form) {
      return;
    }

    state.selectedUser = user || null;
    form.reset();
    resetFieldErrors(form);
    setHidden("[data-users-form-error]", true);
    setHidden("[data-users-form-success]", true);
    setText("[data-users-editor-title]", isEdit ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน");
    setHidden("[data-temp-password-field]", isEdit);

    form.elements.userId.value = isEdit ? user.userId : "";
    form.elements.version.value = isEdit ? user.version : "";
    form.elements.username.value = isEdit ? user.username || "" : "";
    form.elements.displayName.value = isEdit ? user.displayName || "" : "";
    form.elements.email.value = isEdit ? user.email || "" : "";
    form.elements.phone.value = isEdit ? user.phone || "" : "";
    form.elements.role.value = isEdit ? user.role || "viewer" : "viewer";
    form.elements.status.value = isEdit ? user.status || "active" : "active";
    form.elements.mustChangePassword.checked = isEdit ? !!user.mustChangePassword : true;
    form.elements.temporaryPassword.value = "";

    setModalOpen("[data-users-editor]", true);
  }

  function closeEditor() {
    setFormLoading(false);
    setModalOpen("[data-users-editor]", false);
  }

  function validateUserForm(form) {
    const fields = {};
    const username = String(form.elements.username.value || "").trim().toLowerCase();
    const displayName = String(form.elements.displayName.value || "").trim();
    const email = String(form.elements.email.value || "").trim();
    const temporaryPassword = String(form.elements.temporaryPassword.value || "");

    if (!username) {
      fields.username = "กรุณากรอกชื่อผู้ใช้";
    } else if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
      fields.username = "ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง 3-40 ตัว";
    }

    if (!displayName) {
      fields.displayName = "กรุณากรอกชื่อแสดง";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fields.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!form.elements.userId.value && temporaryPassword) {
      if (temporaryPassword.length < 8 || !/[A-Za-z]/.test(temporaryPassword) || !/[0-9]/.test(temporaryPassword)) {
        fields.temporaryPassword = "รหัสชั่วคราวต้องมีอย่างน้อย 8 ตัว และมีทั้งตัวอักษรกับตัวเลข";
      }
    }

    return {
      ok: Object.keys(fields).length === 0,
      fields: fields,
      payload: {
        userId: String(form.elements.userId.value || ""),
        username: username,
        displayName: displayName,
        email: email,
        phone: String(form.elements.phone.value || "").trim(),
        role: String(form.elements.role.value || "viewer"),
        status: String(form.elements.status.value || "active"),
        temporaryPassword: temporaryPassword,
        mustChangePassword: !!form.elements.mustChangePassword.checked,
        version: form.elements.version.value ? Number(form.elements.version.value) : 0
      }
    };
  }

  function showTemporaryPassword(password, contextText) {
    const message = contextText + " รหัสผ่านชั่วคราว: " + password + " โปรดส่งให้ผู้ใช้อย่างปลอดภัย ระบบจะไม่แสดงรหัสผ่านเดิม";
    const success = $("[data-users-form-success]");

    setText(success, message);
    setHidden(success, false);
  }

  async function saveUser(payload) {
    const result = await window.KPR_API.write("admin.user.save", payload, {
      withSession: true
    });
    const savedUser = result.data && result.data.user ? result.data.user : null;
    const temporaryPassword = result.data && result.data.temporaryPassword ? result.data.temporaryPassword : "";

    if (savedUser) {
      const form = $("[data-users-form]");

      state.selectedUser = savedUser;
      if (form) {
        form.elements.userId.value = savedUser.userId || "";
        form.elements.version.value = savedUser.version || "";
        form.elements.temporaryPassword.value = "";
      }
      setText("[data-users-editor-title]", "แก้ไขผู้ใช้งาน");
      setHidden("[data-temp-password-field]", true);
    }

    if (temporaryPassword) {
      showTemporaryPassword(temporaryPassword, "สร้างผู้ใช้งานสำเร็จ");
      await loadUsers(true);
      return;
    }

    closeEditor();
    await loadUsers(true);
  }

  async function handleUserSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const validation = validateUserForm(form);

    resetFieldErrors(form);
    setHidden("[data-users-form-error]", true);
    setHidden("[data-users-form-success]", true);

    if (!validation.ok) {
      showFieldErrors(form, validation.fields);
      return;
    }

    if (state.selectedUser && state.selectedUser.status === "active" && validation.payload.status === "inactive") {
      openConfirm(
        "ปิดใช้งานผู้ใช้งาน",
        "ต้องการปิดใช้งานบัญชีนี้หรือไม่ ผู้ใช้งานจะไม่สามารถเข้าสู่ระบบได้",
        function () {
          submitUserPayload(validation.payload);
        }
      );
      return;
    }

    submitUserPayload(validation.payload);
  }

  async function submitUserPayload(payload) {
    const form = $("[data-users-form]");

    setFormLoading(true);

    try {
      await saveUser(payload);
    } catch (error) {
      if (error && error.fields) {
        showFieldErrors(form, error.fields);
      }
      setText("[data-users-form-error]", getErrorMessage(error));
      setHidden("[data-users-form-error]", false);
    } finally {
      setFormLoading(false);
    }
  }

  function openConfirm(title, message, action) {
    state.confirmAction = action;
    setText("[data-users-confirm-title]", title);
    setText("[data-users-confirm-message]", message);
    setModalOpen("[data-users-confirm]", true);
  }

  function closeConfirm() {
    state.confirmAction = null;
    setModalOpen("[data-users-confirm]", false);
  }

  async function resetPassword(user) {
    try {
      const result = await window.KPR_API.write("admin.user.resetPassword", {
        userId: user.userId,
        version: user.version,
        revokeSessions: true
      }, {
        withSession: true
      });
      const password = result.data && result.data.temporaryPassword ? result.data.temporaryPassword : "";

      openEditor(result.data && result.data.user ? result.data.user : user);
      if (password) {
        showTemporaryPassword(password, "รีเซ็ตรหัสผ่านสำเร็จ");
      }
      await loadUsers(true);
    } catch (error) {
      showError(error);
    }
  }

  async function revokeSessions(user) {
    try {
      await window.KPR_API.write("admin.user.revokeSessions", {
        userId: user.userId,
        version: user.version,
        reason: "admin_revoked"
      }, {
        withSession: true
      });
      await loadUsers(true);
    } catch (error) {
      showError(error);
    }
  }

  function handleUserAction(event) {
    const button = event.target.closest("[data-user-action]");

    if (!button) {
      return;
    }

    const user = findUser(button.dataset.userId);

    if (!user) {
      return;
    }

    if (button.dataset.userAction === "edit") {
      openEditor(user);
      return;
    }

    if (button.dataset.userAction === "reset") {
      openConfirm(
        "รีเซ็ตรหัสผ่าน",
        "ต้องการสร้างรหัสผ่านชั่วคราวใหม่ให้ " + (user.displayName || user.username) + " หรือไม่ ระบบจะไม่แสดงรหัสผ่านเดิม",
        function () {
          resetPassword(user);
        }
      );
      return;
    }

    if (button.dataset.userAction === "revoke") {
      openConfirm(
        "ยกเลิก Sessions",
        "ต้องการยกเลิก Sessions ทั้งหมดของ " + (user.displayName || user.username) + " หรือไม่",
        function () {
          revokeSessions(user);
        }
      );
    }
  }

  function applyQueryFromForm() {
    state.query = readFormValues();
    state.query.page = 1;
    loadUsers(false);
  }

  function clearFilters() {
    state.query = {
      page: 1,
      pageSize: PAGE_SIZE,
      keyword: "",
      role: "",
      status: ""
    };
    setFormValues();
    loadUsers(false);
  }

  function goToPage(page) {
    const totalPages = Math.max(state.pagination.totalPages || 1, 1);
    state.query.page = Math.min(Math.max(page, 1), totalPages);
    loadUsers(false);
  }

  function bindEvents() {
    const form = $("[data-users-filter-form]");
    const keyword = $("#users-keyword");
    const usersForm = $("[data-users-form]");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        applyQueryFromForm();
      });
      $("#users-role").addEventListener("change", applyQueryFromForm);
      $("#users-status").addEventListener("change", applyQueryFromForm);
    }

    if (keyword) {
      keyword.addEventListener("input", function () {
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(applyQueryFromForm, SEARCH_DEBOUNCE_MS);
      });
    }

    if (usersForm) {
      usersForm.addEventListener("submit", handleUserSubmit);
    }

    $("[data-users-create]").addEventListener("click", function () {
      openEditor(null);
    });
    $("[data-users-clear]").addEventListener("click", clearFilters);
    $("[data-users-empty-clear]").addEventListener("click", clearFilters);
    $("[data-users-retry]").addEventListener("click", function () {
      loadUsers(true);
    });
    $("[data-users-prev]").addEventListener("click", function () {
      goToPage(state.query.page - 1);
    });
    $("[data-users-next]").addEventListener("click", function () {
      goToPage(state.query.page + 1);
    });
    $("[data-users-content]").addEventListener("click", handleUserAction);
    $("[data-users-editor-close]").addEventListener("click", closeEditor);
    $("[data-users-editor-cancel]").addEventListener("click", closeEditor);
    $("[data-users-confirm-cancel]").addEventListener("click", closeConfirm);
    $("[data-users-confirm-back]").addEventListener("click", closeConfirm);
    $("[data-users-confirm-ok]").addEventListener("click", function () {
      const action = state.confirmAction;
      closeConfirm();
      if (typeof action === "function") {
        action();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeConfirm();
        closeEditor();
      }
    });

    window.addEventListener("popstate", function () {
      state.query = readQueryFromUrl();
      setFormValues();
      loadUsers(true);
    });
  }

  async function init() {
    document.documentElement.dataset.adminPage = "users";
    bindEvents();

    if (!window.KPR_AUTH || typeof window.KPR_AUTH.requireAdminSession !== "function") {
      showError({ code: "UNAUTHORIZED" });
      return;
    }

    state.currentUser = await window.KPR_AUTH.requireAdminSession();
    if (!state.currentUser) {
      return;
    }

    if (!canManageUsers()) {
      showForbidden();
      return;
    }

    state.permissions = {
      canRead: true,
      canSave: true,
      canResetPassword: true,
      canRevokeSessions: true
    };
    state.query = readQueryFromUrl();
    setFormValues();
    loadUsers(true);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
