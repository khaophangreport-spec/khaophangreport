(function () {
  "use strict";

  const TOAST_TYPES = ["success", "error", "warning", "info"];
  const DEFAULT_DURATION = 4000;

  function getRegion() {
    let region = document.querySelector("[data-toast-region]");

    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      region.setAttribute("data-toast-region", "");
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "false");
      document.body.appendChild(region);
    }

    return region;
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) {
      return;
    }

    toast.setAttribute("data-closing", "true");
    window.setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 160);
  }

  function show(message, type, options) {
    const toastType = TOAST_TYPES.indexOf(type) >= 0 ? type : "info";
    const settings = options || {};
    const duration = Number.isFinite(settings.duration) ? settings.duration : DEFAULT_DURATION;
    const region = getRegion();
    const toast = document.createElement("div");
    const messageElement = document.createElement("p");
    const closeButton = document.createElement("button");

    toast.className = "toast toast-" + toastType;
    toast.setAttribute("role", toastType === "error" ? "alert" : "status");

    messageElement.className = "toast-message";
    messageElement.textContent = message === null || message === undefined ? "" : String(message);

    closeButton.type = "button";
    closeButton.className = "toast-close";
    closeButton.setAttribute("aria-label", "ปิดข้อความแจ้งเตือน");
    closeButton.textContent = "ปิด";
    closeButton.addEventListener("click", function () {
      removeToast(toast);
    });

    toast.appendChild(messageElement);
    toast.appendChild(closeButton);
    region.appendChild(toast);

    if (duration > 0) {
      window.setTimeout(function () {
        removeToast(toast);
      }, duration);
    }

    return toast;
  }

  window.KPR_TOAST = Object.freeze({
    show: show,
    success: function (message, options) {
      return show(message, "success", options);
    },
    error: function (message, options) {
      return show(message, "error", options);
    },
    warning: function (message, options) {
      return show(message, "warning", options);
    },
    info: function (message, options) {
      return show(message, "info", options);
    }
  });

  // Example: window.KPR_TOAST.success("บันทึกข้อมูลสำเร็จ");
})();
