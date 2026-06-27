(function () {
  "use strict";

  const SESSION_KEY = "KPR_ADMIN_SESSION";
  const DEFAULT_DASHBOARD_URL = "dashboard.html";
  const LOGIN_ERROR_MESSAGE = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
  const ACCOUNT_LOCKED_MESSAGE = "บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง";
  const RATE_LIMITED_MESSAGE = "มีการเข้าสู่ระบบถี่เกินไป กรุณาลองใหม่ภายหลัง";
  const NETWORK_ERROR_MESSAGE = "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่";
  let currentUser = null;

  function readSession() {
    try {
      const rawSession = window.sessionStorage.getItem(SESSION_KEY);
      return rawSession ? JSON.parse(rawSession) : null;
    } catch (error) {
      return null;
    }
  }

  function writeSession(session) {
    if (!session || !session.sessionToken) {
      return;
    }

    const safeSession = {
      sessionToken: String(session.sessionToken),
      expiresAt: session.expiresAt || "",
      user: session.user || null
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeSession));
    currentUser = safeSession.user;
  }

  function clearSession() {
    window.sessionStorage.removeItem(SESSION_KEY);
    currentUser = null;
  }

  function isSessionExpired(session) {
    if (!session || !session.expiresAt) {
      return false;
    }

    const expiresAt = new Date(session.expiresAt);

    return !isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now();
  }

  function getStoredSession() {
    const session = readSession();

    if (isSessionExpired(session)) {
      clearSession();
      return null;
    }

    return session;
  }

  function updateStoredUser(user) {
    const session = getStoredSession();

    currentUser = user || null;

    if (!session || !session.sessionToken) {
      return;
    }

    writeSession({
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt || "",
      user: currentUser
    });
  }

  function getSafeReturnUrl() {
    const fallback = DEFAULT_DASHBOARD_URL;
    const params = new URLSearchParams(window.location.search);
    const rawReturnUrl = (params.get("returnUrl") || "").trim();

    if (!rawReturnUrl) {
      return fallback;
    }

    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(rawReturnUrl) || rawReturnUrl.indexOf("\\") !== -1) {
      return fallback;
    }

    try {
      const targetUrl = new URL(rawReturnUrl, window.location.href);
      const adminMarker = "/admin/";

      if (targetUrl.origin !== window.location.origin || targetUrl.pathname.indexOf(adminMarker) === -1) {
        return fallback;
      }

      if (/\/login\.html$/i.test(targetUrl.pathname)) {
        return fallback;
      }

      return targetUrl.pathname.split(adminMarker).pop() + targetUrl.search + targetUrl.hash;
    } catch (error) {
      return fallback;
    }
  }

  function redirectAfterLogin() {
    window.location.href = getSafeReturnUrl();
  }

  function isLoginPage() {
    return /\/admin\/login\.html$/i.test(window.location.pathname) ||
      document.body.classList.contains("admin-login-page");
  }

  function getCurrentAdminReturnUrl() {
    const adminMarker = "/admin/";
    const pathname = window.location.pathname;

    if (pathname.indexOf(adminMarker) === -1 || /\/login\.html$/i.test(pathname)) {
      return DEFAULT_DASHBOARD_URL;
    }

    return pathname.split(adminMarker).pop() + window.location.search + window.location.hash;
  }

  function buildLoginUrl() {
    const returnUrl = getCurrentAdminReturnUrl();

    if (returnUrl === DEFAULT_DASHBOARD_URL) {
      return "login.html";
    }

    return "login.html?returnUrl=" + encodeURIComponent(returnUrl);
  }

  function redirectToLogin() {
    clearSession();

    if (isLoginPage()) {
      return;
    }

    window.location.replace(buildLoginUrl());
  }

  async function verifySession() {
    const session = getStoredSession();

    if (!session || !session.sessionToken || !window.KPR_API) {
      clearSession();
      return null;
    }

    try {
      const result = await window.KPR_API.write("auth.me", {}, {
        sessionToken: session.sessionToken,
        withSession: true
      });
      const user = result && result.data ? result.data.user || result.data : null;

      updateStoredUser(user);
      return user;
    } catch (error) {
      clearSession();
      return null;
    }
  }

  async function requireAdminSession() {
    const user = await verifySession();

    if (!user) {
      redirectToLogin();
      return null;
    }

    return user;
  }

  function setText(element, text) {
    if (element) {
      element.textContent = text || "";
    }
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = !!hidden;
    }
  }

  function normalizeInput(value) {
    return String(value || "").trim();
  }

  function resetFieldState(form) {
    Array.prototype.forEach.call(form.querySelectorAll("[data-field-error]"), function (element) {
      element.textContent = "";
    });

    Array.prototype.forEach.call(form.querySelectorAll(".form-control"), function (input) {
      input.removeAttribute("aria-invalid");
    });
  }

  function showFieldError(form, fieldName, message) {
    const errorElement = form.querySelector('[data-field-error="' + fieldName + '"]');
    const input = form.elements[fieldName];

    setText(errorElement, message);

    if (input) {
      input.setAttribute("aria-invalid", "true");
    }
  }

  function validateLoginForm(form) {
    const fields = {};
    const username = normalizeInput(form.elements.username && form.elements.username.value);
    const password = String(form.elements.password && form.elements.password.value || "");

    if (!username) {
      fields.username = "กรุณากรอกชื่อผู้ใช้";
    }

    if (!password) {
      fields.password = "กรุณากรอกรหัสผ่าน";
    }

    return {
      ok: Object.keys(fields).length === 0,
      fields: fields,
      data: {
        username: username,
        password: password
      }
    };
  }

  function focusFirstInvalidField(form, fields) {
    const firstFieldName = Object.keys(fields)[0];

    if (firstFieldName && form.elements[firstFieldName]) {
      form.elements[firstFieldName].focus();
    }
  }

  function getLoginErrorMessage(error) {
    const code = error && error.code ? error.code : "";

    if (code === "RATE_LIMITED") {
      return RATE_LIMITED_MESSAGE;
    }

    if (code === "ACCOUNT_LOCKED") {
      return ACCOUNT_LOCKED_MESSAGE;
    }

    if (code === "INVALID_CREDENTIALS" || code === "ACCOUNT_INACTIVE" || code === "UNAUTHORIZED") {
      return LOGIN_ERROR_MESSAGE;
    }

    if (code === "NETWORK_ERROR" || code === "API_NOT_CONFIGURED") {
      return NETWORK_ERROR_MESSAGE;
    }

    return LOGIN_ERROR_MESSAGE;
  }

  function setLoginLoading(form, isLoading, text) {
    const submitButton = form.querySelector("[data-login-submit]");

    form.setAttribute("aria-busy", isLoading ? "true" : "false");

    if (!submitButton) {
      return;
    }

    if (!submitButton.dataset.defaultText) {
      submitButton.dataset.defaultText = submitButton.textContent;
    }

    submitButton.disabled = !!isLoading;
    submitButton.textContent = isLoading ? text : submitButton.dataset.defaultText;
  }

  function resetLoginInteractivity(form) {
    form.style.pointerEvents = "";
    form.removeAttribute("inert");
    form.setAttribute("aria-busy", "false");

    Array.prototype.forEach.call(form.querySelectorAll("input, button"), function (element) {
      if (element.matches("[data-login-submit]")) {
        element.disabled = false;
      }

      if (element.tagName === "INPUT") {
        element.disabled = false;
        element.readOnly = false;
        element.removeAttribute("tabindex");
        element.removeAttribute("aria-disabled");
      }
    });
  }

  function setupPasswordToggle(form) {
    const toggle = form.querySelector("[data-toggle-password]");
    const passwordInput = form.elements.password;

    if (!toggle || !passwordInput) {
      return;
    }

    toggle.addEventListener("click", function () {
      const shouldShow = passwordInput.type === "password";

      passwordInput.type = shouldShow ? "text" : "password";
      toggle.textContent = shouldShow ? "ซ่อน" : "แสดง";
      toggle.setAttribute("aria-label", shouldShow ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน");
      passwordInput.focus();
    });
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const errorElement = form.querySelector("[data-login-error]");

    if (form.dataset.submitting === "true") {
      return;
    }

    resetFieldState(form);
    setHidden(errorElement, true);

    const validation = validateLoginForm(form);

    if (!validation.ok) {
      Object.keys(validation.fields).forEach(function (fieldName) {
        showFieldError(form, fieldName, validation.fields[fieldName]);
      });
      focusFirstInvalidField(form, validation.fields);
      return;
    }

    form.dataset.submitting = "true";
    setLoginLoading(form, true, "กำลังเข้าสู่ระบบ...");

    try {
      if (!window.KPR_API) {
        throw {
          code: "NETWORK_ERROR"
        };
      }

      const result = await window.KPR_API.write("auth.login", {
        username: validation.data.username,
        password: validation.data.password
      }, {
        withSession: false
      });

      if (!result || !result.data || !result.data.sessionToken) {
        throw new window.KPR_API.ApiError({
          code: "UNAUTHORIZED",
          message: LOGIN_ERROR_MESSAGE
        }, {});
      }

      writeSession(result.data);

      const user = await verifySession();

      if (!user) {
        throw new window.KPR_API.ApiError({
          code: "UNAUTHORIZED",
          message: LOGIN_ERROR_MESSAGE
        }, {});
      }

      if (form.elements.password) {
        form.elements.password.value = "";
      }

      redirectAfterLogin();
    } catch (error) {
      clearSession();
      setText(errorElement, getLoginErrorMessage(error));
      setHidden(errorElement, false);
    } finally {
      form.dataset.submitting = "false";
      setLoginLoading(form, false, "");
    }
  }

  async function initLoginPage() {
    const form = document.querySelector("[data-admin-login-form]");

    if (!form) {
      return;
    }

    resetLoginInteractivity(form);
    resetFieldState(form);
    setupPasswordToggle(form);
    form.addEventListener("submit", handleLoginSubmit);

    const errorElement = form.querySelector("[data-login-error]");
    setHidden(errorElement, true);

    if (getStoredSession() && window.KPR_API) {
      setLoginLoading(form, true, "กำลังตรวจสอบเซสชัน...");

      try {
        const user = await verifySession();

        if (user) {
          redirectAfterLogin();
        }
      } finally {
        setLoginLoading(form, false, "");
      }
    }
  }

  async function logout() {
    const session = getStoredSession();
    const sessionToken = session && session.sessionToken ? session.sessionToken : "";

    try {
      if (sessionToken && window.KPR_API) {
        await window.KPR_API.write("auth.logout", {}, {
          sessionToken: sessionToken,
          withSession: true
        });
      }
    } catch (error) {
      // Client session is cleared even when the revoke request cannot complete.
    } finally {
      clearSession();
      if (!isLoginPage()) {
        window.location.href = "login.html";
      }
    }
  }

  const storedSession = getStoredSession();
  if (storedSession && storedSession.user) {
    currentUser = storedSession.user;
  }

  window.KPR_AUTH = {
    getSessionToken: function () {
      const session = getStoredSession();
      return session && session.sessionToken ? session.sessionToken : "";
    },
    getCurrentUser: function () {
      return currentUser;
    },
    setSession: function (session) {
      writeSession(session);
    },
    clearSession: function () {
      clearSession();
    },
    setCurrentUserForLayout: function (user) {
      updateStoredUser(user || null);
    },
    handleSessionExpired: function () {
      redirectToLogin();
    },
    verifySession: verifySession,
    requireAdminSession: requireAdminSession,
    redirectToLogin: redirectToLogin,
    getReturnUrl: getSafeReturnUrl,
    logout: logout
  };

  document.addEventListener("DOMContentLoaded", initLoginPage);
})();
