(function () {
  "use strict";

  const TYPE_CLASS = {
    success: "alert-success",
    error: "alert-danger",
    warning: "alert-warning",
    info: "alert-info"
  };

  const DEFAULT_DURATION = 4200;
  let toastRegion = null;

  function ensureRegion() {
    if (toastRegion && document.body.contains(toastRegion)) {
      return toastRegion;
    }

    toastRegion = document.querySelector("[data-toast-region]");

    if (!toastRegion) {
      toastRegion = document.createElement("div");
      toastRegion.className = "toast-region";
      toastRegion.dataset.toastRegion = "true";
      toastRegion.setAttribute("aria-live", "polite");
      toastRegion.setAttribute("aria-relevant", "additions");
      document.body.appendChild(toastRegion);
    }

    return toastRegion;
  }

  function removeToast(toastElement) {
    if (toastElement && toastElement.parentElement) {
      toastElement.parentElement.removeChild(toastElement);
    }
  }

  function show(type, message, options) {
    const toastType = TYPE_CLASS[type] ? type : "info";
    const settings = options || {};
    const region = ensureRegion();
    const toastElement = document.createElement("div");
    const messageElement = document.createElement("p");
    const closeButton = document.createElement("button");
    const duration = Number(settings.duration);

    toastElement.className = "toast alert " + TYPE_CLASS[toastType];
    toastElement.setAttribute("role", toastType === "error" ? "alert" : "status");
    toastElement.setAttribute("tabindex", "-1");

    messageElement.textContent = message || "";

    closeButton.className = "button button-ghost";
    closeButton.type = "button";
    closeButton.textContent = "ปิด";
    closeButton.setAttribute("aria-label", "ปิดข้อความแจ้งเตือน");
    closeButton.addEventListener("click", function () {
      removeToast(toastElement);
    });

    toastElement.appendChild(messageElement);
    toastElement.appendChild(closeButton);
    region.appendChild(toastElement);

    window.setTimeout(function () {
      removeToast(toastElement);
    }, Number.isFinite(duration) ? duration : DEFAULT_DURATION);

    return toastElement;
  }

  function clear() {
    const region = ensureRegion();
    region.replaceChildren();
  }

  window.KPRToast = {
    clear: clear,
    error: function (message, options) {
      return show("error", message, options);
    },
    info: function (message, options) {
      return show("info", message, options);
    },
    show: show,
    success: function (message, options) {
      return show("success", message, options);
    },
    warning: function (message, options) {
      return show("warning", message, options);
    }
  };

  // Example: window.KPRToast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
})();
