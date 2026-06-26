(function () {
  "use strict";

  const DRAFT_KEY = "KPR_REPORT_DRAFT_V1";
  const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const PRIORITY_VALUES = ["low", "normal", "high", "critical"];

  const state = {
    currentStep: 1,
    maxStep: 6,
    categories: [],
    selectedCategoryId: "",
    images: [],
    objectUrls: [],
    isDirty: false,
    hasSubmitted: false,
    queryCategoryId: ""
  };

  const elements = {};

  document.documentElement.dataset.page = "report";
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    state.queryCategoryId = getQueryParam("category");
    restoreDraft();
    setDefaultDate();
    bindEvents();
    updateCharacterCounts();
    updateReporterMode();
    syncMapFromCoordinates();
    updateStep();
    loadCategories();
    window.addEventListener("beforeunload", handleBeforeUnload);
  }

  function cacheElements() {
    elements.form = document.querySelector("[data-report-form]");
    elements.panels = Array.from(document.querySelectorAll("[data-step-panel]"));
    elements.stepperItems = Array.from(document.querySelectorAll("[data-stepper-item]"));
    elements.backButton = document.querySelector("[data-back-step]");
    elements.nextButton = document.querySelector("[data-next-step]");
    elements.saveDraftButton = document.querySelector("[data-save-draft]");
    elements.formStatus = document.querySelector("[data-form-status]");
    elements.draftRestored = document.querySelector("[data-draft-restored]");

    elements.categoryId = document.querySelector("[data-field='categoryId']");
    elements.categoryLoading = document.querySelector("[data-category-loading]");
    elements.categoryEmpty = document.querySelector("[data-category-empty]");
    elements.categoryError = document.querySelector("[data-category-error]");
    elements.categoryErrorMessage = document.querySelector("[data-category-error-message]");
    elements.categoryList = document.querySelector("[data-category-list]");
    elements.retryCategories = document.querySelector("[data-retry-categories]");

    elements.priority = document.querySelector("[data-field='priorityReported']");
    elements.criticalWarning = document.querySelector("[data-critical-warning]");
    elements.useLocation = document.querySelector("[data-use-location]");
    elements.locationMessage = document.querySelector("[data-location-message]");
    elements.coordinatePreview = document.querySelector("[data-coordinate-preview]");
    elements.coordinateText = document.querySelector("[data-coordinate-text]");
    elements.mapLink = document.querySelector("[data-map-link]");
    elements.imageInput = document.querySelector("[data-image-input]");
    elements.imageEmpty = document.querySelector("[data-image-empty]");
    elements.imageList = document.querySelector("[data-image-list]");
    elements.reporterFields = document.querySelector("[data-reporter-fields]");
    elements.anonymousNote = document.querySelector("[data-anonymous-note]");
    elements.reviewList = document.querySelector("[data-review-list]");
    elements.reviewSuccess = document.querySelector("[data-review-success]");
  }

  function bindEvents() {
    elements.backButton.addEventListener("click", goBack);
    elements.nextButton.addEventListener("click", goNext);
    elements.saveDraftButton.addEventListener("click", function () {
      saveDraft(true);
    });
    elements.retryCategories.addEventListener("click", loadCategories);
    elements.priority.addEventListener("change", updateCriticalWarning);
    elements.useLocation.addEventListener("click", fillCurrentLocation);
    elements.imageInput.addEventListener("change", handleImageSelection);

    elements.form.addEventListener("input", function (event) {
      markDirty();
      updateCharacterCounts();
      updateNextButtonState();
      handleLocationInput(event.target);
      clearFieldError(event.target);
      scheduleDraftSave();
    });

    elements.form.addEventListener("change", function (event) {
      markDirty();
      updateReporterMode();
      updateCriticalWarning();
      updateNextButtonState();
      handleLocationInput(event.target);
      clearFieldError(event.target);
      scheduleDraftSave();
    });
  }

  async function loadCategories() {
    showCategoryState("loading");

    try {
      const response = await window.KPR_API.read("category.list", {});
      state.categories = Array.isArray(response.data.items) ? response.data.items : [];
      renderCategories();
      applyInitialCategorySelection();
      showCategoryState(state.categories.length > 0 ? "success" : "empty");
    } catch (error) {
      setText(elements.categoryErrorMessage, getErrorMessage(error));
      showCategoryState("error");
    }
  }

  function renderCategories() {
    clearChildren(elements.categoryList);

    state.categories.forEach(function (category) {
      elements.categoryList.appendChild(createCategoryButton(category));
    });
  }

  function createCategoryButton(category) {
    const categoryId = toText(category.categoryId || category.code);
    const button = document.createElement("button");
    const top = document.createElement("span");
    const icon = document.createElement("span");
    const title = document.createElement("strong");
    const description = document.createElement("p");
    const meta = document.createElement("small");

    button.type = "button";
    button.className = "report-category-card";
    button.setAttribute("aria-pressed", categoryId === state.selectedCategoryId ? "true" : "false");
    button.dataset.categoryId = categoryId;

    top.className = "report-category-card__top";
    icon.className = "report-category-card__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = getCategoryLabel(category);
    title.textContent = toText(category.name) || "หมวดปัญหา";
    description.textContent = toText(category.description) || "แจ้งรายละเอียดปัญหาในหมวดนี้";
    meta.textContent = formatTargetDays(category.targetDays);

    top.appendChild(icon);
    top.appendChild(title);
    button.appendChild(top);
    button.appendChild(description);
    button.appendChild(meta);
    button.addEventListener("click", function () {
      selectCategory(categoryId);
    });

    return button;
  }

  function applyInitialCategorySelection() {
    const wantedCategoryId = state.queryCategoryId || state.selectedCategoryId || getFieldValue("categoryId");

    if (!wantedCategoryId) {
      return;
    }

    const found = state.categories.some(function (category) {
      return toText(category.categoryId || category.code) === wantedCategoryId;
    });

    if (found) {
      selectCategory(wantedCategoryId);
    }
  }

  function selectCategory(categoryId) {
    state.selectedCategoryId = toText(categoryId);
    setFieldValue("categoryId", state.selectedCategoryId);
    clearError("categoryId");
    markDirty();
    saveDraft(false);

    document.querySelectorAll(".report-category-card").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.categoryId === state.selectedCategoryId ? "true" : "false");
    });

    updateNextButtonState();
  }

  function goNext() {
    if (elements.nextButton.disabled) {
      return;
    }

    if (state.currentStep === state.maxStep) {
      validateAllSteps();
      return;
    }

    if (!validateStep(state.currentStep)) {
      focusFirstError();
      return;
    }

    state.currentStep += 1;
    saveDraft(false);
    updateStep();
    scrollToFormTop();
  }

  function goBack() {
    if (state.currentStep === 1) {
      window.location.href = "index.html";
      return;
    }

    state.currentStep -= 1;
    saveDraft(false);
    updateStep();
    scrollToFormTop();
  }

  function updateStep() {
    elements.panels.forEach(function (panel) {
      panel.hidden = Number(panel.dataset.stepPanel) !== state.currentStep;
    });

    elements.stepperItems.forEach(function (item) {
      const isCurrent = Number(item.dataset.stepperItem) === state.currentStep;

      if (isCurrent) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
    });

    elements.backButton.textContent = state.currentStep === 1 ? "กลับหน้าแรก" : "ย้อนกลับ";
    elements.nextButton.textContent = state.currentStep === state.maxStep ? "ตรวจสอบข้อมูล" : "ถัดไป";
    updateNextButtonState();

    if (state.currentStep === state.maxStep) {
      renderReview();
    }
  }

  function updateNextButtonState() {
    if (!elements.nextButton) {
      return;
    }

    elements.nextButton.disabled = state.currentStep === 1 && !getFieldValue("categoryId");
  }

  function validateStep(step) {
    clearStepErrors(step);

    if (step === 1) {
      return validateCategoryStep();
    }

    if (step === 2) {
      return validateDetailsStep();
    }

    if (step === 3) {
      return validateLocationStep();
    }

    if (step === 4) {
      return validateImagesStep();
    }

    if (step === 5) {
      return validateReporterStep();
    }

    return true;
  }

  function validateCategoryStep() {
    if (!getFieldValue("categoryId")) {
      setError("categoryId", "กรุณาเลือกหมวดปัญหา");
      return false;
    }

    return true;
  }

  function validateDetailsStep() {
    let isValid = true;
    const title = getFieldValue("title");
    const description = getFieldValue("description");
    const incidentDate = getFieldValue("incidentDate");
    const priority = getFieldValue("priorityReported");

    if (!validateRequired("title", title, "กรุณากรอกหัวข้อปัญหา")) {
      isValid = false;
    } else if (!window.KPR_VALIDATION.minLength(title, 5).isValid) {
      setError("title", "กรุณากรอกหัวข้ออย่างน้อย 5 ตัวอักษร");
      isValid = false;
    } else if (!window.KPR_VALIDATION.maxLength(title, 150).isValid) {
      setError("title", "กรุณากรอกหัวข้อไม่เกิน 150 ตัวอักษร");
      isValid = false;
    }

    if (!validateRequired("description", description, "กรุณาอธิบายรายละเอียดปัญหา")) {
      isValid = false;
    } else if (!window.KPR_VALIDATION.minLength(description, 10).isValid) {
      setError("description", "กรุณาอธิบายรายละเอียดอย่างน้อย 10 ตัวอักษร");
      isValid = false;
    } else if (!window.KPR_VALIDATION.maxLength(description, 3000).isValid) {
      setError("description", "กรุณาอธิบายรายละเอียดไม่เกิน 3000 ตัวอักษร");
      isValid = false;
    }

    if (!validateRequired("incidentDate", incidentDate, "กรุณาระบุวันที่พบปัญหา")) {
      isValid = false;
    } else if (!window.KPR_VALIDATION.date(incidentDate).isValid) {
      setError("incidentDate", "กรุณาระบุวันที่ให้ถูกต้อง");
      isValid = false;
    } else if (!window.KPR_VALIDATION.notFutureDate(incidentDate).isValid) {
      setError("incidentDate", "วันที่พบปัญหาต้องไม่เป็นวันในอนาคต");
      isValid = false;
    }

    if (!window.KPR_VALIDATION.allowedValue(priority, PRIORITY_VALUES).isValid) {
      setError("priorityReported", "กรุณาเลือกระดับความเร่งด่วน");
      isValid = false;
    }

    return isValid;
  }

  function validateLocationStep() {
    let isValid = true;
    const locationName = getFieldValue("locationName");
    const landmark = getFieldValue("landmark");
    const latitude = getFieldValue("latitude");
    const longitude = getFieldValue("longitude");
    const coordinateResult = window.KPR_VALIDATION.latLng(latitude, longitude);

    if (!locationName && !landmark) {
      setError("locationName", "กรุณาระบุชื่อสถานที่หรือจุดสังเกตอย่างน้อยหนึ่งรายการ");
      setError("landmark", "กรุณาระบุชื่อสถานที่หรือจุดสังเกตอย่างน้อยหนึ่งรายการ");
      isValid = false;
    }

    if (!coordinateResult.isValid) {
      setError("coordinates", coordinateResult.message);
      isValid = false;
    }

    return isValid;
  }

  function validateImagesStep() {
    if (state.images.length > getMaxImages()) {
      setError("images", "เพิ่มรูปได้สูงสุด " + getMaxImages() + " รูป");
      return false;
    }

    return true;
  }

  function validateReporterStep() {
    let isValid = true;
    const isAnonymous = getReporterMode() === "anonymous";

    if (!isAnonymous) {
      if (!validateRequired("reporterName", getFieldValue("reporterName"), "กรุณากรอกชื่อผู้แจ้ง")) {
        isValid = false;
      }

      if (!validateRequired("reporterPhone", getFieldValue("reporterPhone"), "กรุณากรอกเบอร์โทรศัพท์")) {
        isValid = false;
      } else {
        const phoneResult = window.KPR_VALIDATION.phone(getFieldValue("reporterPhone"));
        if (!phoneResult.isValid) {
          setError("reporterPhone", phoneResult.message);
          isValid = false;
        }
      }

      const emailResult = window.KPR_VALIDATION.email(getFieldValue("reporterEmail"));
      if (!emailResult.isValid) {
        setError("reporterEmail", emailResult.message);
        isValid = false;
      }
    }

    if (!isChecked("truthConfirmed")) {
      setError("truthConfirmed", "กรุณายืนยันว่าข้อมูลเป็นความจริง");
      isValid = false;
    }

    if (!isChecked("privacyAccepted")) {
      setError("privacyAccepted", "กรุณายอมรับนโยบายความเป็นส่วนตัวและเงื่อนไขการใช้งาน");
      isValid = false;
    }

    return isValid;
  }

  function validateAllSteps() {
    let firstInvalidStep = 0;

    for (let step = 1; step <= state.maxStep - 1; step += 1) {
      if (!validateStep(step) && firstInvalidStep === 0) {
        firstInvalidStep = step;
      }
    }

    if (firstInvalidStep > 0) {
      state.currentStep = firstInvalidStep;
      updateStep();
      focusFirstError();
      setStatus("กรุณาตรวจสอบข้อมูลในขั้นที่ " + firstInvalidStep);
      return;
    }

    renderReview();
    setHidden(elements.reviewSuccess, false);
    setStatus("ข้อมูลครบถ้วนแล้ว แต่ยังไม่ได้ส่ง API จริงในขั้นตอนนี้");
  }

  function validateRequired(fieldName, value, message) {
    const result = window.KPR_VALIDATION.required(value, message);

    if (!result.isValid) {
      setError(fieldName, result.message);
    }

    return result.isValid;
  }

  function clearStepErrors(step) {
    const panel = document.querySelector("[data-step-panel='" + step + "']");

    if (!panel) {
      return;
    }

    panel.querySelectorAll("[data-error-for]").forEach(function (element) {
      element.textContent = "";
    });
  }

  function setError(fieldName, message) {
    const error = document.querySelector("[data-error-for='" + fieldName + "']");
    const field = getField(fieldName);

    if (error) {
      error.textContent = message;
    }

    if (fieldName === "coordinates") {
      setCoordinateFieldsInvalid(error);
      return;
    }

    if (field && error && error.id) {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", mergeDescribedBy(field.getAttribute("aria-describedby"), error.id));
    }
  }

  function clearError(fieldName) {
    const error = document.querySelector("[data-error-for='" + fieldName + "']");
    const field = getField(fieldName);

    if (error) {
      error.textContent = "";
    }

    if (fieldName === "coordinates") {
      clearCoordinateFieldsInvalid();
      return;
    }

    if (field) {
      field.removeAttribute("aria-invalid");
    }
  }

  function clearFieldError(field) {
    if (!field || !field.dataset || !field.dataset.field) {
      return;
    }

    clearError(field.dataset.field);
  }

  function focusFirstError() {
    const firstError = Array.from(document.querySelectorAll(".form-error")).find(function (error) {
      return error.textContent.trim().length > 0;
    });

    if (!firstError) {
      return;
    }

    const fieldName = firstError.getAttribute("data-error-for");
    const field = fieldName === "coordinates" ? getField("latitude") : getField(fieldName);

    if (field) {
      field.focus();
      field.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function updateCharacterCounts() {
    setCount("title", getFieldValue("title").length);
    setCount("description", getFieldValue("description").length);
  }

  function setCount(fieldName, count) {
    const element = document.querySelector("[data-count-for='" + fieldName + "']");

    if (element) {
      element.textContent = String(count);
    }
  }

  function updateCriticalWarning() {
    setHidden(elements.criticalWarning, getFieldValue("priorityReported") !== "critical");
  }

  function updateReporterMode() {
    const isAnonymous = getReporterMode() === "anonymous";

    setHidden(elements.reporterFields, isAnonymous);
    setHidden(elements.anonymousNote, !isAnonymous);
  }

  async function fillCurrentLocation() {
    if (!window.KPR_LOCATION || !window.KPR_LOCATION.isSupported()) {
      showLocationMessage("เบราว์เซอร์นี้ไม่รองรับการใช้ตำแหน่งปัจจุบัน กรุณากรอกสถานที่เอง", "warning");
      return;
    }

    showLocationMessage("กำลังขอตำแหน่งปัจจุบัน...", "info");
    elements.useLocation.disabled = true;

    try {
      const position = await window.KPR_LOCATION.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      setFieldValue("latitude", position.latitude);
      setFieldValue("longitude", position.longitude);
      syncMapFromCoordinates();
      clearError("coordinates");
      markDirty();
      saveDraft(false);
      showLocationMessage("เติมพิกัดปัจจุบันแล้ว คุณยังสามารถแก้ไขสถานที่หรือพิกัดเองได้", "success");
    } catch (error) {
      showLocationMessage(getLocationErrorMessage(error), "warning");
    } finally {
      elements.useLocation.disabled = false;
    }
  }

  function showLocationMessage(message, type) {
    elements.locationMessage.className = "alert alert-" + (type === "success" ? "success" : type === "warning" ? "warning" : "info");
    setText(elements.locationMessage, message);
    setHidden(elements.locationMessage, false);
  }

  function handleLocationInput(field) {
    if (!field || !field.dataset || !field.dataset.field) {
      return;
    }

    if (field.dataset.field === "latitude" || field.dataset.field === "longitude") {
      clearError("coordinates");
      syncMapFromCoordinates();
    }

    if (field.dataset.field === "mapUrl") {
      syncMapFromCoordinates();
    }

    if (field.dataset.field === "locationName" || field.dataset.field === "landmark") {
      clearError("locationName");
      clearError("landmark");
    }
  }

  function syncMapFromCoordinates() {
    const latitude = getFieldValue("latitude");
    const longitude = getFieldValue("longitude");
    const hasLocationHelper = window.KPR_LOCATION && typeof window.KPR_LOCATION.buildGoogleMapsUrl === "function";
    const mapUrl = hasLocationHelper ? window.KPR_LOCATION.buildGoogleMapsUrl(latitude, longitude) : "";
    const coordinateText = hasLocationHelper ? window.KPR_LOCATION.formatCoordinates(latitude, longitude) : "";

    if (mapUrl) {
      setFieldValue("mapUrl", mapUrl);
      updateMapLink(mapUrl);
      setText(elements.coordinateText, "พิกัดที่เลือก: " + coordinateText);
      setHidden(elements.coordinatePreview, false);
    } else {
      updateMapLink(getFieldValue("mapUrl") || "https://maps.google.com/");
      setText(elements.coordinateText, "");
      setHidden(elements.coordinatePreview, true);
    }
  }

  function updateMapLink(url) {
    if (elements.mapLink) {
      elements.mapLink.href = url;
    }
  }

  function setCoordinateFieldsInvalid(error) {
    ["latitude", "longitude"].forEach(function (fieldName) {
      const field = getField(fieldName);

      if (field && error && error.id) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", mergeDescribedBy(field.getAttribute("aria-describedby"), error.id));
      }
    });
  }

  function clearCoordinateFieldsInvalid() {
    ["latitude", "longitude"].forEach(function (fieldName) {
      const field = getField(fieldName);

      if (field) {
        field.removeAttribute("aria-invalid");
      }
    });
  }

  function getLocationErrorMessage(error) {
    if (error && error.message) {
      return error.message;
    }

    return "ไม่สามารถใช้ตำแหน่งปัจจุบันได้ กรุณากรอกสถานที่เอง";
  }

  function handleImageSelection(event) {
    const files = Array.from(event.target.files || []);
    const maxImages = getMaxImages();
    const nextImages = state.images.slice();

    clearError("images");

    files.some(function (file) {
      if (nextImages.length >= maxImages) {
        setError("images", "เพิ่มรูปได้สูงสุด " + maxImages + " รูป");
        return true;
      }

      if (ALLOWED_IMAGE_TYPES.indexOf(file.type) === -1) {
        setError("images", "รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
        return false;
      }

      if (file.size > getMaxImageSizeBytes()) {
        setError("images", "รูปนี้มีขนาดใหญ่กว่า " + getMaxImageSizeMb() + " MB");
        return false;
      }

      nextImages.push(file);
      return false;
    });

    state.images = nextImages;
    elements.imageInput.value = "";
    markDirty();
    renderImages();
  }

  function renderImages() {
    clearObjectUrls();
    clearChildren(elements.imageList);

    state.images.forEach(function (file, index) {
      const item = document.createElement("div");
      const image = document.createElement("img");
      const detail = document.createElement("div");
      const name = document.createElement("strong");
      const meta = document.createElement("small");
      const removeButton = document.createElement("button");
      const objectUrl = URL.createObjectURL(file);

      state.objectUrls.push(objectUrl);
      item.className = "report-image-item";
      image.className = "report-image-thumb";
      image.src = objectUrl;
      image.alt = "ตัวอย่างรูปภาพ " + (index + 1);
      name.textContent = file.name;
      meta.textContent = formatFileSize(file.size);
      removeButton.className = "button button-small button-outline";
      removeButton.type = "button";
      removeButton.textContent = "ลบ";
      removeButton.addEventListener("click", function () {
        state.images.splice(index, 1);
        markDirty();
        renderImages();
      });

      detail.appendChild(name);
      detail.appendChild(meta);
      item.appendChild(image);
      item.appendChild(detail);
      item.appendChild(removeButton);
      elements.imageList.appendChild(item);
    });

    setHidden(elements.imageEmpty, state.images.length > 0);
    setHidden(elements.imageList, state.images.length === 0);
  }

  function renderReview() {
    clearChildren(elements.reviewList);
    setHidden(elements.reviewSuccess, true);

    const category = getSelectedCategory();
    const items = [
      ["หมวด", category ? category.name : "-"],
      ["หัวข้อ", getFieldValue("title") || "-"],
      ["รายละเอียด", getFieldValue("description") || "-"],
      ["วันที่พบปัญหา", formatThaiDate(getFieldValue("incidentDate")) || "-"],
      ["ความเร่งด่วน", getPriorityLabel(getFieldValue("priorityReported"))],
      ["สถานที่", buildLocationSummary()],
      ["รูปภาพ", state.images.length + " รูป"],
      ["รูปแบบการแจ้ง", getReporterMode() === "anonymous" ? "ไม่ระบุตัวตน" : "ระบุตัวตน"],
      ["ช่องทางติดต่อ", getReporterMode() === "anonymous" ? "ไม่ระบุ" : getContactSummary()]
    ];

    items.forEach(function (item) {
      const wrapper = document.createElement("article");
      const title = document.createElement("h3");
      const value = document.createElement("p");

      wrapper.className = "report-review-item";
      title.textContent = item[0];
      value.textContent = item[1];
      wrapper.appendChild(title);
      wrapper.appendChild(value);
      elements.reviewList.appendChild(wrapper);
    });
  }

  function saveDraft(showMessage) {
    const draft = collectSafeDraft();

    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      if (showMessage) {
        setStatus("บันทึกแบบร่างแล้ว ข้อมูลติดต่อส่วนตัวและรูปภาพจะไม่ถูกเก็บ");
      }
    } catch (error) {
      if (showMessage) {
        setStatus("ไม่สามารถบันทึกแบบร่างในเบราว์เซอร์นี้ได้");
      }
    }
  }

  const scheduleDraftSave = debounce(function () {
    saveDraft(false);
  }, 500);

  function restoreDraft() {
    const draft = readDraft();

    if (!draft) {
      return;
    }

    state.currentStep = clampStep(draft.currentStep || 1);
    state.selectedCategoryId = toText(draft.categoryId);
    Object.keys(draft.fields || {}).forEach(function (fieldName) {
      setFieldValue(fieldName, draft.fields[fieldName]);
    });
    setFieldValue("categoryId", state.selectedCategoryId);
    setHidden(elements.draftRestored, false);
    state.isDirty = true;
  }

  function readDraft() {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || Date.now() - Number(parsed.savedAt || 0) > MAX_DRAFT_AGE_MS) {
        window.localStorage.removeItem(DRAFT_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }

  function collectSafeDraft() {
    return {
      savedAt: Date.now(),
      currentStep: state.currentStep,
      categoryId: getFieldValue("categoryId"),
      fields: {
        title: getFieldValue("title"),
        description: getFieldValue("description"),
        incidentDate: getFieldValue("incidentDate"),
        priorityReported: getFieldValue("priorityReported"),
        locationName: getFieldValue("locationName"),
        villageNo: getFieldValue("villageNo"),
        landmark: getFieldValue("landmark")
      }
    };
  }

  function handleBeforeUnload(event) {
    if (!state.isDirty || state.hasSubmitted) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  }

  function markDirty() {
    state.isDirty = true;
  }

  function setDefaultDate() {
    if (!getFieldValue("incidentDate")) {
      setFieldValue("incidentDate", new Date().toISOString().slice(0, 10));
    }

    if (!getFieldValue("priorityReported")) {
      setFieldValue("priorityReported", "normal");
    }
  }

  function showCategoryState(stateName) {
    setHidden(elements.categoryLoading, stateName !== "loading");
    setHidden(elements.categoryEmpty, stateName !== "empty");
    setHidden(elements.categoryError, stateName !== "error");
    setHidden(elements.categoryList, stateName !== "success");
    updateNextButtonState();
  }

  function getSelectedCategory() {
    return state.categories.find(function (category) {
      return toText(category.categoryId || category.code) === getFieldValue("categoryId");
    }) || null;
  }

  function getReporterMode() {
    const checked = document.querySelector("input[name='reporterMode']:checked");

    return checked ? checked.value : "identified";
  }

  function getContactSummary() {
    const method = getFieldValue("contactMethod");

    if (method === "email") {
      return "อีเมล";
    }

    if (method === "none") {
      return "ไม่ต้องการให้ติดต่อกลับ";
    }

    return "โทรศัพท์";
  }

  function buildLocationSummary() {
    const parts = [
      getFieldValue("locationName"),
      getFieldValue("villageNo") ? "หมู่ " + getFieldValue("villageNo") : "",
      getFieldValue("landmark")
    ].filter(Boolean);
    const coordinates = getFieldValue("latitude") && getFieldValue("longitude")
      ? "พิกัด " + getFieldValue("latitude") + ", " + getFieldValue("longitude")
      : "";

    if (coordinates) {
      parts.push(coordinates);
    }

    return parts.length ? parts.join(" / ") : "-";
  }

  function getField(fieldName) {
    return document.querySelector("[data-field='" + fieldName + "']");
  }

  function getFieldValue(fieldName) {
    const field = getField(fieldName);

    if (!field) {
      return "";
    }

    if (field.type === "checkbox") {
      return field.checked ? "true" : "";
    }

    return toText(field.value).trim();
  }

  function setFieldValue(fieldName, value) {
    const field = getField(fieldName);

    if (!field) {
      return;
    }

    if (field.type === "checkbox") {
      field.checked = value === true || value === "true";
      return;
    }

    field.value = toText(value);
  }

  function isChecked(fieldName) {
    const field = getField(fieldName);

    return !!field && field.checked;
  }

  function setStatus(message) {
    setText(elements.formStatus, message);
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = hidden;
    }
  }

  function setText(element, value) {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.setText === "function") {
      window.KPR_UTILS.setText(element, value);
      return;
    }

    if (element) {
      element.textContent = toText(value);
    }
  }

  function clearChildren(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function clearObjectUrls() {
    state.objectUrls.forEach(function (url) {
      URL.revokeObjectURL(url);
    });
    state.objectUrls = [];
  }

  function mergeDescribedBy(currentValue, errorId) {
    const values = toText(currentValue).split(/\s+/).filter(Boolean);

    if (values.indexOf(errorId) === -1) {
      values.push(errorId);
    }

    return values.join(" ");
  }

  function scrollToFormTop() {
    document.querySelector(".report-form-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function getErrorMessage(error) {
    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return "ไม่สามารถเชื่อมต่อระบบได้";
  }

  function getCategoryLabel(category) {
    const code = toText(category.code).trim();
    const name = toText(category.name).trim();

    if (code) {
      return code.slice(0, 2).toUpperCase();
    }

    return name ? name.slice(0, 1) : "KR";
  }

  function formatTargetDays(value) {
    const days = Number(value);

    if (!Number.isFinite(days) || days <= 0) {
      return "ระยะเวลาดำเนินการขึ้นอยู่กับประเภทปัญหา";
    }

    return "เป้าหมายดำเนินการ " + days + " วัน";
  }

  function getPriorityLabel(value) {
    const labels = {
      low: "ไม่เร่งด่วน",
      normal: "ปกติ",
      high: "ควรรีบดำเนินการ",
      critical: "วิกฤตหรือเสี่ยงอันตราย"
    };

    return labels[value] || "-";
  }

  function formatThaiDate(value) {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.formatThaiDate === "function") {
      return window.KPR_UTILS.formatThaiDate(value);
    }

    return value;
  }

  function getMaxImages() {
    const config = window.APP_CONFIG || {};
    const value = Number(config.MAX_IMAGES);

    return Number.isFinite(value) && value > 0 ? value : 3;
  }

  function getMaxImageSizeMb() {
    const config = window.APP_CONFIG || {};
    const value = Number(config.MAX_IMAGE_SIZE_MB);

    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function getMaxImageSizeBytes() {
    return getMaxImageSizeMb() * 1024 * 1024;
  }

  function formatFileSize(bytes) {
    const size = Number(bytes);

    if (!Number.isFinite(size)) {
      return "";
    }

    return (size / 1024 / 1024).toFixed(2) + " MB";
  }

  function clampStep(step) {
    const parsedStep = Number(step);

    if (!Number.isFinite(parsedStep)) {
      return 1;
    }

    return Math.min(Math.max(Math.round(parsedStep), 1), state.maxStep);
  }

  function toText(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function debounce(callback, delay) {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.debounce === "function") {
      return window.KPR_UTILS.debounce(callback, delay);
    }

    let timeoutId = null;

    return function debouncedCallback() {
      const context = this;
      const args = arguments;

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function () {
        callback.apply(context, args);
      }, delay);
    };
  }
})();
