(function () {
  "use strict";

  const DRAFT_KEY = "KPR_REPORT_DRAFT_V1";
  const TOTAL_STEPS = 6;
  const DEFAULT_MAX_IMAGES = 3;
  const MAX_IMAGE_SIZE_MB = 1;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const STEP_TITLES = {
    1: "หมวด",
    2: "รายละเอียด",
    3: "สถานที่",
    4: "รูปภาพ",
    5: "ผู้แจ้ง",
    6: "ตรวจสอบ"
  };

  const state = {
    currentStep: 1,
    isSubmitted: false,
    hasDirtyData: false,
    attachments: [],
    restoredAttachmentNames: []
  };

  function getForm() {
    return document.getElementById("report-form");
  }

  function getValidation() {
    return window.KPRValidation || {};
  }

  function getConfig() {
    return window.APP_CONFIG || {};
  }

  function toText(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value).trim();
  }

  function getMaxImages() {
    return Number(getConfig().MAX_IMAGES) || DEFAULT_MAX_IMAGES;
  }

  function getMaxImageSizeBytes() {
    const maxSizeMb = Number(getConfig().MAX_IMAGE_SIZE_MB) || MAX_IMAGE_SIZE_MB;
    return maxSizeMb * 1024 * 1024;
  }

  function getField(name) {
    const form = getForm();
    return form ? form.elements[name] : null;
  }

  function getRadioValue(name) {
    const checked = document.querySelector("input[name='" + name + "']:checked");
    return checked ? checked.value : "";
  }

  function setRadioValue(name, value) {
    if (!value) {
      return;
    }

    const options = document.querySelectorAll("input[name='" + name + "']");
    options.forEach(function (option) {
      option.checked = option.value === value;
    });
  }

  function getCheckboxValue(name) {
    const field = getField(name);
    return Boolean(field && field.checked);
  }

  function setCheckboxValue(name, value) {
    const field = getField(name);

    if (field) {
      field.checked = Boolean(value);
    }
  }

  function setFieldValue(name, value) {
    const field = getField(name);

    if (field && typeof field.value !== "undefined") {
      field.value = value || "";
    }
  }

  function getFieldValue(name) {
    const field = getField(name);
    return field && typeof field.value !== "undefined" ? field.value : "";
  }

  function clearElement(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function setStatus(type, title, message) {
    const container = document.getElementById("form-status");
    clearElement(container);

    if (!title && !message) {
      return;
    }

    const box = document.createElement("div");
    box.className = "alert alert-" + type;
    const strong = document.createElement("strong");
    strong.textContent = title || "";
    const paragraph = document.createElement("p");
    paragraph.textContent = message || "";
    box.append(strong, paragraph);
    container.appendChild(box);
  }

  function setFieldError(fieldName, message) {
    const error = document.querySelector("[data-field-error='" + fieldName + "']");
    const fields = document.querySelectorAll("[name='" + fieldName + "']");

    if (error) {
      error.textContent = message || "";
    }

    fields.forEach(function (field) {
      if (message) {
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }
    });
  }

  function clearErrors() {
    document.querySelectorAll("[data-field-error]").forEach(function (error) {
      error.textContent = "";
    });

    document.querySelectorAll("[aria-invalid='true']").forEach(function (field) {
      field.removeAttribute("aria-invalid");
    });

    setStatus("", "", "");
  }

  function focusFirstError(errors) {
    const firstKey = Object.keys(errors)[0];

    if (!firstKey) {
      return;
    }

    const field = document.querySelector("[name='" + firstKey + "']") || document.querySelector("[data-field-error='" + firstKey + "']");

    if (field && typeof field.focus === "function") {
      field.focus();
    }

    if (field && typeof field.scrollIntoView === "function") {
      field.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function showErrors(errors) {
    Object.keys(errors).forEach(function (fieldName) {
      setFieldError(fieldName, errors[fieldName]);
    });

    setStatus("danger", "กรุณาตรวจสอบข้อมูล", "แก้ไขช่องที่มีข้อความแจ้งเตือนก่อนดำเนินการต่อ");
    focusFirstError(errors);
  }

  function getSelectedCategoryLabel() {
    const selected = document.querySelector("input[name='categoryId']:checked");

    if (!selected) {
      return "";
    }

    return selected.dataset.categoryName || selected.value;
  }

  function collectSafeDraft() {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      currentStep: state.currentStep,
      categoryId: getRadioValue("categoryId"),
      details: {
        title: getFieldValue("title"),
        description: getFieldValue("description"),
        incidentDate: getFieldValue("incidentDate"),
        priorityReported: getRadioValue("priorityReported")
      },
      location: {
        locationName: getFieldValue("locationName"),
        villageNo: getFieldValue("villageNo"),
        landmark: getFieldValue("landmark")
      },
      reporter: {
        isAnonymous: getRadioValue("isAnonymous") === "true",
        contactMethod: getRadioValue("isAnonymous") === "true" ? "none" : getFieldValue("contactMethod")
      },
      attachments: state.attachments.map(function (item) {
        return {
          name: item.file.name,
          type: item.file.type,
          size: item.file.size
        };
      }).concat(state.restoredAttachmentNames.map(function (name) {
        return {
          name: name,
          restoredOnly: true
        };
      })),
      consent: {
        truthConfirmed: getCheckboxValue("truthConfirmed"),
        privacyAccepted: getCheckboxValue("privacyAccepted")
      }
    };
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(collectSafeDraft()));
      state.hasDirtyData = true;
    } catch (error) {
      setStatus("warning", "บันทึกฉบับร่างไม่ได้", "พื้นที่จัดเก็บในเบราว์เซอร์อาจเต็ม หรือเบราว์เซอร์ไม่อนุญาต");
    }
  }

  function readDraft() {
    try {
      const rawDraft = window.localStorage.getItem(DRAFT_KEY);
      return rawDraft ? JSON.parse(rawDraft) : null;
    } catch (error) {
      return null;
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      return;
    }

    state.hasDirtyData = false;
    state.restoredAttachmentNames = [];
    const notice = document.getElementById("draft-notice");

    if (notice) {
      notice.hidden = true;
    }
  }

  function restoreDraft() {
    const draft = readDraft();

    if (!draft) {
      return;
    }

    setRadioValue("categoryId", draft.categoryId);
    setFieldValue("title", draft.details && draft.details.title);
    setFieldValue("description", draft.details && draft.details.description);
    setFieldValue("incidentDate", draft.details && draft.details.incidentDate);
    setRadioValue("priorityReported", draft.details && draft.details.priorityReported);
    setFieldValue("locationName", draft.location && draft.location.locationName);
    setFieldValue("villageNo", draft.location && draft.location.villageNo);
    setFieldValue("landmark", draft.location && draft.location.landmark);
    setRadioValue("isAnonymous", draft.reporter && draft.reporter.isAnonymous ? "true" : "false");
    setFieldValue("contactMethod", draft.reporter && draft.reporter.contactMethod !== "none" ? draft.reporter.contactMethod : "phone");
    setCheckboxValue("truthConfirmed", draft.consent && draft.consent.truthConfirmed);
    setCheckboxValue("privacyAccepted", draft.consent && draft.consent.privacyAccepted);

    if (Array.isArray(draft.attachments)) {
      state.restoredAttachmentNames = draft.attachments
        .map(function (item) {
          return item && item.name ? item.name : "";
        })
        .filter(Boolean);
    }

    const restoredStep = Number(draft.currentStep);
    state.currentStep = restoredStep >= 1 && restoredStep <= TOTAL_STEPS ? restoredStep : 1;
    state.hasDirtyData = true;

    const notice = document.getElementById("draft-notice");

    if (notice) {
      notice.hidden = false;
    }
  }

  function applyQueryCategory() {
    const params = new URLSearchParams(window.location.search);
    const category = toText(params.get("category"));

    if (!category || getRadioValue("categoryId")) {
      return;
    }

    const normalizedCategory = category.toUpperCase();
    const option = Array.from(document.querySelectorAll("input[name='categoryId']")).find(function (input) {
      return input.value.toUpperCase() === normalizedCategory || (input.dataset.categoryCode || "").toUpperCase() === normalizedCategory;
    });

    if (option) {
      option.checked = true;
    }
  }

  function updateStepper() {
    document.querySelectorAll("[data-step-indicator]").forEach(function (item) {
      const step = Number(item.dataset.stepIndicator);

      if (step === state.currentStep) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }

      item.dataset.complete = step < state.currentStep ? "true" : "false";
    });
  }

  function updateButtons() {
    const backButton = document.getElementById("back-button");
    const nextButton = document.getElementById("next-button");

    if (backButton) {
      backButton.hidden = state.currentStep === 1;
    }

    if (nextButton) {
      nextButton.textContent = state.currentStep === TOTAL_STEPS ? "ตรวจสอบเสร็จแล้ว" : "ถัดไป";
    }
  }

  function showStep(step) {
    state.currentStep = step;

    document.querySelectorAll("[data-step]").forEach(function (section) {
      section.hidden = Number(section.dataset.step) !== state.currentStep;
    });

    updateStepper();
    updateButtons();
    updateCriticalWarning();
    updateReporterVisibility();
    updateDescriptionCount();

    if (state.currentStep === TOTAL_STEPS) {
      renderReviewSummary();
    }

    const activeSection = document.querySelector("[data-step='" + state.currentStep + "']");

    if (activeSection && typeof activeSection.scrollIntoView === "function") {
      activeSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function isFutureDate(value) {
    if (!value) {
      return false;
    }

    const selectedDate = new Date(value + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate.getTime() > today.getTime();
  }

  function validateStep(step) {
    const validator = getValidation();
    const errors = {};

    clearErrors();

    if (step === 1 && !getRadioValue("categoryId")) {
      errors.categoryId = "กรุณาเลือกหมวดปัญหา";
    }

    if (step === 2) {
      const title = toText(getFieldValue("title"));
      const description = toText(getFieldValue("description"));
      const incidentDate = getFieldValue("incidentDate");

      if (!validator.required || !validator.required(title)) {
        errors.title = "กรุณากรอกหัวข้อปัญหา";
      } else if (title.length < 5) {
        errors.title = "หัวข้อควรมีอย่างน้อย 5 ตัวอักษร";
      } else if (!validator.maxLength(title, 150)) {
        errors.title = "หัวข้อต้องไม่เกิน 150 ตัวอักษร";
      }

      if (!validator.required || !validator.required(description)) {
        errors.description = "กรุณาอธิบายรายละเอียด";
      } else if (description.length < 10) {
        errors.description = "รายละเอียดควรมีอย่างน้อย 10 ตัวอักษร";
      } else if (!validator.maxLength(description, 3000)) {
        errors.description = "รายละเอียดต้องไม่เกิน 3,000 ตัวอักษร";
      }

      if (!incidentDate) {
        errors.incidentDate = "กรุณาระบุวันที่พบปัญหา";
      } else if (!validator.date(incidentDate)) {
        errors.incidentDate = "รูปแบบวันที่ไม่ถูกต้อง";
      } else if (isFutureDate(incidentDate)) {
        errors.incidentDate = "วันที่พบปัญหาต้องไม่เป็นวันในอนาคต";
      }

      if (!getRadioValue("priorityReported")) {
        errors.priorityReported = "กรุณาเลือกระดับความเร่งด่วน";
      }
    }

    if (step === 3) {
      const locationName = toText(getFieldValue("locationName"));
      const landmark = toText(getFieldValue("landmark"));
      const latitude = getFieldValue("latitude");
      const longitude = getFieldValue("longitude");

      if (!locationName && !landmark) {
        errors.location = "กรุณากรอกชื่อสถานที่หรือจุดสังเกตอย่างน้อยหนึ่งอย่าง";
      }

      if (validator.latLng && !validator.latLng(latitude, longitude)) {
        errors.latLng = "กรุณากรอก Latitude และ Longitude ให้ครบคู่ และอยู่ในช่วงที่ถูกต้อง";
      }
    }

    if (step === 4 && state.attachments.length > getMaxImages()) {
      errors.attachments = "เพิ่มรูปได้สูงสุด " + getMaxImages() + " รูป";
    }

    if (step === 5 && getRadioValue("isAnonymous") !== "true") {
      const reporterName = toText(getFieldValue("reporterName"));
      const reporterPhone = toText(getFieldValue("reporterPhone"));
      const reporterEmail = toText(getFieldValue("reporterEmail"));
      const contactMethod = getFieldValue("contactMethod");

      if (!validator.required || !validator.required(reporterName)) {
        errors.reporterName = "กรุณากรอกชื่อผู้แจ้ง";
      }

      if (!validator.required || !validator.required(reporterPhone)) {
        errors.reporterPhone = "กรุณากรอกเบอร์โทร";
      } else if (validator.phone && !validator.phone(reporterPhone)) {
        errors.reporterPhone = "รูปแบบเบอร์โทรไม่ถูกต้อง";
      }

      if (reporterEmail && validator.email && !validator.email(reporterEmail)) {
        errors.reporterEmail = "รูปแบบอีเมลไม่ถูกต้อง";
      }

      if (contactMethod === "email" && !reporterEmail) {
        errors.contactMethod = "หากเลือกติดต่อทางอีเมล กรุณากรอกอีเมล";
      }
    }

    if (step === 6 && (!getCheckboxValue("truthConfirmed") || !getCheckboxValue("privacyAccepted"))) {
      errors.consent = "กรุณายืนยันข้อมูลและยอมรับนโยบายก่อนดำเนินการต่อ";
    }

    if (Object.keys(errors).length) {
      showErrors(errors);
      return false;
    }

    return true;
  }

  function goNext() {
    if (!validateStep(state.currentStep)) {
      return;
    }

    saveDraft();

    if (state.currentStep === TOTAL_STEPS) {
      state.isSubmitted = true;
      setStatus("success", "ตรวจสอบข้อมูลครบแล้ว", "ขั้นนี้ยังไม่ส่ง API จริง ข้อมูลพร้อมสำหรับเชื่อมต่อ report.create ใน Prompt ถัดไป");
      clearDraft();
      return;
    }

    showStep(state.currentStep + 1);
  }

  function goBack() {
    if (state.currentStep <= 1) {
      return;
    }

    saveDraft();
    showStep(state.currentStep - 1);
  }

  function updateDescriptionCount() {
    const description = getFieldValue("description");
    const counter = document.querySelector("[data-character-count='description']");

    if (counter) {
      counter.textContent = description.length + " / 3000 ตัวอักษร";
    }
  }

  function updateCriticalWarning() {
    const warning = document.getElementById("critical-warning");

    if (warning) {
      warning.hidden = getRadioValue("priorityReported") !== "critical";
    }
  }

  function updateReporterVisibility() {
    const isAnonymous = getRadioValue("isAnonymous") === "true";
    const anonymousNote = document.getElementById("anonymous-note");

    document.querySelectorAll(".reporter-field input, .reporter-field select").forEach(function (field) {
      field.disabled = isAnonymous;
    });

    document.querySelectorAll(".reporter-field").forEach(function (field) {
      field.hidden = isAnonymous;
    });

    if (anonymousNote) {
      anonymousNote.hidden = !isAnonymous;
    }
  }

  function renderAttachmentList() {
    const container = document.getElementById("attachment-list");
    clearElement(container);

    if (!state.attachments.length && !state.restoredAttachmentNames.length) {
      container.className = "attachment-grid empty-state";
      const title = document.createElement("h3");
      title.textContent = "ยังไม่มีรูปภาพ";
      const message = document.createElement("p");
      message.textContent = "สามารถข้ามขั้นนี้ได้หากยังไม่มีรูปประกอบ";
      container.append(title, message);
      return;
    }

    container.className = "attachment-grid";

    state.restoredAttachmentNames.forEach(function (name) {
      const card = document.createElement("div");
      card.className = "attachment-card";
      const placeholder = document.createElement("span");
      placeholder.className = "attachment-placeholder";
      placeholder.textContent = "ไฟล์";
      const info = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = name;
      const note = document.createElement("small");
      note.textContent = "พบจากฉบับร่าง กรุณาเลือกรูปใหม่หากต้องการส่งจริง";
      info.append(title, note);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button button-ghost";
      remove.textContent = "ลบ";
      remove.addEventListener("click", function () {
        state.restoredAttachmentNames = state.restoredAttachmentNames.filter(function (item) {
          return item !== name;
        });
        renderAttachmentList();
        saveDraft();
      });
      card.append(placeholder, info, remove);
      container.appendChild(card);
    });

    state.attachments.forEach(function (item, index) {
      const card = document.createElement("div");
      card.className = "attachment-card";
      const image = document.createElement("img");
      image.src = item.previewUrl;
      image.alt = "";
      const info = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = item.file.name;
      const size = document.createElement("small");
      size.textContent = formatFileSize(item.file.size);
      info.append(title, size);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button button-ghost";
      remove.textContent = "ลบ";
      remove.addEventListener("click", function () {
        window.URL.revokeObjectURL(item.previewUrl);
        state.attachments.splice(index, 1);
        renderAttachmentList();
        saveDraft();
      });
      card.append(image, info, remove);
      container.appendChild(card);
    });
  }

  function formatFileSize(size) {
    if (!Number.isFinite(size)) {
      return "";
    }

    if (size < 1024 * 1024) {
      return Math.round(size / 1024) + " KB";
    }

    return (size / 1024 / 1024).toFixed(1) + " MB";
  }

  function handleFiles(files) {
    const errors = [];
    const maxImages = getMaxImages();
    const maxSize = getMaxImageSizeBytes();

    Array.from(files).forEach(function (file) {
      if (state.attachments.length >= maxImages) {
        errors.push("เพิ่มรูปได้สูงสุด " + maxImages + " รูป");
        return;
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(file.name + " ไม่ใช่ไฟล์ JPG, PNG หรือ WebP");
        return;
      }

      if (file.size > maxSize) {
        errors.push(file.name + " มีขนาดเกิน " + (Number(getConfig().MAX_IMAGE_SIZE_MB) || MAX_IMAGE_SIZE_MB) + " MB");
        return;
      }

      state.attachments.push({
        file: file,
        previewUrl: window.URL.createObjectURL(file)
      });
    });

    setFieldError("attachments", errors.join(" "));
    renderAttachmentList();
    saveDraft();
  }

  function getReviewRows() {
    const isAnonymous = getRadioValue("isAnonymous") === "true";
    const attachmentNames = state.attachments.map(function (item) {
      return item.file.name;
    }).concat(state.restoredAttachmentNames);

    return [
      ["หมวดปัญหา", getSelectedCategoryLabel() || "-"],
      ["หัวข้อ", getFieldValue("title") || "-"],
      ["รายละเอียด", getFieldValue("description") || "-"],
      ["วันที่พบปัญหา", getFieldValue("incidentDate") || "-"],
      ["ความเร่งด่วน", getPriorityText(getRadioValue("priorityReported"))],
      ["สถานที่", [getFieldValue("locationName"), getFieldValue("villageNo") ? "หมู่ " + getFieldValue("villageNo") : "", getFieldValue("landmark")].filter(Boolean).join(" / ") || "-"],
      ["พิกัด", getFieldValue("latitude") && getFieldValue("longitude") ? getFieldValue("latitude") + ", " + getFieldValue("longitude") : "-"],
      ["รูปภาพ", attachmentNames.length ? attachmentNames.join(", ") : "ไม่มีรูปภาพ"],
      ["รูปแบบการแจ้ง", isAnonymous ? "ไม่ระบุตัวตน" : "ระบุตัวตน"],
      ["ช่องทางติดต่อ", isAnonymous ? "ไม่มี" : getContactText(getFieldValue("contactMethod"))]
    ];
  }

  function getPriorityText(value) {
    const labels = {
      low: "ไม่เร่งด่วน",
      normal: "ปกติ",
      high: "ค่อนข้างเร่งด่วน",
      critical: "เสี่ยงอันตราย"
    };

    return labels[value] || "-";
  }

  function getContactText(value) {
    const labels = {
      phone: "โทรศัพท์",
      email: "อีเมล",
      none: "ไม่มี"
    };

    return labels[value] || "-";
  }

  function renderReviewSummary() {
    const container = document.getElementById("review-summary");
    clearElement(container);

    getReviewRows().forEach(function (row) {
      const item = document.createElement("dl");
      item.className = "review-item";
      const term = document.createElement("dt");
      term.textContent = row[0];
      const detail = document.createElement("dd");
      detail.textContent = row[1];
      item.append(term, detail);
      container.appendChild(item);
    });
  }

  function useCurrentLocation() {
    const status = document.getElementById("location-status");

    if (!navigator.geolocation) {
      status.textContent = "เบราว์เซอร์นี้ไม่รองรับการใช้ตำแหน่งปัจจุบัน สามารถกรอกสถานที่เองได้";
      return;
    }

    status.textContent = "กำลังขอพิกัดจากอุปกรณ์...";

    navigator.geolocation.getCurrentPosition(function (position) {
      setFieldValue("latitude", position.coords.latitude.toFixed(6));
      setFieldValue("longitude", position.coords.longitude.toFixed(6));
      status.textContent = "ดึงพิกัดสำเร็จแล้ว";
      saveDraft();
    }, function () {
      status.textContent = "ไม่สามารถใช้ตำแหน่งปัจจุบันได้ กรุณากรอกสถานที่เอง";
    }, {
      enableHighAccuracy: true,
      maximumAge: 60000,
      timeout: 10000
    });
  }

  function setDefaultIncidentDate() {
    const field = getField("incidentDate");

    if (field && !field.value) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      field.value = today.getFullYear() + "-" + month + "-" + day;
    }
  }

  function wireEvents() {
    const form = getForm();

    document.getElementById("next-button").addEventListener("click", goNext);
    document.getElementById("back-button").addEventListener("click", goBack);

    form.addEventListener("input", function (event) {
      if (event.target.name === "description") {
        updateDescriptionCount();
      }

      saveDraft();
    });

    form.addEventListener("change", function (event) {
      if (event.target.name === "priorityReported") {
        updateCriticalWarning();
      }

      if (event.target.name === "isAnonymous") {
        updateReporterVisibility();
      }

      if (event.target.name === "attachments") {
        handleFiles(event.target.files);
        event.target.value = "";
        return;
      }

      saveDraft();
    });

    document.querySelector("[data-use-location]").addEventListener("click", useCurrentLocation);
    document.querySelector("[data-clear-draft]").addEventListener("click", function () {
      if (window.confirm("ต้องการล้างฉบับร่างนี้หรือไม่")) {
        clearDraft();
        window.location.reload();
      }
    });

    document.querySelector("[data-cancel-link]").addEventListener("click", function (event) {
      if (!state.isSubmitted && state.hasDirtyData && !window.confirm("มีข้อมูลที่ยังไม่ได้ส่ง ต้องการออกจากหน้านี้หรือไม่")) {
        event.preventDefault();
      }
    });

    window.addEventListener("beforeunload", function (event) {
      if (!state.isSubmitted && state.hasDirtyData) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setDefaultIncidentDate();
    restoreDraft();
    applyQueryCategory();
    wireEvents();
    updateReporterVisibility();
    updateDescriptionCount();
    renderAttachmentList();
    showStep(state.currentStep);
  });
})();
