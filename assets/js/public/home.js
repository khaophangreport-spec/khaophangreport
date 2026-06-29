(function () {
  "use strict";

  const ANNOUNCEMENT_LIMIT = 5;
  const LATEST_REPORT_LIMIT = 5;
  const STATUS_LABELS = {
    new: "รับเรื่องแล้ว",
    reviewing: "กำลังตรวจสอบ",
    assigned: "มอบหมายแล้ว",
    in_progress: "กำลังดำเนินการ",
    waiting: "รอข้อมูลเพิ่มเติม",
    resolved: "ดำเนินการแล้ว",
    closed: "ปิดเรื่อง",
    rejected: "ไม่รับดำเนินการ",
    duplicate: "เรื่องซ้ำ"
  };
  const STATUS_CLASSES = {
    new: "status-chip-info",
    reviewing: "status-chip-info",
    assigned: "status-chip-pending",
    in_progress: "status-chip-in-progress",
    waiting: "status-chip-warning",
    resolved: "status-chip-success",
    closed: "status-chip-completed",
    rejected: "status-chip-danger",
    duplicate: "status-chip-warning"
  };

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

    elements.announcementLoading = document.querySelector("[data-announcement-loading]");
    elements.announcementEmpty = document.querySelector("[data-announcement-empty]");
    elements.announcementError = document.querySelector("[data-announcement-error]");
    elements.announcementErrorMessage = document.querySelector("[data-announcement-error-message]");
    elements.announcementList = document.querySelector("[data-announcement-list]");

    elements.latestReportLoading = document.querySelector("[data-latest-report-loading]");
    elements.latestReportEmpty = document.querySelector("[data-latest-report-empty]");
    elements.latestReportError = document.querySelector("[data-latest-report-error]");
    elements.latestReportErrorMessage = document.querySelector("[data-latest-report-error-message]");
    elements.latestReportList = document.querySelector("[data-latest-report-list]");
  }

  function bindEvents() {
    document.querySelectorAll("[data-retry]").forEach(function (button) {
      button.addEventListener("click", function () {
        const target = button.getAttribute("data-retry");

        if (target === "config") {
          loadPublicConfig();
        } else if (target === "announcements") {
          loadAnnouncements();
        } else if (target === "latest-reports") {
          loadLatestReports();
        }
      });
    });
  }

  function loadHome() {
    loadPublicConfig();
    loadAnnouncements();
    loadLatestReports();
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

  async function loadAnnouncements() {
    showAnnouncementState("loading");

    try {
      const response = await window.KPR_API.read("announcement.list", { limit: ANNOUNCEMENT_LIMIT });
      const items = response && response.data && Array.isArray(response.data.items) ? response.data.items : [];

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
      if (elements.announcementList) {
        elements.announcementList.appendChild(createAnnouncementCard(announcement));
      }
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

  async function loadLatestReports() {
    showLatestReportState("loading");

    try {
      const response = await window.KPR_API.read("public.report.latest", { limit: LATEST_REPORT_LIMIT });
      const items = response && response.data && Array.isArray(response.data.items)
        ? response.data.items.slice(0, LATEST_REPORT_LIMIT)
        : [];

      renderLatestReports(items);
      showLatestReportState(items.length > 0 ? "success" : "empty");
    } catch (error) {
      setText(elements.latestReportErrorMessage, getErrorMessage(error));
      showLatestReportState("error");
    }
  }

  function renderLatestReports(items) {
    clearChildren(elements.latestReportList);

    items.slice(0, LATEST_REPORT_LIMIT).forEach(function (report) {
      if (elements.latestReportList) {
        elements.latestReportList.appendChild(createLatestReportCard(report));
      }
    });
  }

  function createLatestReportCard(report) {
    const article = document.createElement("article");
    const title = document.createElement("h3");
    const location = document.createElement("p");
    const footer = document.createElement("div");
    const status = document.createElement("span");
    const date = document.createElement("time");

    article.className = "home-latest-report-card";
    title.textContent = toText(report.title) || "เรื่องแจ้งเหตุ";
    location.className = "home-latest-report-card__location";
    location.textContent = toText(report.locationText) || "ไม่ระบุสถานที่";
    footer.className = "home-latest-report-card__footer";

    status.className = "status-chip " + (STATUS_CLASSES[toText(report.status).toLowerCase()] || "status-chip-info");
    status.textContent = getStatusLabel(report.status);

    date.className = "home-latest-report-card__date";
    date.textContent = formatDateTime(report.createdAt);
    if (report.createdAt) {
      date.dateTime = toText(report.createdAt);
    }

    footer.appendChild(status);
    if (date.textContent) {
      footer.appendChild(date);
    }

    article.appendChild(title);
    article.appendChild(location);
    article.appendChild(footer);

    return article;
  }

  function showAnnouncementState(state) {
    setHidden(elements.announcementLoading, state !== "loading");
    setHidden(elements.announcementEmpty, state !== "empty");
    setHidden(elements.announcementError, state !== "error");
    setHidden(elements.announcementList, state !== "success");
  }

  function showLatestReportState(state) {
    setHidden(elements.latestReportLoading, state !== "loading");
    setHidden(elements.latestReportEmpty, state !== "empty");
    setHidden(elements.latestReportError, state !== "error");
    setHidden(elements.latestReportList, state !== "success");
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

  function getStatusLabel(value) {
    const status = toText(value).toLowerCase();

    return STATUS_LABELS[status] || toText(value) || "รับเรื่องแล้ว";
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

  function formatDateTime(value) {
    if (!value) {
      return "";
    }

    if (window.KPR_UTILS && typeof window.KPR_UTILS.formatThaiDateTime === "function") {
      return window.KPR_UTILS.formatThaiDateTime(value);
    }

    return toText(value);
  }
})();
