(function () {
  "use strict";

  const modalState = new WeakMap();
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  function getFocusableElements(dialog) {
    return Array.prototype.slice.call(dialog.querySelectorAll(focusableSelector)).filter(function (element) {
      return !element.hasAttribute("hidden") && element.offsetParent !== null;
    });
  }

  function focusFirstElement(dialog) {
    const focusableElements = getFocusableElements(dialog);

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return;
    }

    dialog.focus();
  }

  function trapFocus(event, dialog) {
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(dialog);
    if (focusableElements.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function close(modalElement) {
    const state = modalState.get(modalElement);

    if (!state) {
      return;
    }

    document.removeEventListener("keydown", state.onKeydown);
    modalElement.classList.remove("is-visible");

    if (modalElement.parentNode) {
      modalElement.parentNode.removeChild(modalElement);
    }

    if (!document.querySelector("[data-modal-backdrop]")) {
      document.body.classList.remove("is-modal-open");
    }

    if (state.previousFocus && typeof state.previousFocus.focus === "function") {
      state.previousFocus.focus();
    }

    modalState.delete(modalElement);
  }

  function createActionButton(action, modalElement) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "button " + (action.variant === "secondary" ? "button-secondary" : "button-primary");
    button.textContent = action.label || "ตกลง";
    button.addEventListener("click", function () {
      if (typeof action.onSelect === "function") {
        action.onSelect(function () {
          close(modalElement);
        });
        return;
      }

      close(modalElement);
    });

    return button;
  }

  function open(options) {
    const settings = options || {};
    const previousFocus = document.activeElement;
    const backdrop = document.createElement("div");
    const dialog = document.createElement("section");
    const title = document.createElement("h2");
    const body = document.createElement("p");
    const actions = document.createElement("div");
    const dialogId = settings.dialogId || "modal-" + Date.now().toString(36);
    const titleId = settings.titleId || dialogId + "-title";
    const bodyId = settings.bodyId || dialogId + "-body";
    const actionItems = Array.isArray(settings.actions) && settings.actions.length > 0
      ? settings.actions
      : [{ label: "ตกลง" }];

    backdrop.className = "modal-backdrop";
    backdrop.setAttribute("data-modal-backdrop", "");
    backdrop.classList.add("is-visible");

    dialog.className = "modal";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("tabindex", "-1");
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.setAttribute("aria-describedby", bodyId);

    title.className = "modal-title";
    title.id = titleId;
    title.textContent = settings.title || "แจ้งเตือน";

    body.className = "modal-body";
    body.id = bodyId;
    body.textContent = settings.message || "";

    actions.className = "modal-actions";

    backdrop.appendChild(dialog);
    dialog.appendChild(title);
    dialog.appendChild(body);
    dialog.appendChild(actions);

    actionItems.forEach(function (action) {
      actions.appendChild(createActionButton(action, backdrop));
    });

    const onKeydown = function (event) {
      if (event.key === "Escape" && settings.closeOnEscape !== false) {
        close(backdrop);
        return;
      }

      trapFocus(event, dialog);
    };

    if (settings.closeOnOverlay !== false) {
      backdrop.addEventListener("click", function (event) {
        if (event.target === backdrop) {
          close(backdrop);
        }
      });
    }

    modalState.set(backdrop, {
      onKeydown: onKeydown,
      previousFocus: previousFocus
    });

    document.body.appendChild(backdrop);
    document.body.classList.add("is-modal-open");
    document.addEventListener("keydown", onKeydown);
    focusFirstElement(dialog);

    return backdrop;
  }

  window.KPR_MODAL = Object.freeze({
    open: open,
    close: close,
    isReady: true
  });

  // Example: window.KPR_MODAL.open({ title: "ยืนยัน", message: "ต้องการดำเนินการต่อหรือไม่" });
})();
