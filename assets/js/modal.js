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

  let activeModal = null;
  let previousFocus = null;

  function getFocusableElements(container) {
    return Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter(function (element) {
        return element.offsetParent !== null || element === document.activeElement;
      });
  }

  function focusFirstElement(container) {
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return;
    }

    container.focus();
  }

  function trapFocus(event) {
    if (!activeModal || event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(activeModal.dialog);

    if (focusableElements.length === 0) {
      event.preventDefault();
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

  function handleKeydown(event) {
    if (event.key === "Escape") {
      close();
      return;
    }

    trapFocus(event);
  }

  function close() {
    if (!activeModal) {
      return;
    }

    document.removeEventListener("keydown", handleKeydown);
    activeModal.backdrop.remove();
    activeModal = null;

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }

    previousFocus = null;
  }

  function appendContent(container, content) {
    if (content instanceof Node) {
      container.appendChild(content);
      return;
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = content || "";
    container.appendChild(paragraph);
  }

  function createActionButton(action) {
    const button = document.createElement("button");
    const variant = action.variant || "secondary";

    button.className = "button button-" + variant;
    button.type = "button";
    button.textContent = action.label || "ตกลง";
    button.addEventListener("click", function () {
      if (typeof action.onClick === "function") {
        action.onClick();
      }

      if (action.autoClose !== false) {
        close();
      }
    });

    return button;
  }

  function open(options) {
    const settings = options || {};
    const modalTitleId = "kpr-modal-title-" + Date.now().toString(36);
    const backdrop = document.createElement("div");
    const dialog = document.createElement("section");
    const panel = document.createElement("div");
    const header = document.createElement("header");
    const title = document.createElement("h2");
    const closeButton = document.createElement("button");
    const body = document.createElement("div");
    const footer = document.createElement("footer");
    const actions = Array.isArray(settings.actions) ? settings.actions : [];

    close();
    previousFocus = document.activeElement;

    backdrop.className = "modal-backdrop";
    backdrop.dataset.modalBackdrop = "true";

    dialog.className = "modal";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", modalTitleId);
    dialog.setAttribute("tabindex", "-1");

    panel.className = "modal-panel";
    header.className = "modal-header";
    title.id = modalTitleId;
    title.textContent = settings.title || "ข้อความแจ้งเตือน";

    closeButton.className = "button button-ghost";
    closeButton.type = "button";
    closeButton.textContent = "ปิด";
    closeButton.setAttribute("aria-label", "ปิดหน้าต่าง");
    closeButton.addEventListener("click", close);

    body.className = "modal-body";
    appendContent(body, settings.content);

    footer.className = "modal-footer";

    if (actions.length > 0) {
      actions.forEach(function (action) {
        footer.appendChild(createActionButton(action));
      });
    } else {
      footer.appendChild(createActionButton({
        label: "ตกลง",
        variant: "primary"
      }));
    }

    header.appendChild(title);
    header.appendChild(closeButton);
    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    dialog.appendChild(panel);
    backdrop.appendChild(dialog);

    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) {
        close();
      }
    });

    document.body.appendChild(backdrop);
    activeModal = {
      backdrop: backdrop,
      dialog: dialog
    };
    document.addEventListener("keydown", handleKeydown);
    focusFirstElement(dialog);

    return dialog;
  }

  window.KPRModal = {
    close: close,
    open: open
  };

  // Example: window.KPRModal.open({ title: "ยืนยัน", content: "ต้องการดำเนินการต่อหรือไม่" });
})();
