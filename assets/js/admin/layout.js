(function () {
  "use strict";

  const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  let lastFocusedElement = null;

  function getCurrentAdminSection() {
    const page = document.body ? document.body.dataset.adminPage : "";

    if (page) {
      return page;
    }

    const fileName = window.location.pathname.split("/").pop() || "dashboard.html";
    const sectionByFile = {
      "dashboard.html": "dashboard",
      "reports.html": "reports",
      "report-detail.html": "reports",
      "users.html": "users",
      "categories.html": "categories",
      "announcements.html": "announcements",
      "settings.html": "settings",
      "activity-logs.html": "activity",
      "export.html": "export"
    };

    return sectionByFile[fileName] || "";
  }

  function getDrawerElements() {
    return {
      drawer: document.querySelector("[data-admin-drawer]"),
      overlay: document.querySelector("[data-admin-drawer-overlay]"),
      openButton: document.querySelector("[data-admin-drawer-open]"),
      closeButton: document.querySelector("[data-admin-drawer-close]")
    };
  }

  function setActiveMenu() {
    const currentSection = getCurrentAdminSection();

    if (!currentSection) {
      return;
    }

    document.querySelectorAll("[data-admin-nav]").forEach(function (item) {
      if (item.dataset.adminNav === currentSection) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  }

  function applyRoleMenuHooks() {
    const user = window.KPRAuth && typeof window.KPRAuth.getCurrentUser === "function"
      ? window.KPRAuth.getCurrentUser()
      : null;

    const permissions = Array.isArray(user && user.permissions) ? user.permissions : null;

    document.querySelectorAll("[data-required-permissions]").forEach(function (item) {
      const required = item.dataset.requiredPermissions.split(",").map(function (value) {
        return value.trim();
      }).filter(Boolean);

      item.dataset.permissionHookReady = "true";

      if (!permissions || required.length === 0) {
        return;
      }

      const canView = required.some(function (permission) {
        return permissions.includes(permission);
      });

      item.hidden = !canView;
    });
  }

  function openDrawer() {
    const elements = getDrawerElements();

    if (!elements.drawer || !elements.openButton) {
      return;
    }

    lastFocusedElement = document.activeElement;
    document.body.classList.add("admin-drawer-open");
    elements.drawer.setAttribute("aria-hidden", "false");
    elements.openButton.setAttribute("aria-expanded", "true");

    const firstFocusable = elements.drawer.querySelector(FOCUSABLE_SELECTOR);
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  function closeDrawer() {
    const elements = getDrawerElements();

    if (!elements.drawer || !elements.openButton) {
      return;
    }

    document.body.classList.remove("admin-drawer-open");
    elements.drawer.setAttribute("aria-hidden", "true");
    elements.openButton.setAttribute("aria-expanded", "false");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function trapDrawerFocus(event) {
    if (event.key !== "Tab" || !document.body.classList.contains("admin-drawer-open")) {
      return;
    }

    const drawer = document.querySelector("[data-admin-drawer]");
    if (!drawer) {
      return;
    }

    const focusable = Array.from(drawer.querySelectorAll(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleLogoutIntent(event) {
    event.preventDefault();
    const message = "ยังไม่ได้เชื่อมต่อ Session จริง การออกจากระบบจะทำงานในขั้น Authentication";

    if (window.KPRAuth && typeof window.KPRAuth.handleLogoutIntent === "function") {
      window.KPRAuth.handleLogoutIntent();
      return;
    }

    window.alert(message);
  }

  function bindDrawer() {
    const elements = getDrawerElements();

    if (elements.openButton) {
      elements.openButton.addEventListener("click", openDrawer);
    }

    if (elements.closeButton) {
      elements.closeButton.addEventListener("click", closeDrawer);
    }

    if (elements.overlay) {
      elements.overlay.addEventListener("click", closeDrawer);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("admin-drawer-open")) {
        closeDrawer();
      }

      trapDrawerFocus(event);
    });

    document.querySelectorAll("[data-admin-drawer] a").forEach(function (link) {
      link.addEventListener("click", closeDrawer);
    });

    document.querySelectorAll("[data-admin-logout]").forEach(function (button) {
      button.addEventListener("click", handleLogoutIntent);
    });
  }

  function initAdminLayout() {
    setActiveMenu();
    applyRoleMenuHooks();
    bindDrawer();
  }

  document.addEventListener("DOMContentLoaded", initAdminLayout);

  window.KPRAdminLayout = {
    applyRoleMenuHooks: applyRoleMenuHooks,
    closeDrawer: closeDrawer,
    getCurrentAdminSection: getCurrentAdminSection,
    initAdminLayout: initAdminLayout,
    openDrawer: openDrawer,
    setActiveMenu: setActiveMenu
  };
})();
