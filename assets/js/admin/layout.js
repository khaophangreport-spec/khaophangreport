(function () {
  "use strict";

  const drawer = document.querySelector("[data-admin-page] #admin-drawer");
  const overlay = document.querySelector("[data-admin-drawer-close].admin-drawer-overlay");
  const openButton = document.querySelector("[data-admin-drawer-open]");
  const closeButtons = document.querySelectorAll("[data-admin-drawer-close]");
  let lastFocusedElement = null;

  function getFocusableElements(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function setDrawerState(isOpen) {
    if (!drawer || !overlay || !openButton) {
      return;
    }

    if (isOpen) {
      lastFocusedElement = document.activeElement;
      drawer.hidden = false;
      overlay.hidden = false;
      document.body.classList.add("admin-drawer-open");
      openButton.setAttribute("aria-expanded", "true");
      const focusable = getFocusableElements(drawer);
      if (focusable.length > 0) {
        focusable[0].focus();
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

    const focusable = getFocusableElements(drawer);
    if (focusable.length === 0) {
      event.preventDefault();
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

  function applyRoleMenuHook() {
    const auth = window.KPR_AUTH;
    const user = auth && typeof auth.getCurrentUser === "function" ? auth.getCurrentUser() : null;
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
        if (window.KPR_AUTH && typeof window.KPR_AUTH.logout === "function") {
          window.KPR_AUTH.logout();
        }
      });
    });
  }

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
  applyRoleMenuHook();
  bindLogoutButtons();
})();
