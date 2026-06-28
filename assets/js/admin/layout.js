(function () {
  "use strict";

  const MENU_PERMISSION_MAP = Object.freeze({
    reports: "report.read",
    assigned: "report.read",
    export: "report.read",
    users: "user.manage",
    categories: "settings.manage",
    announcements: "announcement.manage",
    activity: "admin.full",
    settings: "settings.manage"
  });

  const AUTH_LOADING_TEXT = "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c...";
  const USER_LABEL = "\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19";
  const ROLE_LABEL = "\u0e1a\u0e17\u0e1a\u0e32\u0e17";

  const drawer = document.querySelector("[data-admin-page] #admin-drawer");
  const overlay = document.querySelector("[data-admin-drawer-close].admin-drawer-overlay");
  const openButton = document.querySelector("[data-admin-drawer-open]");
  const closeButtons = document.querySelectorAll("[data-admin-drawer-close]");
  let lastFocusedElement = null;
  let lastFocusedOutsideDialog = null;
  const dialogFocusState = new WeakMap();

  function getFocusableElements(container) {
    if (!container) {
      return [];
    }

    return Array.prototype.slice.call(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (element) {
      return !element.hidden &&
        element.getAttribute("aria-hidden") !== "true" &&
        Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    });
  }

  function hasExplicitAccessibleName(element) {
    return Boolean(
      element &&
      (
        element.getAttribute("aria-label") ||
        element.getAttribute("aria-labelledby")
      )
    );
  }

  function ensureDrawerAccessibility() {
    if (openButton && !hasExplicitAccessibleName(openButton)) {
      openButton.setAttribute("aria-label", "เปิดเมนูผู้ดูแล");
    }

    closeButtons.forEach(function (button) {
      if (!hasExplicitAccessibleName(button)) {
        button.setAttribute("aria-label", "ปิดเมนูผู้ดูแล");
      }
    });

    if (drawer) {
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-modal", "true");
      drawer.setAttribute("tabindex", "-1");
    }
  }

  function trapFocus(event, container) {
    const focusable = getFocusableElements(container);

    if (focusable.length === 0) {
      event.preventDefault();
      container.focus();
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

  function setDrawerState(isOpen) {
    if (!drawer || !overlay || !openButton) {
      return;
    }

    ensureDrawerAccessibility();

    if (isOpen) {
      lastFocusedElement = document.activeElement;
      drawer.hidden = false;
      overlay.hidden = false;
      document.body.classList.add("admin-drawer-open");
      openButton.setAttribute("aria-expanded", "true");
      const focusable = getFocusableElements(drawer);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        drawer.focus();
      }
      return;
    }

    drawer.hidden = true;
    overlay.hidden = true;
    document.body.classList.remove("admin-drawer-open");
    openButton.setAttribute("aria-expanded", "false");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function handleDrawerKeydown(event) {
    if (!drawer || drawer.hidden) {
      return;
    }

    if (event.key === "Escape") {
      setDrawerState(false);
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    trapFocus(event, drawer);
  }

  function getDialogBackdrop(dialog) {
    let current = dialog ? dialog.parentElement : null;

    while (current && current !== document.body) {
      if (Object.prototype.hasOwnProperty.call(current, "hidden")) {
        return current;
      }

      current = current.parentElement;
    }

    return dialog;
  }

  function isVisible(element) {
    return Boolean(
      element &&
      !element.hidden &&
      (element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    );
  }

  function isDialogOpen(dialog) {
    const backdrop = getDialogBackdrop(dialog);

    return isVisible(dialog) && (!backdrop || !backdrop.hidden);
  }

  function getOpenDialogs() {
    return Array.prototype.slice.call(document.querySelectorAll('[role="dialog"][aria-modal="true"]'))
      .filter(isDialogOpen);
  }

  function focusDialog(dialog) {
    if (!dialog.hasAttribute("tabindex")) {
      dialog.setAttribute("tabindex", "-1");
    }

    const focusable = getFocusableElements(dialog);
    (focusable[0] || dialog).focus();
  }

  function syncDialogFocus(dialog) {
    if (!dialog || dialog === drawer) {
      return;
    }

    if (isDialogOpen(dialog)) {
      if (!dialogFocusState.has(dialog)) {
        dialogFocusState.set(dialog, {
          previousFocus: lastFocusedOutsideDialog || document.activeElement
        });
      }

      if (!dialog.hasAttribute("tabindex")) {
        dialog.setAttribute("tabindex", "-1");
      }

      window.setTimeout(function () {
        if (isDialogOpen(dialog) && !dialog.contains(document.activeElement)) {
          focusDialog(dialog);
        }
      }, 0);
      return;
    }

    if (dialogFocusState.has(dialog)) {
      const state = dialogFocusState.get(dialog);
      dialogFocusState.delete(dialog);

      if (state.previousFocus && typeof state.previousFocus.focus === "function" && document.contains(state.previousFocus)) {
        state.previousFocus.focus();
      }
    }
  }

  function syncAllDialogs() {
    document.querySelectorAll('[role="dialog"][aria-modal="true"]').forEach(syncDialogFocus);
  }

  function handleDialogKeydown(event) {
    if (event.key !== "Tab") {
      return;
    }

    const dialogs = getOpenDialogs().filter(function (dialog) {
      return dialog !== drawer;
    });
    const activeDialog = dialogs[dialogs.length - 1];

    if (activeDialog) {
      trapFocus(event, activeDialog);
    }
  }

  function initAdminDialogAccessibility() {
    lastFocusedOutsideDialog = document.activeElement;

    document.addEventListener("focusin", function (event) {
      if (!event.target.closest || !event.target.closest('[role="dialog"][aria-modal="true"]')) {
        lastFocusedOutsideDialog = event.target;
      }
    });
    document.addEventListener("keydown", handleDialogKeydown);

    const observer = new MutationObserver(function (mutations) {
      const hasHiddenChange = mutations.some(function (mutation) {
        return mutation.type === "attributes" && mutation.attributeName === "hidden";
      });

      if (hasHiddenChange) {
        syncAllDialogs();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["hidden"],
      subtree: true
    });

    syncAllDialogs();
  }

  function getPermissions(user) {
    return Array.isArray(user && user.permissions) ? user.permissions : [];
  }

  function hasPermission(user, permission) {
    if (!permission) {
      return true;
    }

    const permissions = getPermissions(user);

    return permissions.indexOf("admin.full") !== -1 || permissions.indexOf(permission) !== -1;
  }

  function renderUser(user) {
    const displayName = user && user.displayName ? user.displayName : "-";
    const role = user && user.role ? user.role : "-";

    document.querySelectorAll(".admin-user-summary").forEach(function (element) {
      element.textContent = USER_LABEL + ": " + displayName + " | " + ROLE_LABEL + ": " + role;
    });
  }

  function applyPermissionMenu(user) {
    document.querySelectorAll("[data-menu-key]").forEach(function (item) {
      const menuKey = item.dataset.menuKey || "";
      const permission = MENU_PERMISSION_MAP[menuKey] || "";
      const allowed = hasPermission(user, permission);

      item.hidden = !allowed;
      item.setAttribute("aria-hidden", allowed ? "false" : "true");

      if (!allowed && item.getAttribute("aria-current") === "page") {
        item.removeAttribute("aria-current");
      }
    });
  }

  function applyRoleMenuHook(user) {
    const role = user && user.role ? user.role : "";
    const roleItems = document.querySelectorAll("[data-roles]");

    roleItems.forEach(function (item) {
      const allowedRoles = item.dataset.roles.split(",").map(function (value) {
        return value.trim();
      });

      item.hidden = Boolean(role) && allowedRoles.indexOf(role) === -1;
    });
  }

  function bindLogoutButtons() {
    const logoutButtons = document.querySelectorAll("[data-admin-logout]");
    logoutButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        button.disabled = true;
        if (window.KPR_AUTH && typeof window.KPR_AUTH.logout === "function") {
          window.KPR_AUTH.logout();
        }
      });
    });
  }

  function ensureAuthLoading() {
    let loading = document.querySelector("[data-admin-auth-loading]");

    if (!loading) {
      loading = document.createElement("div");
      loading.className = "admin-auth-loading";
      loading.setAttribute("data-admin-auth-loading", "");
      loading.setAttribute("role", "status");
      loading.setAttribute("aria-live", "polite");
      loading.textContent = AUTH_LOADING_TEXT;
      document.body.appendChild(loading);
    }

    return loading;
  }

  function setAuthLoading(isLoading) {
    if (!document.body.matches('[data-admin-guard="required"]')) {
      return;
    }

    if (isLoading) {
      document.body.classList.add("admin-auth-pending");
      document.body.classList.remove("admin-auth-ready");
      ensureAuthLoading();
      return;
    }

    const loading = document.querySelector("[data-admin-auth-loading]");

    if (loading) {
      loading.remove();
    }

    document.body.classList.remove("admin-auth-pending");
    document.body.classList.add("admin-auth-ready");
  }

  async function guardAdminPage() {
    if (!document.body.matches('[data-admin-guard="required"]')) {
      return null;
    }

    setAuthLoading(true);

    if (!window.KPR_AUTH || typeof window.KPR_AUTH.requireAdminSession !== "function") {
      if (window.KPR_AUTH && typeof window.KPR_AUTH.redirectToLogin === "function") {
        window.KPR_AUTH.redirectToLogin();
      } else {
        window.location.replace("login.html");
      }
      return null;
    }

    const user = await window.KPR_AUTH.requireAdminSession();

    if (!user) {
      return null;
    }

    renderUser(user);
    applyPermissionMenu(user);
    applyRoleMenuHook(user);
    setAuthLoading(false);

    return user;
  }

  function bindDrawer() {
    ensureDrawerAccessibility();

    if (openButton) {
      openButton.addEventListener("click", function () {
        setDrawerState(true);
      });
    }

    closeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setDrawerState(false);
      });
    });

    document.addEventListener("keydown", handleDrawerKeydown);
  }

  async function init() {
    bindDrawer();
    initAdminDialogAccessibility();
    bindLogoutButtons();

    try {
      await guardAdminPage();
    } catch (error) {
      if (window.KPR_AUTH && typeof window.KPR_AUTH.redirectToLogin === "function") {
        window.KPR_AUTH.redirectToLogin();
      }
    }
  }

  init();
})();
