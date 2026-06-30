(function () {
  "use strict";

  let deferredInstallPrompt = null;
  let lastFocusedElement = null;
  let installButtons = [];
  let dialog = null;

  document.addEventListener("DOMContentLoaded", function () {
    installButtons = Array.prototype.slice.call(document.querySelectorAll("[data-install-app]"));

    installButtons.forEach(function (button) {
      button.addEventListener("click", handleInstallClick);
    });

    createIosDialog();
    registerServiceWorker();
    updateInstallButtonVisibility();
  });

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButtonVisibility();
  });

  window.addEventListener("appinstalled", function () {
    deferredInstallPrompt = null;
    hideInstallButtons();

    try {
      window.localStorage.setItem("kpr_app_installed", "1");
    } catch (error) {
      // Storage is optional.
    }
  });

  window.addEventListener("resize", updateInstallButtonVisibility);

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").catch(function (error) {
        if (window.console && typeof window.console.warn === "function") {
          window.console.warn("Service Worker registration failed:", error);
        }
      });
    });
  }

  function handleInstallClick() {
    if (isStandaloneMode()) {
      hideInstallButtons();
      return;
    }

    if (deferredInstallPrompt) {
      promptInstall();
      return;
    }

    if (isIosSafari()) {
      showIosDialog();
    }
  }

  function promptInstall() {
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    hideInstallButtons();

    promptEvent.prompt().then(function () {
      return promptEvent.userChoice;
    }).then(updateInstallButtonVisibility).catch(updateInstallButtonVisibility);
  }

  function updateInstallButtonVisibility() {
    if (!installButtons.length) {
      return;
    }

    if (isStandaloneMode()) {
      hideInstallButtons();
      return;
    }

    const shouldShow = Boolean(deferredInstallPrompt) || isIosSafari();

    installButtons.forEach(function (button) {
      button.hidden = !shouldShow;
    });
  }

  function hideInstallButtons() {
    installButtons.forEach(function (button) {
      button.hidden = true;
    });
  }

  function isStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIosSafari() {
    const userAgent = window.navigator.userAgent || "";
    const platform = window.navigator.platform || "";
    const isAppleTouchDevice = /iPad|iPhone|iPod/.test(platform) || (platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);

    return isAppleTouchDevice && isSafari && !isStandaloneMode();
  }

  function createIosDialog() {
    if (dialog || !document.body) {
      return;
    }

    dialog = document.createElement("div");
    dialog.className = "install-dialog";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "install-dialog-title");
    dialog.innerHTML = [
      '<div class="install-dialog__backdrop" data-install-dialog-close></div>',
      '<div class="install-dialog__panel" role="document">',
      '<button class="install-dialog__close" type="button" data-install-dialog-close aria-label="ปิดคำแนะนำ">×</button>',
      '<h2 id="install-dialog-title">เพิ่มแอปลงหน้าจอมือถือ</h2>',
      '<p>เปิดเว็บไซต์นี้ด้วย Safari จากนั้นกดปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”</p>',
      '<ol>',
      '<li>กดปุ่มแชร์ใน Safari</li>',
      '<li>เลือก “เพิ่มไปยังหน้าจอโฮม”</li>',
      '<li>กด “เพิ่ม”</li>',
      '</ol>',
      '<button class="button button-primary" type="button" data-install-dialog-close>เข้าใจแล้ว</button>',
      '</div>'
    ].join("");

    dialog.addEventListener("click", function (event) {
      if (event.target.closest("[data-install-dialog-close]")) {
        closeIosDialog();
      }
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeIosDialog();
      }
    });

    document.body.appendChild(dialog);
  }

  function showIosDialog() {
    if (!dialog) {
      return;
    }

    lastFocusedElement = document.activeElement;
    dialog.hidden = false;
    document.body.classList.add("install-dialog-open");

    const closeButton = dialog.querySelector("[data-install-dialog-close]");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeIosDialog() {
    if (!dialog) {
      return;
    }

    dialog.hidden = true;
    document.body.classList.remove("install-dialog-open");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }
})();
