(function () {
  "use strict";

  const ANNOUNCEMENT_LIMIT = 5;

  const elements = {};

  document.documentElement.dataset.page = "home";
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    loadHome();
  }

  function cacheElements() {
    elements.configError = document.querySelector("[data-config-error]");
    elements.contactEmail = document.querySelector("[data-contact-email]");

    elements.categoryLoading = document.querySelector("[data-category-loading]");
    elements.categoryEmpty = document.querySelector("[data-category-empty]");
    elements.categoryError = document.querySelector("[data-category-error]");
    elements.categoryErrorMessage = document.querySelector("[data-category-error-message]");
    elements.categoryList = document.querySelector("[data-category-list]");

    elements.announcementLoading = document.querySelector("[data-announcement-loading]");
    elements.announcementEmpty = document.querySelector("[data-announcement-empty]");
    elements.announcementError = document.querySelector("[data-announcement-error]");
    elements.announcementErrorMessage = document.querySelector("[data-announcement-error-message]");
    elements.announcementList = document.querySelector("[data-announcement-list]");
  }

  function bindEvents() {
    document.querySelectorAll("[data-retry]").forEach(function (button) {
      button.addEventListener("click", function () {
        const target = button.getAttribute("data-retry");

        if (target === "config") {
          loadPublicConfig();
        } else if (target === "categories") {
          loadCategories();
        } else if (target === "announcements") {
          loadAnnouncements();
        }
      });
    });
  }

  function loadHome() {
    loadPublicConfig();
    loadCategories();
    loadAnnouncements();
  }

  async function loadPublicConfig() {
    setHidden(elements.configError, true);

    try {
      const response = await window.KPR_API.read("public.config", {});
      applyPublicConfig(response.data || {});
    } catch (error) {
      setHidden(elements.configError, false);
    }
  }

  function applyPublicConfig(config) {
    const contactEmail = toText(config.contactEmail);

    if (elements.contactEmail && contactEmail) {
      elements.contactEmail.textContent = contactEmail;
      elements.contactEmail.setAttribute("href", "mailto:" + contactEmail);
    }
  }

  async function loadCategories() {
    showCategoryState("loading");

    try {
      const response = await window.KPR_API.read("category.list", {});
      const items = Array.isArray(response.data.items) ? response.data.items : [];

      renderCategories(items);
      showCategoryState(items.length > 0 ? "success" : "empty");
    } catch (error) {
      setText(elements.categoryErrorMessage, getErrorMessage(error));
      showCategoryState("error");
    }
  }

  function renderCategories(items) {
    clearChildren(elements.categoryList);

    items.forEach(function (category) {
      elements.categoryList.appendChild(createCategoryCard(category));
    });
  }

  function createCategoryCard(category) {
    const categoryId = toText(category.categoryId || category.code);
    const link = document.createElement("a");
    const icon = document.createElement("span");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const meta = document.createElement("span");

    link.className = "home-category-card";
    link.href = categoryId ? "report.html?category=" + encodeURIComponent(categoryId) : "report.html";

    icon.className = "home-category-card__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = getCategoryLabel(category);

    title.textContent = toText(category.name) || "หมวดปัญหา";
    description.textContent = toText(category.description) || "แจ้งรายละเอียดปัญหาในหมวดนี้";
    meta.className = "home-category-card__meta";
    meta.textContent = formatTargetDays(category.targetDays);

    link.appendChild(icon);
    link.appendChild(title);
    link.appendChild(description);
    link.appendChild(meta);

    return link;
  }

  async function loadAnnouncements() {
    showAnnouncementState("loading");

    try {
      const response = await window.KPR_API.read("announcement.list", { limit: ANNOUNCEMENT_LIMIT });
      const items = Array.isArray(response.data.items) ? response.data.items : [];

      renderAnnouncements(items);
      showAnnouncementState(items.length > 0 ? "success" : "empty");
    } catch (error) {
      setText(elements.announcementErrorMessage, getErrorMessage(error));
      showAnnouncementState("error");
    }
  }

  function renderAnnouncements(items) {
    clearChildren(elements.announcementList);

    items.forEach(function (announcement) {
      elements.announcementList.appendChild(createAnnouncementCard(announcement));
    });
  }

  function createAnnouncementCard(announcement) {
    const article = document.createElement("article");
    const header = document.createElement("div");
    const chip = document.createElement("span");
    const title = document.createElement("h3");
    const content = document.createElement("p");
    const meta = document.createElement("span");

    article.className = "home-announcement-card";
    header.className = "home-announcement-card__header";
    chip.className = getAnnouncementChipClass(announcement.type);
    chip.textContent = getAnnouncementTypeLabel(announcement.type);
    title.textContent = toText(announcement.title) || "ประกาศ";
    content.textContent = toText(announcement.content) || "ไม่มีรายละเอียดประกาศ";
    meta.className = "home-announcement-card__meta";
    meta.textContent = formatAnnouncementDate(announcement.startAt);

    header.appendChild(chip);
    header.appendChild(title);
    article.appendChild(header);
    article.appendChild(content);

    if (meta.textContent) {
      article.appendChild(meta);
    }

    return article;
  }

  function showCategoryState(state) {
    setHidden(elements.categoryLoading, state !== "loading");
    setHidden(elements.categoryEmpty, state !== "empty");
    setHidden(elements.categoryError, state !== "error");
    setHidden(elements.categoryList, state !== "success");
  }

  function showAnnouncementState(state) {
    setHidden(elements.announcementLoading, state !== "loading");
    setHidden(elements.announcementEmpty, state !== "empty");
    setHidden(elements.announcementError, state !== "error");
    setHidden(elements.announcementList, state !== "success");
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = hidden;
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

  function setText(element, value) {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.setText === "function") {
      window.KPR_UTILS.setText(element, value);
      return;
    }

    if (element) {
      element.textContent = toText(value);
    }
  }

  function toText(value) {
    return value === null || value === undefined ? "" : String(value);
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

  function getAnnouncementChipClass(type) {
    const normalizedType = toText(type).toLowerCase();

    if (normalizedType === "warning" || normalizedType === "emergency") {
      return "status-chip status-chip-warning";
    }

    if (normalizedType === "maintenance") {
      return "status-chip status-chip-info";
    }

    return "status-chip status-chip-success";
  }

  function getAnnouncementTypeLabel(type) {
    const normalizedType = toText(type).toLowerCase();

    if (normalizedType === "warning") {
      return "แจ้งเตือน";
    }

    if (normalizedType === "emergency") {
      return "เร่งด่วน";
    }

    if (normalizedType === "maintenance") {
      return "ปรับปรุงระบบ";
    }

    return "ข่าวสาร";
  }

  function formatAnnouncementDate(value) {
    if (!value) {
      return "";
    }

    if (window.KPR_UTILS && typeof window.KPR_UTILS.formatThaiDate === "function") {
      return "เริ่มแสดง " + window.KPR_UTILS.formatThaiDate(value);
    }

    return "เริ่มแสดง " + toText(value);
  }
})();
