(function () {
  "use strict";

  const CATEGORY_LIMIT_TEXT = "เลือกหมวดนี้";
  const DEFAULT_ANNOUNCEMENT_LIMIT = 5;

  function getApi() {
    return window.KPRApi || null;
  }

  function getUtils() {
    return window.KPRUtils || {};
  }

  function clearElement(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function setStateMessage(container, options) {
    if (!container) {
      return;
    }

    clearElement(container);

    if (!options) {
      return;
    }

    const box = document.createElement("div");
    box.className = "alert " + (options.className || "alert-info");

    const textWrap = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = options.title || "";
    const message = document.createElement("p");
    message.textContent = options.message || "";
    textWrap.append(title, message);
    box.appendChild(textWrap);

    if (typeof options.onRetry === "function") {
      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.className = "button button-ghost";
      retryButton.textContent = "ลองใหม่";
      retryButton.addEventListener("click", options.onRetry);
      box.appendChild(retryButton);
    }

    container.appendChild(box);
  }

  function showSkeleton(container, count) {
    clearElement(container);

    const grid = document.createElement("div");
    grid.className = "home-loading-grid";
    grid.setAttribute("aria-label", "กำลังโหลดข้อมูล");

    Array.from({ length: count }).forEach(function () {
      const skeleton = document.createElement("div");
      skeleton.className = "skeleton-card";
      grid.appendChild(skeleton);
    });

    container.appendChild(grid);
  }

  function getItems(result) {
    if (!result || !result.data) {
      return [];
    }

    if (Array.isArray(result.data.items)) {
      return result.data.items;
    }

    if (Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  }

  function getReadableError(error, fallback) {
    if (error && error.code === "API_NOT_CONFIGURED") {
      return "ยังไม่ได้ตั้งค่า API URL จึงไม่สามารถโหลดข้อมูลจากระบบกลางได้";
    }

    if (error && error.userMessage) {
      return error.userMessage;
    }

    if (error && error.message) {
      return error.message;
    }

    return fallback;
  }

  function requestPublic(action, data) {
    const api = getApi();

    if (!api || typeof api.publicRequest !== "function") {
      return Promise.reject(new Error("ยังไม่พบ API Client กลาง"));
    }

    return api.publicRequest(action, data || {});
  }

  function getCategoryId(category) {
    return category.categoryId || category.category_id || category.id || category.code || "";
  }

  function createCategoryCard(category) {
    const categoryId = getCategoryId(category);
    const link = document.createElement("a");
    const params = new URLSearchParams();

    if (categoryId) {
      params.set("category", categoryId);
    }

    link.className = "category-card";
    link.href = "report.html" + (params.toString() ? "?" + params.toString() : "");

    const header = document.createElement("div");
    header.className = "category-card-header";

    const icon = document.createElement("span");
    icon.className = "category-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = (category.icon || category.code || CATEGORY_LIMIT_TEXT).toString().slice(0, 2).toUpperCase();

    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = category.name || "หมวดปัญหา";
    const meta = document.createElement("p");
    meta.className = "category-meta";
    meta.textContent = category.targetDays ? "เป้าหมายดำเนินการ " + category.targetDays + " วัน" : CATEGORY_LIMIT_TEXT;
    titleWrap.append(title, meta);

    header.append(icon, titleWrap);

    const description = document.createElement("p");
    description.textContent = category.description || "เลือกหมวดนี้เพื่อเริ่มแจ้งปัญหา";

    link.append(header, description);
    return link;
  }

  function renderCategoryEmpty(container) {
    clearElement(container);

    const empty = document.createElement("div");
    empty.className = "empty-state";
    const title = document.createElement("h3");
    title.textContent = "ยังไม่มีหมวดปัญหาที่เปิดใช้งาน";
    const message = document.createElement("p");
    message.textContent = "ยังสามารถเริ่มแจ้งปัญหาได้ และเลือกหมวดภายหลังเมื่อระบบพร้อม";
    const action = document.createElement("a");
    action.className = "button button-primary";
    action.href = "report.html";
    action.textContent = "แจ้งปัญหา";
    empty.append(title, message, action);
    container.appendChild(empty);
  }

  async function loadCategories() {
    const list = document.getElementById("category-list");
    const status = document.getElementById("category-status");

    if (!list || !status) {
      return;
    }

    list.dataset.state = "loading";
    setStateMessage(status, null);
    showSkeleton(list, 4);

    try {
      const result = await requestPublic("category.list", {});
      const categories = getItems(result);

      clearElement(list);
      list.dataset.state = categories.length ? "success" : "empty";

      if (!categories.length) {
        renderCategoryEmpty(list);
        return;
      }

      categories.forEach(function (category) {
        list.appendChild(createCategoryCard(category));
      });
    } catch (error) {
      list.dataset.state = "error";
      clearElement(list);
      setStateMessage(status, {
        className: "alert-danger",
        title: "โหลดหมวดปัญหาไม่สำเร็จ",
        message: getReadableError(error, "กรุณาลองใหม่อีกครั้ง หรือกดแจ้งปัญหาเพื่อเริ่มกรอกข้อมูลก่อน"),
        onRetry: loadCategories
      });
    }
  }

  function createAnnouncementCard(announcement) {
    const utils = getUtils();
    const article = document.createElement("article");
    const type = announcement.type || "info";
    article.className = "announcement-card";
    article.dataset.type = type;

    const title = document.createElement("h3");
    title.textContent = announcement.title || "ประกาศ";
    const content = document.createElement("p");
    content.textContent = announcement.content || "";

    article.append(title, content);

    if (announcement.startAt && typeof utils.formatThaiDate === "function") {
      const meta = document.createElement("p");
      meta.className = "announcement-meta";
      meta.textContent = "เริ่มแสดง " + utils.formatThaiDate(announcement.startAt);
      article.appendChild(meta);
    }

    return article;
  }

  function renderAnnouncementEmpty(container) {
    clearElement(container);

    const empty = document.createElement("div");
    empty.className = "empty-state";
    const title = document.createElement("h3");
    title.textContent = "ยังไม่มีประกาศในขณะนี้";
    const message = document.createElement("p");
    message.textContent = "หากมีข่าวสารสำคัญ ระบบจะแสดงไว้ในส่วนนี้";
    empty.append(title, message);
    container.appendChild(empty);
  }

  async function loadAnnouncements() {
    const list = document.getElementById("announcement-list");
    const status = document.getElementById("announcement-status");

    if (!list || !status) {
      return;
    }

    list.dataset.state = "loading";
    setStateMessage(status, null);
    showSkeleton(list, 2);

    try {
      const result = await requestPublic("announcement.list", { limit: DEFAULT_ANNOUNCEMENT_LIMIT });
      const announcements = getItems(result);

      clearElement(list);
      list.dataset.state = announcements.length ? "success" : "empty";

      if (!announcements.length) {
        renderAnnouncementEmpty(list);
        return;
      }

      announcements.forEach(function (announcement) {
        list.appendChild(createAnnouncementCard(announcement));
      });
    } catch (error) {
      list.dataset.state = "error";
      clearElement(list);
      setStateMessage(status, {
        className: "alert-danger",
        title: "โหลดประกาศไม่สำเร็จ",
        message: getReadableError(error, "หน้าแรกยังใช้งานได้ตามปกติ กรุณาลองโหลดประกาศใหม่ภายหลัง"),
        onRetry: loadAnnouncements
      });
    }
  }

  function applyPublicConfig(config) {
    const data = config || {};
    const footerEmail = document.querySelector(".footer-links a[href^='mailto:']");
    const emergencyText = document.querySelector("[data-emergency-text]");
    const contactEmail = data.contactEmail || (window.APP_CONFIG && window.APP_CONFIG.CONTACT_EMAIL) || "";

    if (footerEmail && contactEmail) {
      footerEmail.href = "mailto:" + contactEmail;
      footerEmail.textContent = contactEmail;
    }

    if (emergencyText && Array.isArray(data.emergencyContacts) && data.emergencyContacts.length) {
      const contactNames = data.emergencyContacts
        .map(function (item) {
          return item && item.name ? item.name : "";
        })
        .filter(Boolean)
        .slice(0, 3);

      if (contactNames.length) {
        emergencyText.textContent = "ระบบนี้ไม่ใช่ช่องทางแจ้งเหตุฉุกเฉิน หากมีเหตุเร่งด่วน กรุณาติดต่อ " + contactNames.join(", ") + " โดยตรง";
      }
    }
  }

  async function loadPublicConfig() {
    const status = document.getElementById("config-status");

    setStateMessage(status, {
      className: "alert-info",
      title: "กำลังโหลดข้อมูลระบบ",
      message: "กำลังตรวจสอบค่าระบบล่าสุด"
    });

    try {
      const result = await requestPublic("public.config", {});
      applyPublicConfig(result.data || {});
      setStateMessage(status, null);
    } catch (error) {
      setStateMessage(status, {
        className: "alert-warning",
        title: "ระบบยังโหลดข้อมูลไม่สำเร็จ",
        message: getReadableError(error, "จะใช้ค่าพื้นฐานบนหน้าเว็บไปก่อน และยังสามารถแจ้งปัญหาหรือติดตามสถานะได้"),
        onRetry: loadPublicConfig
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("is-public-home-ready");
    loadPublicConfig();
    loadCategories();
    loadAnnouncements();
  });
})();
