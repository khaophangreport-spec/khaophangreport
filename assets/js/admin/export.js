(function () {
  "use strict";

  const EXPORT_MAX_ROWS = 5000;
  const PROGRESS_STEPS = Object.freeze([
    { value: 25, title: "กำลังตรวจสิทธิ์", text: "ตรวจสอบ Session และสิทธิ์ส่งออกข้อมูล" },
    { value: 55, title: "กำลังสร้าง CSV", text: "รวบรวมข้อมูลตามตัวกรองและป้องกันสูตรในเซลล์" },
    { value: 85, title: "กำลังเตรียมดาวน์โหลด", text: "เข้ารหัสไฟล์และบันทึกประวัติการส่งออก" }
  ]);

  const state = {
    currentUser: null,
    latestFile: null,
    progressTimer: 0,
    progressIndex: 0,
    isLoading: false
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

  function hasPermission(user, permission) {
    const permissions = Array.isArray(user && user.permissions) ? user.permissions : [];

    return permissions.indexOf("admin.full") !== -1 || permissions.indexOf(permission) !== -1;
  }

  function canExport() {
    const role = String(state.currentUser && state.currentUser.role || "").toLowerCase();

    return ["super_admin", "admin", "viewer"].indexOf(role) !== -1 && hasPermission(state.currentUser, "report.read");
  }

  function canIncludePersonalData() {
    return hasPermission(state.currentUser, "export.personal_data");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("th-TH").format(Number(value || 0));
  }

  function getErrorMessage(error) {
    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return "ไม่สามารถเชื่อมต่อระบบได้";
  }

  function setControlsDisabled(isDisabled) {
    $all("[data-export-form] input, [data-export-form] select, [data-export-form] button, [data-export-download-again]").forEach(function (element) {
      element.disabled = !!isDisabled;
    });
  }

  function resetFieldErrors() {
    $all("[data-export-field-error]").forEach(function (element) {
      element.textContent = "";
    });

    $all("[data-export-form] input, [data-export-form] select").forEach(function (element) {
      element.removeAttribute("aria-invalid");
    });
  }

  function showFieldErrors(fields) {
    Object.keys(fields || {}).forEach(function (fieldName) {
      const errorElement = $('[data-export-field-error="' + fieldName + '"]');

      if (errorElement) {
        errorElement.textContent = fields[fieldName];
      }

      const inputName = fieldName.replace(/^filters\./, "");
      const input = $("[data-export-form]") && $("[data-export-form]").elements[inputName];

      if (input) {
        input.setAttribute("aria-invalid", "true");
      }
    });
  }

  function hideResultStates() {
    setHidden("[data-export-loading]", true);
    setHidden("[data-export-error]", true);
    setHidden("[data-export-empty]", true);
    setHidden("[data-export-result]", true);
  }

  function setProgress(step) {
    const safeStep = step || PROGRESS_STEPS[0];
    const bar = $("[data-export-progress-bar]");

    if (bar) {
      bar.style.width = safeStep.value + "%";
    }

    setText("[data-export-progress-title]", safeStep.title);
    setText("[data-export-progress-text]", safeStep.text);
  }

  function startProgress() {
    window.clearInterval(state.progressTimer);
    state.progressIndex = 0;
    setProgress(PROGRESS_STEPS[0]);
    state.progressTimer = window.setInterval(function () {
      state.progressIndex = Math.min(state.progressIndex + 1, PROGRESS_STEPS.length - 1);
      setProgress(PROGRESS_STEPS[state.progressIndex]);
    }, 900);
  }

  function stopProgress() {
    window.clearInterval(state.progressTimer);
    state.progressTimer = 0;
  }

  function setLoading(isLoading) {
    state.isLoading = !!isLoading;
    hideResultStates();
    setHidden("[data-export-loading]", !isLoading);
    setControlsDisabled(isLoading);

    if (isLoading) {
      startProgress();
    } else {
      stopProgress();
    }
  }

  function showForbidden() {
    hideResultStates();
    setHidden("[data-export-forbidden]", false);
    const form = $("[data-export-form]");

    if (form) {
      form.hidden = true;
    }
  }

  function showError(error) {
    setLoading(false);
    setHidden("[data-export-error]", false);
    setText("[data-export-error-message]", getErrorMessage(error));

    if (error && error.fields) {
      showFieldErrors(error.fields);
    }
  }

  function showEmpty() {
    setLoading(false);
    setHidden("[data-export-empty]", false);
  }

  function showSuccess(data) {
    setLoading(false);
    setHidden("[data-export-result]", false);
    setText("[data-export-file-name]", data.fileName || "-");
    setText("[data-export-row-count]", formatNumber(data.rowCount || 0) + (data.truncated ? " จาก " + formatNumber(data.totalMatchedRows || 0) : ""));
    setText("[data-export-pii-state]", data.includePersonalData ? "รวมข้อมูลส่วนบุคคล" : "ไม่รวมข้อมูลส่วนบุคคล");
    setText("[data-export-result-summary]", data.truncated
      ? "ไฟล์ถูกจำกัดที่ " + formatNumber(data.maxRows || EXPORT_MAX_ROWS) + " แถว"
      : "สร้างไฟล์ CSV สำเร็จ");
  }

  function readFormPayload(form) {
    return {
      exportType: form.elements.exportType.value,
      filters: {
        dateFrom: form.elements.dateFrom.value,
        dateTo: form.elements.dateTo.value,
        status: form.elements.status.value,
        categoryId: form.elements.categoryId.value.trim(),
        assigneeId: form.elements.assigneeId.value.trim()
      },
      includePersonalData: form.elements.includePersonalData.checked,
      confirmed: false
    };
  }

  function validateClientPayload(payload) {
    const fields = {};

    if (payload.filters.dateFrom && payload.filters.dateTo && payload.filters.dateFrom > payload.filters.dateTo) {
      fields["filters.dateTo"] = "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น";
    }

    return {
      ok: Object.keys(fields).length === 0,
      fields: fields
    };
  }

  function confirmPersonalData(payload) {
    if (!payload.includePersonalData) {
      return true;
    }

    if (!canIncludePersonalData()) {
      showError({
        code: "FORBIDDEN",
        message: "บัญชีนี้ไม่มีสิทธิ์ส่งออกข้อมูลส่วนบุคคล"
      });
      return false;
    }

    return window.confirm("ยืนยันการส่งออกข้อมูลส่วนบุคคล? การกระทำนี้จะถูกบันทึกใน Activity Log");
  }

  function base64ToBlob(contentBase64, mimeType) {
    const binary = window.atob(contentBase64 || "");
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], {
      type: mimeType || "text/csv;charset=utf-8"
    });
  }

  function downloadLatestFile() {
    if (!state.latestFile || !state.latestFile.contentBase64) {
      return;
    }

    const blob = base64ToBlob(state.latestFile.contentBase64, state.latestFile.mimeType);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = state.latestFile.fileName || "khaophang_export.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function clearFilters() {
    const form = $("[data-export-form]");

    if (!form) {
      return;
    }

    state.latestFile = null;
    form.reset();
    resetFieldErrors();
    hideResultStates();
    configurePersonalDataControl();
  }

  function submitExport(event) {
    event.preventDefault();

    if (state.isLoading) {
      return;
    }

    const form = event.currentTarget;
    const payload = readFormPayload(form);
    const validation = validateClientPayload(payload);

    resetFieldErrors();
    hideResultStates();

    if (!validation.ok) {
      showFieldErrors(validation.fields);
      return;
    }

    if (!confirmPersonalData(payload)) {
      return;
    }

    payload.confirmed = payload.includePersonalData;
    state.latestFile = null;
    setLoading(true);

    window.KPR_API.write("admin.export.csv", payload, {
      withSession: true,
      timeoutMs: 30000
    }).then(function (response) {
      const data = response && response.data ? response.data : {};

      state.latestFile = data;

      if (!data.rowCount) {
        showEmpty();
        return;
      }

      showSuccess(data);
      downloadLatestFile();
    }).catch(showError);
  }

  function configurePersonalDataControl() {
    const checkbox = $("[data-export-personal]");
    const note = $("[data-export-personal-note]");
    const allowed = canIncludePersonalData();

    if (!checkbox) {
      return;
    }

    checkbox.checked = false;
    checkbox.disabled = !allowed;

    if (note) {
      note.textContent = allowed
        ? "ต้องยืนยันก่อนส่งออก และระบบจะบันทึก Activity Log"
        : "บัญชีนี้ไม่มีสิทธิ์ export.personal_data";
    }
  }

  function bindEvents() {
    const form = $("[data-export-form]");

    if (form) {
      form.addEventListener("submit", submitExport);
    }

    const clearButton = $("[data-export-clear]");
    if (clearButton) {
      clearButton.addEventListener("click", clearFilters);
    }

    const downloadAgainButton = $("[data-export-download-again]");
    if (downloadAgainButton) {
      downloadAgainButton.addEventListener("click", downloadLatestFile);
    }

    window.addEventListener("pagehide", function () {
      stopProgress();
      state.latestFile = null;
    });
  }

  async function init() {
    document.documentElement.dataset.adminPage = "export";
    setText("[data-export-max-rows]", formatNumber(EXPORT_MAX_ROWS) + " แถว");
    hideResultStates();
    bindEvents();

    if (!window.KPR_AUTH || typeof window.KPR_AUTH.requireAdminSession !== "function") {
      showError({ code: "UNAUTHORIZED" });
      return;
    }

    try {
      state.currentUser = await window.KPR_AUTH.requireAdminSession();

      if (!state.currentUser) {
        return;
      }

      if (!canExport()) {
        showForbidden();
        return;
      }

      setHidden("[data-export-forbidden]", true);
      configurePersonalDataControl();
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
