(function () {
  "use strict";

  const DRAFT_KEY = "KPR_REPORT_DRAFT_V1";
  const RESULT_KEY = "KPR_REPORT_RESULT_V1";
  const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const PRIORITY_VALUES = ["low", "normal", "high", "critical"];
  const CONTACT_METHOD_VALUES = ["phone", "email", "none"];

  const state = {
    categories: [],
    selectedCategoryId: "",
    images: [],
    objectUrls: [],
    previewPayload: null,
    isSubmitting: false,
    isDirty: false,
    hasSubmitted: false,
    queryCategoryId: "",
    publicConfig: null,
    publicConfigPromise: null
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
    loadPublicConfig();
    loadCategories();
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", clearObjectUrls);
  }

  function cacheElements() {
    elements.form = document.querySelector("[data-report-form]");
    elements.submitButton = document.querySelector("[data-submit-report]");
    elements.saveDraftButton = document.querySelector("[data-save-draft]");
    elements.formStatus = document.querySelector("[data-form-status]");

    elements.categoryId = document.querySelector("[data-field='categoryId']");
    elements.categoryLoading = document.querySelector("[data-category-loading]");
    elements.categoryEmpty = document.querySelector("[data-category-empty]");
    elements.categoryError = document.querySelector("[data-category-error]");
    elements.categoryErrorMessage = document.querySelector("[data-category-error-message]");
    elements.categorySelectWrap = document.querySelector("[data-category-select-wrap]");
    elements.categorySelect = document.querySelector("[data-category-select]");
    elements.retryCategories = document.querySelector("[data-retry-categories]");

    elements.priority = document.querySelector("[data-field='priorityReported']");
    elements.criticalWarning = document.querySelector("[data-critical-warning]");
    elements.useLocation = document.querySelector("[data-use-location]");
    elements.locationMessage = document.querySelector("[data-location-message]");
    elements.coordinatePreview = document.querySelector("[data-coordinate-preview]");
    elements.coordinateText = document.querySelector("[data-coordinate-text]");
    elements.mapLink = document.querySelector("[data-map-link]");
    elements.imageInput = document.querySelector("[data-image-input]");
    elements.imageStatus = document.querySelector("[data-image-status]");
    elements.imageEmpty = document.querySelector("[data-image-empty]");
    elements.imageList = document.querySelector("[data-image-list]");
    elements.reporterFields = document.querySelector("[data-reporter-fields]");
    elements.anonymousNote = document.querySelector("[data-anonymous-note]");
    elements.reviewList = document.querySelector("[data-review-list]");
    elements.reviewSuccess = document.querySelector("[data-review-success]");
  }

  function bindEvents() {
    elements.saveDraftButton.addEventListener("click", function () {
      saveDraft(true);
    });
    elements.form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitReport();
    });
    elements.categorySelect.addEventListener("change", function () {
      selectCategory(elements.categorySelect.value);
    });
    elements.retryCategories.addEventListener("click", loadCategories);
    elements.priority.addEventListener("change", updateCriticalWarning);
    elements.useLocation.addEventListener("click", fillCurrentLocation);
    elements.imageInput.addEventListener("change", handleImageSelection);

    elements.form.addEventListener("input", function (event) {
      markDirty();
      updateCharacterCounts();
      handleLocationInput(event.target);
      clearFieldError(event.target);
      scheduleDraftSave();
    });

    elements.form.addEventListener("change", function (event) {
      markDirty();
      updateReporterMode();
      updateCriticalWarning();
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

  async function loadPublicConfig() {
    if (!window.KPR_API || typeof window.KPR_API.read !== "function") {
      return null;
    }

    if (state.publicConfig) {
      return state.publicConfig;
    }

    if (state.publicConfigPromise) {
      return state.publicConfigPromise;
    }

    state.publicConfigPromise = window.KPR_API.read("public.config", {})
      .then(function (response) {
        state.publicConfig = response && response.data ? response.data : {};
        return state.publicConfig;
      })
      .catch(function () {
        state.publicConfig = null;
        return null;
      })
      .finally(function () {
        state.publicConfigPromise = null;
      });

    return state.publicConfigPromise;
  }

  function renderCategories() {
    clearChildren(elements.categorySelect);
    elements.categorySelect.appendChild(new Option("เลือกหมวดหมู่ปัญหา", ""));

    state.categories.forEach(function (category) {
      const categoryId = toText(category.categoryId || category.code);
      const categoryName = toText(category.name || category.code || categoryId);

      elements.categorySelect.appendChild(new Option(categoryName, categoryId));
    });
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
    if (getActiveImageCount() > getMaxImages()) {
      setError("images", "เพิ่มรูปได้สูงสุด " + getMaxImages() + " รูป");
      return false;
    }

    if (state.images.some(function (image) { return image.status === "compressing"; })) {
      setError("images", "กรุณารอให้ระบบบีบอัดรูปภาพให้เสร็จก่อน");
      return false;
    }

    if (state.images.some(function (image) { return image.status === "error"; })) {
      setError("images", "กรุณาลบรูปที่มีปัญหา หรือเลือกไฟล์ใหม่อีกครั้ง");
      return false;
    }

    return true;
  }

  function validateReporterStep() {
    let isValid = true;
    const isAnonymous = getReporterMode() === "anonymous";
    const contactMethod = getFieldValue("contactMethod") || "phone";

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

      if (!window.KPR_VALIDATION.allowedValue(contactMethod, CONTACT_METHOD_VALUES).isValid) {
        setError("contactMethod", "กรุณาเลือกช่องทางติดต่อให้ถูกต้อง");
        isValid = false;
      }

      if (contactMethod === "email" && !getFieldValue("reporterEmail")) {
        setError("reporterEmail", "กรุณากรอกอีเมลเมื่อเลือกให้อีเมลเป็นช่องทางติดต่อ");
        isValid = false;
      }
    }

    return isValid;
  }

  function validateConsentStep() {
    let isValid = true;

    clearSectionErrors("consent");

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
    const validators = [
      {
        section: "category",
        validate: validateCategoryStep
      },
      {
        section: "details",
        validate: validateDetailsStep
      },
      {
        section: "location",
        validate: validateLocationStep
      },
      {
        section: "images",
        validate: validateImagesStep
      },
      {
        section: "reporter",
        validate: validateReporterStep
      }
    ];
    let isValid = true;

    validators.forEach(function (item) {
      clearSectionErrors(item.section);

      if (!item.validate()) {
        isValid = false;
      }
    });

    if (!isValid) {
      focusFirstError();
      setStatus("กรุณาตรวจสอบข้อมูลที่จำเป็นก่อนส่งเรื่อง");
      return false;
    }

    return true;
  }

  async function submitReport() {
    if (state.isSubmitting) {
      return;
    }

    if (!validateAllSteps()) {
      return;
    }

    if (!validateConsentStep()) {
      focusFirstError();
      setStatus("กรุณายืนยันข้อมูลก่อนส่งเรื่อง");
      return;
    }

    if (!window.KPR_API || typeof window.KPR_API.write !== "function") {
      setStatus("ไม่พบ API Client กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง");
      return;
    }

    const requestId = createRequestId();
    setSubmittingState(true);
    setHidden(elements.reviewSuccess, false);
    setStatus("กำลังส่งเรื่อง กรุณารอสักครู่...");

    try {
      const payload = await buildReportSubmitPayload();
      state.previewPayload = payload;

      const response = await window.KPR_API.write("report.create", payload, {
        requestId: requestId
      });

      handleSubmitSuccess(response, requestId, payload);
    } catch (error) {
      handleSubmitError(error);
    } finally {
      if (!state.hasSubmitted) {
        setHidden(elements.reviewSuccess, true);
        setSubmittingState(false);
      }
    }
  }

  function validateRequired(fieldName, value, message) {
    const result = window.KPR_VALIDATION.required(value, message);

    if (!result.isValid) {
      setError(fieldName, result.message);
    }

    return result.isValid;
  }

  function clearSectionErrors(sectionName) {
    const panel = document.querySelector("[data-report-section='" + sectionName + "']");

    if (!panel) {
      return;
    }

    panel.querySelectorAll("[data-error-for]").forEach(function (element) {
      clearError(element.getAttribute("data-error-for"));
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

  function setSubmittingState(isSubmitting) {
    state.isSubmitting = isSubmitting;

    if (elements.saveDraftButton) {
      elements.saveDraftButton.disabled = isSubmitting;
    }

    if (elements.submitButton) {
      elements.submitButton.disabled = isSubmitting;
      elements.submitButton.setAttribute("aria-busy", isSubmitting ? "true" : "false");
      elements.submitButton.textContent = isSubmitting ? "กำลังส่ง..." : "ส่ง";
    }
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

    if (elements.reporterFields) {
      elements.reporterFields.querySelectorAll("input, select, textarea").forEach(function (field) {
        field.disabled = isAnonymous;
      });
    }

    if (isAnonymous) {
      setFieldValue("contactMethod", "none");
      clearError("reporterName");
      clearError("reporterPhone");
      clearError("reporterEmail");
      clearError("contactMethod");
    }
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

  async function handleImageSelection(event) {
    const files = Array.from(event.target.files || []);
    const maxImages = getMaxImages();

    clearError("images");
    setImageStatus("");

    if (!files.length) {
      return;
    }

    if (!window.KPR_IMAGE_COMPRESS || !window.KPR_IMAGE_COMPRESS.isSupported()) {
      setError("images", "เบราว์เซอร์นี้ไม่รองรับการบีบอัดรูปภาพ กรุณาลองใช้เบราว์เซอร์รุ่นใหม่");
      elements.imageInput.value = "";
      return;
    }

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      if (getActiveImageCount() >= maxImages) {
        setError("images", "เพิ่มรูปได้สูงสุด " + maxImages + " รูป");
        break;
      }

      if (!isAllowedImageType(file)) {
        addImageError(file, "รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
        continue;
      }

      await addAndCompressImage(file);
    }

    elements.imageInput.value = "";
    markDirty();
    renderImages();
    updateImageStatus();
  }

  function renderImages() {
    clearChildren(elements.imageList);

    state.images.forEach(function (imageItem, index) {
      const item = document.createElement("div");
      const preview = createImagePreview(imageItem, index);
      const detail = document.createElement("div");
      const name = document.createElement("strong");
      const meta = document.createElement("small");
      const status = document.createElement("p");
      const removeButton = document.createElement("button");

      item.className = "report-image-item report-image-item--" + imageItem.status;
      detail.className = "report-image-detail";
      name.textContent = imageItem.fileName || imageItem.sourceFileName || "รูปภาพ " + (index + 1);
      meta.textContent = getImageMetaText(imageItem);
      status.className = imageItem.status === "error" ? "report-image-error" : "report-image-status";
      status.textContent = getImageStatusText(imageItem);
      removeButton.className = "button button-small button-outline";
      removeButton.type = "button";
      removeButton.textContent = "ลบ";
      removeButton.addEventListener("click", function () {
        removeImage(imageItem.id);
        markDirty();
        renderImages();
        updateImageStatus();
      });

      detail.appendChild(name);
      detail.appendChild(meta);
      if (status.textContent) {
        detail.appendChild(status);
      }

      item.appendChild(preview);
      item.appendChild(detail);
      item.appendChild(removeButton);
      elements.imageList.appendChild(item);
    });

    setHidden(elements.imageEmpty, state.images.length > 0);
    setHidden(elements.imageList, state.images.length === 0);
  }

  async function addAndCompressImage(file) {
    const imageItem = {
      id: createImageId(),
      status: "compressing",
      sourceFileName: file.name || "รูปภาพ",
      originalSize: file.size,
      fileName: file.name || "รูปภาพ",
      mimeType: file.type,
      fileSize: file.size,
      width: 0,
      height: 0,
      file: null,
      previewUrl: "",
      error: ""
    };

    state.images.push(imageItem);
    renderImages();
    updateImageStatus();

    try {
      const result = await window.KPR_IMAGE_COMPRESS.compress(file, {
        maxDimension: getMaxImageDimension(),
        maxSizeMb: getMaxImageSizeMb()
      });

      imageItem.status = "ready";
      imageItem.file = result.file;
      imageItem.fileName = result.fileName;
      imageItem.mimeType = result.mimeType;
      imageItem.fileSize = result.fileSize;
      imageItem.width = result.width;
      imageItem.height = result.height;
      imageItem.originalWidth = result.originalWidth;
      imageItem.originalHeight = result.originalHeight;
      imageItem.originalSize = result.originalSize;
      imageItem.wasCompressed = result.wasCompressed;
      imageItem.metadata = buildImageMetadata(imageItem);
      imageItem.previewUrl = URL.createObjectURL(result.file);
      clearError("images");
    } catch (error) {
      imageItem.status = "error";
      imageItem.error = error && error.message ? error.message : "ไม่สามารถบีบอัดรูปภาพนี้ได้";
    }

    renderImages();
    updateImageStatus();
  }

  function addImageError(file, message) {
    state.images.push({
      id: createImageId(),
      status: "error",
      sourceFileName: file && file.name ? file.name : "ไฟล์รูปภาพ",
      originalSize: file && file.size ? file.size : 0,
      fileName: file && file.name ? file.name : "ไฟล์รูปภาพ",
      mimeType: file && file.type ? file.type : "",
      fileSize: file && file.size ? file.size : 0,
      width: 0,
      height: 0,
      file: null,
      previewUrl: "",
      error: message
    });
    renderImages();
    updateImageStatus();
  }

  function createImagePreview(imageItem, index) {
    if (imageItem.previewUrl && imageItem.status === "ready") {
      const image = document.createElement("img");

      image.className = "report-image-thumb";
      image.src = imageItem.previewUrl;
      image.alt = "ตัวอย่างรูปภาพ " + (index + 1);
      return image;
    }

    const placeholder = document.createElement("div");

    placeholder.className = "report-image-thumb report-image-thumb--placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.textContent = imageItem.status === "compressing" ? "..." : "!";
    return placeholder;
  }

  function removeImage(imageId) {
    const index = state.images.findIndex(function (imageItem) {
      return imageItem.id === imageId;
    });

    if (index === -1) {
      return;
    }

    revokeImageUrl(state.images[index]);
    state.images.splice(index, 1);

    if (!state.images.some(function (imageItem) { return imageItem.status === "error"; })) {
      clearError("images");
    }
  }

  function revokeImageUrl(imageItem) {
    if (imageItem && imageItem.previewUrl) {
      URL.revokeObjectURL(imageItem.previewUrl);
      imageItem.previewUrl = "";
    }
  }

  function getImageMetaText(imageItem) {
    if (imageItem.status === "compressing") {
      return "กำลังบีบอัดรูปภาพ...";
    }

    if (imageItem.status === "error") {
      return imageItem.mimeType ? imageItem.mimeType : "ไฟล์นี้ไม่พร้อมใช้งาน";
    }

    return [
      formatFileSize(imageItem.fileSize),
      imageItem.width && imageItem.height ? imageItem.width + " x " + imageItem.height + " px" : "",
      getMimeLabel(imageItem.mimeType)
    ].filter(Boolean).join(" / ");
  }

  function getImageStatusText(imageItem) {
    if (imageItem.status === "compressing") {
      return "กำลังลดขนาดรูปและเตรียมตัวอย่าง";
    }

    if (imageItem.status === "error") {
      return imageItem.error || "รูปภาพนี้มีปัญหา";
    }

    if (imageItem.wasCompressed) {
      return "พร้อมส่ง บีบอัดจาก " + formatFileSize(imageItem.originalSize);
    }

    return "พร้อมส่ง";
  }

  function updateImageStatus() {
    const readyCount = getUploadableImages().length;
    const compressingCount = state.images.filter(function (imageItem) {
      return imageItem.status === "compressing";
    }).length;
    const errorCount = state.images.filter(function (imageItem) {
      return imageItem.status === "error";
    }).length;

    if (compressingCount > 0) {
      setImageStatus("กำลังบีบอัดรูปภาพ " + compressingCount + " รูป...");
      return;
    }

    if (errorCount > 0) {
      setImageStatus("มีรูปที่ต้องตรวจสอบ " + errorCount + " รูป");
      return;
    }

    if (readyCount > 0) {
      setImageStatus("เพิ่มรูปภาพพร้อมส่งแล้ว " + readyCount + "/" + getMaxImages() + " รูป");
      return;
    }

    setImageStatus("");
  }

  function setImageStatus(message) {
    setText(elements.imageStatus, message);
  }

  function getUploadableImages() {
    return state.images.filter(function (imageItem) {
      return imageItem.status === "ready" && imageItem.file;
    });
  }

  function getActiveImageCount() {
    return state.images.filter(function (imageItem) {
      return imageItem.status === "ready" || imageItem.status === "compressing";
    }).length;
  }

  function buildImageMetadata(imageItem) {
    return {
      fileName: imageItem.fileName,
      mimeType: imageItem.mimeType,
      fileSize: imageItem.fileSize,
      width: imageItem.width,
      height: imageItem.height
    };
  }

  function getImageMetadataList() {
    return getUploadableImages().map(function (imageItem) {
      return buildImageMetadata(imageItem);
    });
  }

  async function getAttachmentPayloadList() {
    const images = getUploadableImages();
    const attachments = [];

    for (let index = 0; index < images.length; index += 1) {
      const imageItem = images[index];
      const metadata = buildImageMetadata(imageItem);
      const base64 = await readFileAsBase64(imageItem.file);

      attachments.push(Object.assign({}, metadata, {
        base64: base64
      }));
    }

    return attachments;
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error("ไม่พบไฟล์รูปภาพสำหรับส่ง"));
        return;
      }

      const reader = new FileReader();

      reader.onload = function () {
        const result = toText(reader.result);
        const commaIndex = result.indexOf(",");
        resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1));
      };

      reader.onerror = function () {
        reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพเพื่อส่งได้"));
      };

      reader.readAsDataURL(file);
    });
  }

  function buildReportPayload() {
    const payload = {
      categoryId: getFieldValue("categoryId"),
      title: getFieldValue("title"),
      description: getFieldValue("description"),
      incidentDate: getFieldValue("incidentDate"),
      priorityReported: getFieldValue("priorityReported"),
      location: buildLocationPayload(),
      reporter: buildReporterPayload(),
      consent: {
        truthConfirmed: isChecked("truthConfirmed"),
        privacyAccepted: isChecked("privacyAccepted"),
        privacyVersion: getPrivacyVersion()
      },
      attachments: getImageMetadataList()
    };

    return payload;
  }

  async function buildReportSubmitPayload() {
    await loadPublicConfig();

    const payload = buildReportPayload();
    payload.attachments = await getAttachmentPayloadList();
    return payload;
  }

  function buildLocationPayload() {
    const latitude = getFieldValue("latitude");
    const longitude = getFieldValue("longitude");

    return {
      name: getFieldValue("locationName"),
      villageNo: getFieldValue("villageNo"),
      landmark: getFieldValue("landmark"),
      latitude: latitude ? Number(latitude) : "",
      longitude: longitude ? Number(longitude) : "",
      mapUrl: getFieldValue("mapUrl")
    };
  }

  function buildReporterPayload() {
    if (getReporterMode() === "anonymous") {
      return {
        isAnonymous: true,
        contactMethod: "none"
      };
    }

    return {
      isAnonymous: false,
      name: getFieldValue("reporterName"),
      phone: normalizePhone(getFieldValue("reporterPhone")),
      email: getFieldValue("reporterEmail"),
      contactMethod: getFieldValue("contactMethod") || "phone"
    };
  }

  function handleSubmitSuccess(response, requestId, payload) {
    const data = response && response.data ? response.data : {};

    state.hasSubmitted = true;
    state.isDirty = false;
    removeDraft();
    storeSubmitResult(data, requestId, payload);
    clearObjectUrls();
    window.location.href = "report-success.html";
  }

  function handleSubmitError(error) {
    if (error && error.code === "RATE_LIMITED") {
      setStatus(getRateLimitMessage(error));
      return;
    }

    applyApiFieldErrors(error && error.fields ? error.fields : {});

    if (hasFieldErrors(error)) {
      setStatus("กรุณาตรวจสอบข้อมูลที่ระบบแจ้งไว้ แล้วลองส่งอีกครั้ง");
      focusFirstError();
      return;
    }

    if (error && error.code === "NETWORK_ERROR") {
      setStatus("ไม่สามารถเชื่อมต่อระบบได้ ข้อมูลยังอยู่ในหน้านี้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setStatus(error && error.message ? error.message : getErrorMessage(error));
  }

  function applyApiFieldErrors(fields) {
    Object.keys(fields || {}).forEach(function (apiFieldName) {
      setError(mapApiFieldToFormField(apiFieldName), fields[apiFieldName]);
    });
  }

  function hasFieldErrors(error) {
    return !!(error && error.fields && Object.keys(error.fields).length > 0);
  }

  function mapApiFieldToFormField(apiFieldName) {
    const fieldMap = {
      "location": "locationName",
      "location.name": "locationName",
      "location.landmark": "landmark",
      "location.latitude": "coordinates",
      "location.longitude": "coordinates",
      "reporter": "reporterName",
      "reporter.name": "reporterName",
      "reporter.phone": "reporterPhone",
      "reporter.email": "reporterEmail",
      "reporter.contactMethod": "contactMethod",
      "consent.truthConfirmed": "truthConfirmed",
      "consent.privacyAccepted": "privacyAccepted",
      "consent.privacyVersion": "privacyAccepted",
      "attachments": "images"
    };

    if (/^attachments\[\d+\]/.test(apiFieldName)) {
      return "images";
    }

    return fieldMap[apiFieldName] || apiFieldName;
  }

  function getRateLimitMessage(error) {
    const fieldRetrySeconds = error && error.fields ? Number(error.fields.retryAfterSeconds || 0) : 0;
    const seconds = Number(error.retryAfterSeconds || fieldRetrySeconds || 0);

    if (Number.isFinite(seconds) && seconds > 0) {
      return "มีการส่งเรื่องถี่เกินไป กรุณาลองใหม่อีกครั้งในประมาณ " + Math.ceil(seconds / 60) + " นาที";
    }

    return "มีการส่งเรื่องถี่เกินไป กรุณาลองใหม่ภายหลัง";
  }

  function storeSubmitResult(data, requestId, payload) {
    const category = getSelectedCategory();
    const result = {
      savedAt: Date.now(),
      requestId: requestId,
      trackingCode: toText(data.trackingCode),
      createdAt: toText(data.createdAt),
      status: toText(data.status || "new"),
      title: toText(payload.title),
      categoryName: category ? toText(category.name) : "",
      incidentDate: toText(payload.incidentDate)
    };

    try {
      window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    } catch (error) {
      window.sessionStorage.removeItem(RESULT_KEY);
    }
  }

  function normalizePhone(value) {
    return toText(value).replace(/[\s-]/g, "");
  }

  function getPrivacyVersion() {
    const publicConfig = state.publicConfig || {};
    const appConfig = window.APP_CONFIG || {};

    return toText(publicConfig.privacyVersion || appConfig.PRIVACY_VERSION || "1.0");
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

  function removeDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      return;
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

    state.selectedCategoryId = toText(draft.categoryId);
    Object.keys(draft.fields || {}).forEach(function (fieldName) {
      setFieldValue(fieldName, draft.fields[fieldName]);
    });
    setFieldValue("categoryId", state.selectedCategoryId);
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
    setHidden(elements.categorySelectWrap, stateName !== "success");
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
    state.images.forEach(function (imageItem) {
      revokeImageUrl(imageItem);
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

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function getErrorMessage(error) {
    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return "ไม่สามารถเชื่อมต่อระบบได้";
  }

  function isAllowedImageType(file) {
    if (window.KPR_IMAGE_COMPRESS && typeof window.KPR_IMAGE_COMPRESS.isAllowedType === "function") {
      return window.KPR_IMAGE_COMPRESS.isAllowedType(file.type);
    }

    return ALLOWED_IMAGE_TYPES.indexOf(file.type) !== -1;
  }

  function createImageId() {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.generateRequestId === "function") {
      return "IMG-" + window.KPR_UTILS.generateRequestId();
    }

    if (window.KPR_UTILS && typeof window.KPR_UTILS.createRequestId === "function") {
      return "IMG-" + window.KPR_UTILS.createRequestId();
    }

    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "IMG-" + window.crypto.randomUUID();
    }

    return "IMG-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }

  function createRequestId() {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.generateRequestId === "function") {
      return window.KPR_UTILS.generateRequestId();
    }

    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "REQ-" + window.crypto.randomUUID().toUpperCase();
    }

    return "REQ-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
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

  function getMaxImageDimension() {
    const config = window.APP_CONFIG || {};
    const value = Number(config.MAX_IMAGE_DIMENSION);

    return Number.isFinite(value) && value > 0 ? value : 1600;
  }

  function formatFileSize(bytes) {
    const size = Number(bytes);

    if (!Number.isFinite(size)) {
      return "";
    }

    return (size / 1024 / 1024).toFixed(2) + " MB";
  }

  function getMimeLabel(mimeType) {
    const labels = {
      "image/jpeg": "JPG",
      "image/png": "PNG",
      "image/webp": "WebP"
    };

    return labels[mimeType] || mimeType || "";
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
