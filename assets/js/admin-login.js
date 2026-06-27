(function () {
  "use strict";

  const DASHBOARD_URL = "dashboard.html";

  const state = {
    isSubmitting: false
  };

  function getElements() {
    return {
      form: document.querySelector("[data-admin-login-form]"),
      username: document.getElementById("admin-username"),
      password: document.getElementById("admin-password"),
      submit: document.querySelector("[data-login-submit]"),
      togglePassword: document.querySelector("[data-toggle-password]"),
      errorBox: document.querySelector("[data-login-error]"),
      fieldErrors: {
        username: document.querySelector("[data-field-error='username']"),
        password: document.querySelector("[data-field-error='password']")
      }
    };
  }

  function setHidden(element, isHidden) {
    if (!element) {
      return;
    }

    element.hidden = !!isHidden;
  }

  function clearErrors(elements) {
    if (elements.errorBox) {
      elements.errorBox.textContent = "";
      setHidden(elements.errorBox, true);
    }

    Object.keys(elements.fieldErrors).forEach(function (key) {
      const errorElement = elements.fieldErrors[key];
      if (errorElement) {
        errorElement.textContent = "";
      }
    });
  }

  function showError(elements, message) {
    if (!elements.errorBox) {
      return;
    }

    elements.errorBox.textContent = message || "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่";
    setHidden(elements.errorBox, false);
  }

  function showFieldError(elements, fieldName, message) {
    const errorElement = elements.fieldErrors[fieldName];

    if (errorElement) {
      errorElement.textContent = message || "";
    }
  }

  function normalizeFormState(elements) {
    [elements.username, elements.password].forEach(function (input) {
      if (!input) {
        return;
      }

      input.disabled = false;
      input.readOnly = false;
      input.removeAttribute("aria-disabled");
      input.removeAttribute("inert");

      if (input.getAttribute("tabindex") === "-1") {
        input.removeAttribute("tabindex");
      }
    });

    if (elements.form) {
      elements.form.style.pointerEvents = "";
      elements.form.removeAttribute("aria-disabled");
      elements.form.removeAttribute("inert");
      elements.form.setAttribute("aria-busy", "false");
    }

    if (elements.submit) {
      elements.submit.disabled = false;
      elements.submit.removeAttribute("aria-disabled");
      elements.submit.textContent = "เข้าสู่ระบบ";
    }
  }

  function setSubmitting(elements, isSubmitting) {
    state.isSubmitting = !!isSubmitting;

    if (elements.form) {
      elements.form.setAttribute("aria-busy", isSubmitting ? "true" : "false");
    }

    if (elements.submit) {
      elements.submit.disabled = isSubmitting;
      elements.submit.textContent = isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ";
    }
  }

  function validate(elements) {
    const username = elements.username ? elements.username.value.trim() : "";
    const password = elements.password ? elements.password.value : "";
    const fields = {};

    if (!username) {
      fields.username = "กรุณากรอกชื่อผู้ใช้";
    }

    if (!password) {
      fields.password = "กรุณากรอกรหัสผ่าน";
    }

    Object.keys(fields).forEach(function (fieldName) {
      showFieldError(elements, fieldName, fields[fieldName]);
    });

    if (fields.username && elements.username) {
      elements.username.focus();
    } else if (fields.password && elements.password) {
      elements.password.focus();
    }

    return {
      ok: Object.keys(fields).length === 0,
      username: username,
      password: password
    };
  }

  function getErrorMessage(error) {
    if (window.KPR_API && typeof window.KPR_API.getErrorMessage === "function") {
      return window.KPR_API.getErrorMessage(error);
    }

    return error && error.message ? error.message : "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่";
  }

  async function handleSubmit(event, elements) {
    event.preventDefault();

    if (state.isSubmitting) {
      return;
    }

    normalizeFormState(elements);
    clearErrors(elements);

    const formValue = validate(elements);
    if (!formValue.ok) {
      return;
    }

    setSubmitting(elements, true);

    try {
      if (!window.KPR_API || typeof window.KPR_API.write !== "function") {
        throw new Error("ยังไม่พร้อมเชื่อมต่อ API");
      }

      const result = await window.KPR_API.write("auth.login", {
        username: formValue.username,
        password: formValue.password,
        deviceKey: window.navigator && window.navigator.userAgent ? window.navigator.userAgent.slice(0, 120) : ""
      }, {
        withSession: false
      });

      if (window.KPR_AUTH && typeof window.KPR_AUTH.setSession === "function") {
        window.KPR_AUTH.setSession(result.data || {});
      }

      if (window.KPR_TOAST && typeof window.KPR_TOAST.success === "function") {
        window.KPR_TOAST.success(result.message || "เข้าสู่ระบบสำเร็จ");
      }

      window.location.href = DASHBOARD_URL;
    } catch (error) {
      showError(elements, getErrorMessage(error));
    } finally {
      setSubmitting(elements, false);
      normalizeFormState(elements);
    }
  }

  function bindPasswordToggle(elements) {
    if (!elements.togglePassword || !elements.password) {
      return;
    }

    elements.togglePassword.addEventListener("click", function () {
      const isVisible = elements.password.type === "text";

      elements.password.type = isVisible ? "password" : "text";
      elements.togglePassword.textContent = isVisible ? "แสดง" : "ซ่อน";
      elements.togglePassword.setAttribute("aria-label", isVisible ? "แสดงรหัสผ่าน" : "ซ่อนรหัสผ่าน");
      elements.password.focus();
    });
  }

  function bindInputCleanup(elements) {
    [elements.username, elements.password].forEach(function (input) {
      if (!input) {
        return;
      }

      input.addEventListener("input", function () {
        clearErrors(elements);
      });
    });
  }

  function init() {
    const elements = getElements();

    if (!elements.form || !elements.username || !elements.password) {
      return;
    }

    normalizeFormState(elements);
    clearErrors(elements);
    bindPasswordToggle(elements);
    bindInputCleanup(elements);

    elements.form.addEventListener("submit", function (event) {
      handleSubmit(event, elements);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
