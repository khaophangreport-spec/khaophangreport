(function () {
  "use strict";

  const GROUP_TITLES = Object.freeze({
    general: "ข้อมูลระบบ",
    contact: "ข้อมูลติดต่อและฉุกเฉิน",
    upload: "ข้อจำกัดการอัปโหลด",
    privacy: "นโยบายและข้อตกลง",
    system: "ระบบและการดูแล"
  });
  const KEY_HELP = Object.freeze({
    app_name: "ชื่อภาษาอังกฤษที่ใช้ใน config สาธารณะ",
    app_name_th: "ชื่อภาษาไทยที่ประชาชนเห็นบนหน้าเว็บ",
    site_url: "URL หลักของเว็บไซต์",
    contact_email: "อีเมลที่ประชาชนใช้ติดต่อโครงการ",
    contact_phone: "เบอร์โทรสำหรับสอบถามทั่วไป",
    office_hours: "เวลาทำการหรือช่วงเวลาที่ติดต่อได้",
    emergency_contacts: "ช่องทางด่วนที่จะแสดงต่อประชาชน",
    max_images: "จำนวนรูปสูงสุดต่อการแจ้งหนึ่งเรื่อง",
    max_image_size_mb: "ขนาดรูปหลังบีบอัดต่อรูป",
    max_image_dimension: "ด้านยาวสูงสุดของรูปภาพ",
    default_page_size: "จำนวนรายการเริ่มต้นในหน้ารายการ",
    privacy_version: "เวอร์ชันนโยบายที่ผู้แจ้งต้องยอมรับ",
    terms_version: "เวอร์ชันเงื่อนไขการใช้งาน",
    maintenance_mode: "เมื่อเปิด ระบบสาธารณะควรแสดงสถานะปิดปรับปรุง",
    schema_version: "อ่านอย่างเดียว ใช้ดูเวอร์ชันโครงสร้างข้อมูล"
  });
  const RISKY_LABELS = Object.freeze({
    emergency_contacts: "ช่องทางฉุกเฉิน",
    max_images: "จำนวนรูปสูงสุด",
    max_image_size_mb: "ขนาดรูปสูงสุด",
    max_image_dimension: "ขนาดภาพสูงสุด",
    privacy_version: "เวอร์ชันนโยบายความเป็นส่วนตัว",
    terms_version: "เวอร์ชันเงื่อนไขการใช้งาน",
    maintenance_mode: "โหมดปิดปรับปรุง"
  });

  const state = {
    currentUser: null,
    items: [],
    byKey: {},
    originalValues: {},
    permissions: {
      canRead: false,
      canUpdate: false
    },
    riskyKeys: [],
    isLoading: false,
    pendingPayload: null
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

  function canManageSettings() {
    return hasPermission(state.currentUser, "settings.manage");
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
    if (error && error.code === "VERSION_CONFLICT") {
      return "ข้อมูลถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดรายการใหม่แล้วลองอีกครั้ง";
    }

    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return "ไม่สามารถเชื่อมต่อระบบได้";
  }

  function setControlsDisabled(isDisabled) {
    $all("[data-settings-form] input, [data-settings-form] textarea, [data-settings-form] button, [data-settings-retry], [data-settings-save-top]").forEach(function (element) {
      element.disabled = !!isDisabled || (element.dataset.settingReadOnly === "true");
    });
  }

  function setLoading(isLoading) {
    state.isLoading = !!isLoading;
    setHidden("[data-settings-loading]", !isLoading);
    setHidden("[data-settings-error]", true);
    setHidden("[data-settings-empty]", true);
    setHidden("[data-settings-form]", true);
    setControlsDisabled(isLoading);
  }

  function showForbidden() {
    state.isLoading = false;
    setHidden("[data-settings-forbidden]", false);
    setHidden("[data-settings-loading]", true);
    setHidden("[data-settings-error]", true);
    setHidden("[data-settings-empty]", true);
    setHidden("[data-settings-form]", true);
    setControlsDisabled(false);
  }

  function showError(error) {
    state.isLoading = false;
    setHidden("[data-settings-loading]", true);
    setHidden("[data-settings-empty]", true);
    setHidden("[data-settings-form]", true);
    setHidden("[data-settings-error]", false);
    setText("[data-settings-error-message]", getErrorMessage(error));
    setControlsDisabled(false);
  }

  function showEmpty() {
    state.isLoading = false;
    setHidden("[data-settings-loading]", true);
    setHidden("[data-settings-error]", true);
    setHidden("[data-settings-form]", true);
    setHidden("[data-settings-empty]", false);
    setControlsDisabled(false);
  }

  function showContent() {
    state.isLoading = false;
    setHidden("[data-settings-loading]", true);
    setHidden("[data-settings-error]", true);
    setHidden("[data-settings-empty]", true);
    setHidden("[data-settings-form]", false);
    setControlsDisabled(false);
    updateSaveButtons();
  }

  function updateSaveButtons() {
    const disabled = state.isLoading || !state.permissions.canUpdate || getChangedItems().length === 0;

    $all("[data-settings-save], [data-settings-save-top], [data-settings-reset]").forEach(function (button) {
      button.disabled = disabled && button.matches("[data-settings-save], [data-settings-save-top]");
      if (button.matches("[data-settings-reset]")) {
        button.disabled = state.isLoading || getChangedItems().length === 0;
      }
    });
  }

  function loadSettings() {
    if (!window.KPR_API) {
      showError(new Error("API is not ready"));
      return Promise.resolve();
    }

    if (!canManageSettings()) {
      state.permissions = {
        canRead: false,
        canUpdate: false
      };
      showForbidden();
      return Promise.resolve();
    }

    setHidden("[data-settings-forbidden]", true);
    setLoading(true);

    return window.KPR_API.read("admin.settings.get", {}, {
      withSession: true
    }).then(function (response) {
      const data = response && response.data ? response.data : {};

      state.items = Array.isArray(data.items) ? data.items.filter(Boolean) : [];
      state.permissions = data.permissions || {
        canRead: true,
        canUpdate: canManageSettings()
      };
      state.riskyKeys = Array.isArray(data.riskyKeys) ? data.riskyKeys : [];
      state.byKey = {};
      state.originalValues = {};
      state.items.forEach(function (item) {
        state.byKey[item.key] = item;
        state.originalValues[item.key] = serializeValueForCompare(item.value, item.type);
      });

      renderSettings();
      setText("[data-settings-updated-at]", getLatestUpdatedAt());

      if (state.items.length === 0) {
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

  function getLatestUpdatedAt() {
    const latest = state.items.map(function (item) {
      return item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    }).filter(function (time) {
      return isFinite(time) && time > 0;
    }).sort(function (a, b) {
      return b - a;
    })[0];

    return latest ? formatDateTime(new Date(latest).toISOString()) : "-";
  }

  function renderSettings() {
    const container = $("[data-settings-groups]");

    clearElement(container);

    groupItems(state.items).forEach(function (group) {
      container.appendChild(createGroupSection(group));
    });
  }

  function groupItems(items) {
    const groups = {};

    (items || []).forEach(function (item) {
      const groupName = item.groupName || "general";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(item);
    });

    return Object.keys(GROUP_TITLES).filter(function (groupName) {
      return groups[groupName] && groups[groupName].length > 0;
    }).map(function (groupName) {
      return {
        groupName: groupName,
        title: GROUP_TITLES[groupName] || groupName,
        items: groups[groupName]
      };
    });
  }

  function createGroupSection(group) {
    const section = document.createElement("section");
    const header = document.createElement("div");
    const title = createTextElement("h2", "", group.title);
    const count = createTextElement("span", "", group.items.length + " ค่า");

    section.className = "settings-group";
    header.className = "settings-group__header";
    header.appendChild(title);
    header.appendChild(count);
    section.appendChild(header);

    group.items.forEach(function (item) {
      section.appendChild(createSettingField(item));
    });

    return section;
  }

  function createSettingField(item) {
    const wrap = document.createElement("div");
    const labelWrap = document.createElement("div");
    const label = document.createElement("label");
    const badges = document.createElement("div");
    const help = createTextElement("p", "settings-field__help", KEY_HELP[item.key] || item.description || "");
    const control = createControl(item);
    const error = createTextElement("small", "settings-field__error", "");

    wrap.className = "settings-field";
    wrap.dataset.settingKey = item.key;
    labelWrap.className = "settings-field__label";
    badges.className = "settings-field__badges";
    label.htmlFor = "setting-" + item.key;
    label.textContent = item.label || item.key;
    error.dataset.settingError = item.key;

    badges.appendChild(createBadge(item.isPublic ? "Public" : "Private", item.isPublic ? "public" : "private"));
    if (item.isRisky) {
      badges.appendChild(createBadge("ต้องยืนยัน", "risky"));
    }
    if (item.isReadOnly || !state.permissions.canUpdate) {
      badges.appendChild(createBadge("อ่านอย่างเดียว", "readonly"));
    }

    labelWrap.appendChild(label);
    labelWrap.appendChild(badges);
    wrap.appendChild(labelWrap);
    wrap.appendChild(help);
    wrap.appendChild(control);
    wrap.appendChild(error);

    return wrap;
  }

  function createBadge(text, variant) {
    return createTextElement("span", "settings-badge settings-badge--" + variant, text);
  }

  function createControl(item) {
    if (item.key === "emergency_contacts") {
      return createEmergencyEditor(item);
    }

    if (item.type === "boolean") {
      return createBooleanControl(item);
    }

    if (item.type === "number") {
      return createNumberControl(item);
    }

    return createTextControl(item);
  }

  function createTextControl(item) {
    const input = document.createElement("input");

    input.className = "form-control";
    input.id = "setting-" + item.key;
    input.name = item.key;
    input.type = item.key === "contact_email" ? "email" : "text";
    input.value = item.value === undefined || item.value === null ? "" : String(item.value);
    input.disabled = item.isReadOnly || !state.permissions.canUpdate;
    input.dataset.settingType = item.type;
    input.dataset.settingVersion = String(item.version || 0);
    input.dataset.settingReadOnly = item.isReadOnly ? "true" : "false";
    input.addEventListener("input", updateSaveButtons);

    return input;
  }

  function createNumberControl(item) {
    const input = document.createElement("input");

    input.className = "form-control";
    input.id = "setting-" + item.key;
    input.name = item.key;
    input.type = "number";
    input.step = "1";
    input.value = item.value === undefined || item.value === null ? "" : String(item.value);
    input.disabled = item.isReadOnly || !state.permissions.canUpdate;
    input.dataset.settingType = item.type;
    input.dataset.settingVersion = String(item.version || 0);
    input.dataset.settingReadOnly = item.isReadOnly ? "true" : "false";
    input.addEventListener("input", updateSaveButtons);

    return input;
  }

  function createBooleanControl(item) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = createTextElement("span", "", "เปิดใช้งาน");

    label.className = "settings-toggle";
    input.id = "setting-" + item.key;
    input.name = item.key;
    input.type = "checkbox";
    input.checked = item.value === true;
    input.disabled = item.isReadOnly || !state.permissions.canUpdate;
    input.dataset.settingType = item.type;
    input.dataset.settingVersion = String(item.version || 0);
    input.dataset.settingReadOnly = item.isReadOnly ? "true" : "false";
    input.addEventListener("change", updateSaveButtons);
    label.appendChild(input);
    label.appendChild(text);

    return label;
  }

  function createEmergencyEditor(item) {
    const wrap = document.createElement("div");
    const list = document.createElement("div");
    const addButton = document.createElement("button");
    const contacts = Array.isArray(item.value) ? item.value : [];

    wrap.className = "settings-emergency";
    wrap.id = "setting-" + item.key;
    wrap.dataset.settingJson = item.key;
    wrap.dataset.settingType = item.type;
    wrap.dataset.settingVersion = String(item.version || 0);
    wrap.dataset.settingReadOnly = item.isReadOnly ? "true" : "false";
    list.className = "settings-emergency__list";
    list.dataset.emergencyList = item.key;

    contacts.forEach(function (contact) {
      list.appendChild(createEmergencyRow(contact, item));
    });

    if (contacts.length === 0) {
      list.appendChild(createEmergencyRow({}, item));
    }

    addButton.className = "button button-secondary";
    addButton.type = "button";
    addButton.textContent = "เพิ่มช่องทาง";
    addButton.disabled = item.isReadOnly || !state.permissions.canUpdate;
    addButton.addEventListener("click", function () {
      list.appendChild(createEmergencyRow({}, item));
      updateSaveButtons();
    });

    wrap.appendChild(list);
    wrap.appendChild(addButton);

    return wrap;
  }

  function createEmergencyRow(contact, item) {
    const row = document.createElement("div");
    const label = createSmallInput("ชื่อช่องทาง", contact.label || "", item);
    const phone = createSmallInput("เบอร์โทร", contact.phone || "", item);
    const note = createSmallInput("หมายเหตุ", contact.note || "", item);
    const remove = document.createElement("button");

    row.className = "settings-emergency__row";
    remove.className = "admin-icon-button settings-emergency__remove";
    remove.type = "button";
    remove.setAttribute("aria-label", "ลบช่องทางฉุกเฉิน");
    remove.textContent = "×";
    remove.disabled = item.isReadOnly || !state.permissions.canUpdate;
    remove.addEventListener("click", function () {
      row.remove();
      updateSaveButtons();
    });

    row.appendChild(label);
    row.appendChild(phone);
    row.appendChild(note);
    row.appendChild(remove);

    return row;
  }

  function createSmallInput(labelText, value, item) {
    const label = document.createElement("label");
    const span = createTextElement("span", "", labelText);
    const input = document.createElement("input");

    label.className = "settings-emergency__field";
    input.className = "form-control";
    input.type = "text";
    input.value = value || "";
    input.disabled = item.isReadOnly || !state.permissions.canUpdate;
    input.dataset.emergencyField = labelText === "ชื่อช่องทาง" ? "label" : labelText === "เบอร์โทร" ? "phone" : "note";
    input.addEventListener("input", updateSaveButtons);
    label.appendChild(span);
    label.appendChild(input);

    return label;
  }

  function readCurrentValue(item) {
    if (item.key === "emergency_contacts") {
      return readEmergencyContacts(item.key);
    }

    const input = document.querySelector("[name='" + item.key + "']");

    if (!input) {
      return item.value;
    }

    if (item.type === "boolean") {
      return input.checked;
    }

    if (item.type === "number") {
      return input.value === "" ? "" : Number(input.value);
    }

    return input.value;
  }

  function readEmergencyContacts(key) {
    const list = $("[data-emergency-list='" + key + "']");
    const rows = list ? Array.prototype.slice.call(list.querySelectorAll(".settings-emergency__row")) : [];

    return rows.map(function (row) {
      const contact = {};

      Array.prototype.forEach.call(row.querySelectorAll("[data-emergency-field]"), function (input) {
        contact[input.dataset.emergencyField] = input.value.trim();
      });

      return contact;
    }).filter(function (contact) {
      return contact.label || contact.phone || contact.note;
    });
  }

  function serializeValueForCompare(value, type) {
    if (type === "json") {
      return JSON.stringify(value || []);
    }

    if (type === "boolean") {
      return value === true ? "true" : "false";
    }

    if (type === "number") {
      return String(Number(value || 0));
    }

    return String(value === undefined || value === null ? "" : value);
  }

  function getChangedItems() {
    return state.items.filter(function (item) {
      if (item.isReadOnly || !state.permissions.canUpdate) {
        return false;
      }

      return serializeValueForCompare(readCurrentValue(item), item.type) !== state.originalValues[item.key];
    });
  }

  function buildPayload() {
    return getChangedItems().map(function (item) {
      return {
        key: item.key,
        value: readCurrentValue(item),
        version: item.version
      };
    });
  }

  function clearFormMessages() {
    $all("[data-setting-error]").forEach(function (element) {
      element.textContent = "";
    });
    setHidden("[data-settings-form-error]", true);
    setText("[data-settings-form-error]", "");
    setHidden("[data-settings-form-success]", true);
    setText("[data-settings-form-success]", "");
  }

  function showFieldErrors(fields) {
    Object.keys(fields || {}).forEach(function (fieldName) {
      const match = fieldName.match(/^items\.(\d+)\.value$/);

      if (!match || !state.pendingPayload || !state.pendingPayload.items[Number(match[1])]) {
        return;
      }

      const key = state.pendingPayload.items[Number(match[1])].key;
      const element = $("[data-setting-error='" + key + "']");

      if (element) {
        element.textContent = fields[fieldName];
      }
    });
  }

  function validateClientPayload(items) {
    const errors = [];

    items.forEach(function (item) {
      const source = state.byKey[item.key];

      if (!source) {
        return;
      }

      if (source.type === "number" && (item.value === "" || !Number.isFinite(Number(item.value)))) {
        errors.push(source.label + " ต้องเป็นตัวเลข");
      }

      if (item.key === "contact_email" && item.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(item.value))) {
        errors.push("รูปแบบอีเมลติดต่อไม่ถูกต้อง");
      }
    });

    return errors;
  }

  function saveSettings(confirmedRisky) {
    const items = buildPayload();
    const clientErrors = validateClientPayload(items);

    clearFormMessages();

    if (items.length === 0) {
      setHidden("[data-settings-form-success]", false);
      setText("[data-settings-form-success]", "ยังไม่มีค่าที่เปลี่ยนแปลง");
      return;
    }

    if (clientErrors.length > 0) {
      setHidden("[data-settings-form-error]", false);
      setText("[data-settings-form-error]", clientErrors.join(" "));
      return;
    }

    const riskyChanged = items.filter(function (item) {
      return state.riskyKeys.indexOf(item.key) !== -1;
    });

    if (!confirmedRisky && riskyChanged.length > 0) {
      openConfirm(items, riskyChanged);
      return;
    }

    submitSettings(items, confirmedRisky === true);
  }

  function submitSettings(items, confirmedRisky) {
    const buttons = $all("[data-settings-save], [data-settings-save-top]");

    state.pendingPayload = {
      items: items,
      confirmedRisky: confirmedRisky === true
    };
    buttons.forEach(function (button) {
      button.disabled = true;
      button.textContent = "กำลังบันทึก...";
    });

    window.KPR_API.write("admin.settings.update", state.pendingPayload, {
      withSession: true
    }).then(function () {
      setHidden("[data-settings-form-success]", false);
      setText("[data-settings-form-success]", "บันทึกการตั้งค่าสำเร็จ และล้าง cache สาธารณะแล้ว");
      return loadSettings();
    }).catch(function (error) {
      const fields = error && error.fields ? error.fields : {};

      if (fields.confirmation) {
        openConfirm(items, items.filter(function (item) {
          return state.riskyKeys.indexOf(item.key) !== -1;
        }));
        return;
      }

      showFieldErrors(fields);
      setHidden("[data-settings-form-error]", false);
      setText("[data-settings-form-error]", getErrorMessage(error));
    }).finally(function () {
      state.pendingPayload = null;
      buttons.forEach(function (button) {
        button.disabled = false;
        button.textContent = button.matches("[data-settings-save-top]") ? "บันทึก" : "บันทึกการตั้งค่า";
      });
      updateSaveButtons();
    });
  }

  function openConfirm(items, riskyItems) {
    const list = $("[data-settings-confirm-list]");

    state.pendingPayload = {
      items: items,
      confirmedRisky: true
    };
    clearElement(list);
    (riskyItems || []).forEach(function (item) {
      list.appendChild(createTextElement("span", "", RISKY_LABELS[item.key] || item.key));
    });
    setHidden("[data-settings-confirm]", false);
    document.body.classList.add("is-settings-modal-open");
  }

  function closeConfirm() {
    setHidden("[data-settings-confirm]", true);
    document.body.classList.remove("is-settings-modal-open");
  }

  function resetForm() {
    renderSettings();
    clearFormMessages();
    updateSaveButtons();
  }

  function bindEvents() {
    const form = $("[data-settings-form]");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        saveSettings(false);
      });
    }

    const retryButton = $("[data-settings-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", loadSettings);
    }

    const saveTopButton = $("[data-settings-save-top]");
    if (saveTopButton) {
      saveTopButton.addEventListener("click", function () {
        saveSettings(false);
      });
    }

    const resetButton = $("[data-settings-reset]");
    if (resetButton) {
      resetButton.addEventListener("click", resetForm);
    }

    $all("[data-settings-confirm-cancel], [data-settings-confirm-back]").forEach(function (button) {
      button.addEventListener("click", closeConfirm);
    });

    const confirmOk = $("[data-settings-confirm-ok]");
    if (confirmOk) {
      confirmOk.addEventListener("click", function () {
        const payload = state.pendingPayload;

        closeConfirm();

        if (payload && Array.isArray(payload.items)) {
          submitSettings(payload.items, true);
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeConfirm();
      }
    });
  }

  async function init() {
    document.documentElement.dataset.adminPage = "settings";
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

      if (!canManageSettings()) {
        showForbidden();
        return;
      }

      state.permissions = {
        canRead: true,
        canUpdate: true
      };
      loadSettings();
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
