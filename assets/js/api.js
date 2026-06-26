(function () {
  "use strict";

  const DEFAULT_TIMEOUT_MS = 15000;
  const DEFAULT_RETRY_DELAY_MS = 500;
  const MAX_RETRIES = 1;
  const SAFE_READ_ACTIONS = new Set([
    "health.check",
    "public.config",
    "category.list",
    "announcement.list",
    "report.track",
    "auth.me",
    "dashboard.summary",
    "admin.report.list",
    "admin.report.detail",
    "admin.category.list",
    "admin.user.list",
    "admin.announcement.list",
    "admin.settings.get",
    "admin.activity.list"
  ]);

  const USER_MESSAGES = {
    VALIDATION_ERROR: "กรุณาตรวจสอบข้อมูล",
    RATE_LIMITED: "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง",
    SESSION_EXPIRED: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
    FORBIDDEN: "คุณไม่มีสิทธิ์ดำเนินการนี้",
    NETWORK_ERROR: "ไม่สามารถเชื่อมต่อระบบได้"
  };

  class ApiError extends Error {
    constructor(error, meta) {
      const normalizedError = error || {};
      const code = normalizedError.code || "NETWORK_ERROR";
      const message = normalizedError.message || USER_MESSAGES[code] || USER_MESSAGES.NETWORK_ERROR;

      super(message);
      this.name = "ApiError";
      this.code = code;
      this.fields = normalizedError.fields || {};
      this.meta = meta || {};
      this.retryAfterSeconds = normalizedError.retryAfterSeconds || 0;
      this.status = normalizedError.status || 0;
      this.userMessage = USER_MESSAGES[code] || message;
    }
  }

  function getConfig() {
    return window.APP_CONFIG || {};
  }

  function isPlaceholderUrl(apiUrl) {
    return !apiUrl || apiUrl === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
  }

  function createRequestId() {
    if (window.KPRUtils && typeof window.KPRUtils.generateRequestId === "function") {
      return window.KPRUtils.generateRequestId();
    }

    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "REQ-" + window.crypto.randomUUID();
    }

    return "REQ-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function getSessionToken(options) {
    if (options && typeof options.sessionToken === "string") {
      return options.sessionToken;
    }

    if (window.KPRAuth && typeof window.KPRAuth.getSessionToken === "function") {
      return window.KPRAuth.getSessionToken() || "";
    }

    return "";
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function buildPayload(action, data, options) {
    return {
      action: action,
      requestId: options && options.requestId ? options.requestId : createRequestId(),
      sessionToken: getSessionToken(options),
      data: isPlainObject(data) ? data : {}
    };
  }

  function createTimeoutSignal(timeoutMs, externalSignal) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(function () {
      controller.abort();
    }, timeoutMs);

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener("abort", function () {
          controller.abort();
        }, { once: true });
      }
    }

    return {
      signal: controller.signal,
      clear: function () {
        window.clearTimeout(timeoutId);
      }
    };
  }

  function shouldRetry(action, error, attempt, maxRetries) {
    if (!SAFE_READ_ACTIONS.has(action) || attempt >= maxRetries) {
      return false;
    }

    if (!(error instanceof ApiError)) {
      return true;
    }

    if (error.code === "RATE_LIMITED" || error.code === "VALIDATION_ERROR" || error.code === "FORBIDDEN" || error.code === "SESSION_EXPIRED") {
      return false;
    }

    return error.code === "NETWORK_ERROR" || error.status >= 500;
  }

  function wait(delayMs) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, delayMs);
    });
  }

  async function parseJsonResponse(response) {
    const responseText = await response.text();

    if (!responseText) {
      throw new ApiError({
        code: "NETWORK_ERROR",
        message: "ระบบไม่ส่งข้อมูลกลับมา",
        status: response.status
      }, {});
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      throw new ApiError({
        code: "NETWORK_ERROR",
        message: "ระบบตอบกลับไม่ถูกต้อง",
        status: response.status
      }, {});
    }
  }

  function normalizeHttpError(response, result) {
    if (result && result.error) {
      return new ApiError(Object.assign({}, result.error, { status: response.status }), result.meta);
    }

    return new ApiError({
      code: "NETWORK_ERROR",
      message: response.ok ? "ระบบตอบกลับไม่ถูกต้อง" : "ไม่สามารถเชื่อมต่อระบบได้",
      status: response.status
    }, result && result.meta ? result.meta : {});
  }

  async function sendRequest(payload, options) {
    const config = getConfig();
    const timeoutMs = Number(options && options.timeoutMs) || DEFAULT_TIMEOUT_MS;
    const timeoutSignal = createTimeoutSignal(timeoutMs, options && options.signal);

    if (isPlaceholderUrl(config.API_URL)) {
      throw new ApiError({
        code: "API_NOT_CONFIGURED",
        message: "ยังไม่ได้ตั้งค่า API"
      }, { requestId: payload.requestId });
    }

    try {
      const response = await fetch(config.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: timeoutSignal.signal
      });
      const result = await parseJsonResponse(response);

      if (!response.ok || !result || result.ok !== true) {
        throw normalizeHttpError(response, result);
      }

      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError({
        code: "NETWORK_ERROR",
        message: error && error.name === "AbortError" ? "การเชื่อมต่อใช้เวลานานเกินไป" : USER_MESSAGES.NETWORK_ERROR
      }, { requestId: payload.requestId });
    } finally {
      timeoutSignal.clear();
    }
  }

  async function apiRequest(action, data, options) {
    const requestOptions = options || {};
    const payload = buildPayload(action, data || {}, requestOptions);
    const maxRetries = SAFE_READ_ACTIONS.has(action) ? Number(requestOptions.retries ?? MAX_RETRIES) : 0;
    let attempt = 0;

    while (true) {
      try {
        return await sendRequest(payload, requestOptions);
      } catch (error) {
        if (!shouldRetry(action, error, attempt, maxRetries)) {
          throw error;
        }

        attempt += 1;
        await wait(Number(requestOptions.retryDelayMs) || DEFAULT_RETRY_DELAY_MS);
      }
    }
  }

  function publicRequest(action, data, options) {
    return apiRequest(action, data || {}, Object.assign({}, options || {}, { sessionToken: "" }));
  }

  function adminRequest(action, data, options) {
    return apiRequest(action, data || {}, options || {});
  }

  function isApiError(error) {
    return error instanceof ApiError;
  }

  window.KPRApi = {
    ApiError: ApiError,
    ERROR_MESSAGES: USER_MESSAGES,
    adminRequest: adminRequest,
    isApiError: isApiError,
    publicRequest: publicRequest,
    request: apiRequest
  };

  // Examples:
  // const categories = await window.KPRApi.publicRequest("category.list", {});
  // const reports = await window.KPRApi.adminRequest("admin.report.list", { page: 1, pageSize: 20 });
})();
