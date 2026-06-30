(function () {
  "use strict";

  const INSTALL_TIMEOUT_MS = 30000;
  const INSTALLED_STORAGE_KEY = "kpr_app_installed";

  let deferredPrompt = null;
  let installButtons = [];
  let iosDialog = null;
  let liveRegion = null;
  let lastFocusedElement = null;
  let isPromptActive = false;
  let installTimeoutId = 0;
  let pendingAcceptedInstall = false;

  document.addEventListener("DOMContentLoaded", function () {
    installButtons = Array.prototype.slice.call(document.querySelectorAll("[data-install-app]"));

    installButtons.forEach(function (button) {
      button.dataset.installLabel = getButtonLabel(button);
      button.addEventListener("click", handleInstallClick);
    });

    createLiveRegion();
    createIosDialog();
    registerServiceWorker();
    updateInstallButtonVisibility();
  });

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    logPwa("PWA_BEFOREINSTALLPROMPT_CAPTURED");
    updateInstallButtonVisibility();
  });

  window.addEventListener("appinstalled", function () {
    pendingAcceptedInstall = false;
    deferredPrompt = null;
    clearInstallTimeout();
    setButtonsBusy(false);
    hideInstallButtons();
    announce("ติดตั้งแอปสำเร็จ");
    logPwa("PWA_APPINSTALLED");

    try {
      window.localStorage.setItem(INSTALLED_STORAGE_KEY, "1");
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
      navigator.serviceWorker.register("/service-worker.js", {
        scope: "/"
      }).catch(function (error) {
        logPwa("PWA_SERVICE_WORKER_REGISTRATION_FAILED", error && error.name ? error.name : "unknown");
      });
    });
  }

  function handleInstallClick() {
    if (isStandaloneMode()) {
      logPwa("PWA_STANDALONE_DETECTED");
      hideInstallButtons();
      return;
    }

    if (isPromptActive) {
      return;
    }

    if (deferredPrompt) {
      promptInstall();
      return;
    }

    if (isIosDevice()) {
      showIosDialog();
    }
  }

  function promptInstall() {
    const promptEvent = deferredPrompt;

    if (!promptEvent) {
      updateInstallButtonVisibility();
      return;
    }

    isPromptActive = true;
    deferredPrompt = null;
    setButtonsBusy(true);
    setButtonLabel("กำลังเปิดหน้าต่างติดตั้ง...");
    logPwa("PWA_PROMPT_OPENED");

    Promise.resolve(promptEvent.prompt()).then(function () {
      return promptEvent.userChoice;
    }).then(function (choice) {
      const outcome = choice && choice.outcome ? choice.outcome : "";

      if (outcome === "accepted") {
        pendingAcceptedInstall = true;
        setButtonLabel("กำลังติดตั้ง...");
        announce("กำลังติดตั้งแอป");
        startInstallTimeout();
        logPwa("PWA_USER_ACCEPTED");
        return;
      }

      pendingAcceptedInstall = false;
      setButtonsBusy(false);
      restoreButtonLabels();
      updateInstallButtonVisibility();
      logPwa("PWA_USER_DISMISSED");
    }).catch(function (error) {
      pendingAcceptedInstall = false;
      setButtonsBusy(false);
      restoreButtonLabels();
      updateInstallButtonVisibility();
      logPwa("PWA_PROMPT_FAILED", error && error.name ? error.name : "unknown");
    }).then(function () {
      isPromptActive = false;
    });
  }

  function startInstallTimeout() {
    clearInstallTimeout();
    installTimeoutId = window.setTimeout(function () {
      if (!pendingAcceptedInstall || isStandaloneMode()) {
        return;
      }

      pendingAcceptedInstall = false;
      setButtonsBusy(false);
      restoreButtonLabels();
      announce("โปรดตรวจสอบรายการแอปบนอุปกรณ์");
      updateInstallButtonVisibility();
      logPwa("PWA_INSTALL_TIMEOUT_CHECK_DEVICE");
    }, INSTALL_TIMEOUT_MS);
  }

  function clearInstallTimeout() {
    if (installTimeoutId) {
      window.clearTimeout(installTimeoutId);
      installTimeoutId = 0;
    }
  }

  function updateInstallButtonVisibility() {
    if (!installButtons.length) {
      return;
    }

    if (isStandaloneMode()) {
      logPwa("PWA_STANDALONE_DETECTED");
      hideInstallButtons();
      return;
    }

    if (pendingAcceptedInstall) {
      showInstallButtons();
      return;
    }

    if (deferredPrompt || isIosDevice()) {
      showInstallButtons();
      return;
    }

    hideInstallButtons();
  }

  function showInstallButtons() {
    installButtons.forEach(function (button) {
      button.hidden = false;
    });
  }

  function hideInstallButtons() {
    installButtons.forEach(function (button) {
      button.hidden = true;
    });
  }

  function setButtonsBusy(isBusy) {
    installButtons.forEach(function (button) {
      button.disabled = isBusy;
      button.setAttribute("aria-busy", isBusy ? "true" : "false");
    });
  }

  function setButtonLabel(label) {
    installButtons.forEach(function (button) {
      const labelElement = button.querySelector(".app-install-button__label");
      if (labelElement) {
        labelElement.textContent = label;
      }
    });
  }

  function restoreButtonLabels() {
    installButtons.forEach(function (button) {
      const labelElement = button.querySelector(".app-install-button__label");
      if (labelElement) {
        labelElement.textContent = button.dataset.installLabel || "ติดตั้งแอป";
      }
    });
  }

  function getButtonLabel(button) {
    const labelElement = button.querySelector(".app-install-button__label");
    return labelElement ? labelElement.textContent : "ติดตั้งแอป";
  }

  function announce(message) {
    if (!liveRegion) {
      return;
    }

    liveRegion.textContent = message;
  }

  function createLiveRegion() {
    if (liveRegion || !document.body) {
      return;
    }

    liveRegion = document.createElement("div");
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("data-install-app-status", "");
    document.body.appendChild(liveRegion);
  }

  function isStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIosDevice() {
    const platform = window.navigator.platform || "";
    return /iPad|iPhone|iPod/.test(platform) || (platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  }

  function isIosSafari() {
    const userAgent = window.navigator.userAgent || "";
    return isIosDevice() && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|Line|FBAN|FBAV|Instagram/.test(userAgent);
  }

  function createIosDialog() {
    if (iosDialog || !document.body) {
      return;
    }

    iosDialog = document.createElement("div");
    iosDialog.className = "install-dialog";
    iosDialog.hidden = true;
    iosDialog.setAttribute("role", "dialog");
    iosDialog.setAttribute("aria-modal", "true");
    iosDialog.setAttribute("aria-labelledby", "install-dialog-title");
    iosDialog.innerHTML = [
      '<div class="install-dialog__backdrop" data-install-dialog-close></div>',
      '<div class="install-dialog__panel" role="document">',
      '<button class="install-dialog__close" type="button" data-install-dialog-close aria-label="ปิดคำแนะนำ">×</button>',
      '<h2 id="install-dialog-title">เพิ่มแอปลงหน้าจอมือถือ</h2>',
      '<p data-ios-install-intro></p>',
      '<ol>',
      '<li>เปิดด้วย Safari</li>',
      '<li>แตะปุ่มแชร์</li>',
      '<li>เลือก “เพิ่มไปยังหน้าจอโฮม”</li>',
      '<li>แตะ “เพิ่ม”</li>',
      '</ol>',
      '<button class="button button-primary" type="button" data-install-dialog-close>เข้าใจแล้ว</button>',
      '</div>'
    ].join("");

    iosDialog.addEventListener("click", function (event) {
      if (event.target.closest("[data-install-dialog-close]")) {
        closeIosDialog();
      }
    });

    iosDialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeIosDialog();
      }
    });

    document.body.appendChild(iosDialog);
  }

  function showIosDialog() {
    if (!iosDialog) {
      return;
    }

    const intro = iosDialog.querySelector("[data-ios-install-intro]");
    if (intro) {
      intro.textContent = isIosSafari()
        ? "ใช้เมนูแชร์ของ Safari เพื่อเพิ่ม Khaophang Report ลงหน้าจอโฮม"
        : "หากเปิดจาก LINE, Facebook หรือเบราว์เซอร์ในแอป ให้เปิดหน้านี้ด้วย Safari ก่อน แล้วจึงเพิ่มไปยังหน้าจอโฮม";
    }

    lastFocusedElement = document.activeElement;
    iosDialog.hidden = false;
    document.body.classList.add("install-dialog-open");

    const closeButton = iosDialog.querySelector("[data-install-dialog-close]");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeIosDialog() {
    if (!iosDialog) {
      return;
    }

    iosDialog.hidden = true;
    document.body.classList.remove("install-dialog-open");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function logPwa(eventName, detail) {
    if (!isDebugEnabled() || !window.console || typeof window.console.info !== "function") {
      return;
    }

    if (detail) {
      window.console.info(eventName, detail);
      return;
    }

    window.console.info(eventName);
  }

  function isDebugEnabled() {
    const host = window.location && window.location.hostname ? window.location.hostname : "";
    const search = window.location && window.location.search ? window.location.search : "";

    return host === "localhost" || host === "127.0.0.1" || search.indexOf("pwaDebug=1") !== -1;
  }
})();
