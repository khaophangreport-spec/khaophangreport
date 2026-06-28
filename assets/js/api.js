(function () {
  "use strict";

  const DEFAULT_TIMEOUT_MS = 15000;
  const DEFAULT_RETRY_COUNT = 1;
  const READ_ACTION_PATTERNS = [
    /\.check$/,
    /\.config$/,
    /\.list$/,
    /\.detail$/,
    /\.get$/,
    /\.summary$/,
    /\.track$/,
    /\.me$/
  ];
  const GET_READ_ACTIONS = [
    "health.check",
    "public.config",
    "category.list",
    "announcement.list"
  ];
  const PUBLIC_READ_CACHE_TTL_MS = Object.freeze({
    "public.config": 5 * 60 * 1000,
    "category.list": 5 * 60 * 1000,
    "announcement.list": 60 * 1000
  });
  const responseCache = Object.create(null);
  const inflightRequests = Object.create(null);
  const ERROR_MESSAGES = {
    VALIDATION_ERROR: "กรุณาตรวจสอบข้อมูล",
    RATE_LIMITED: "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง",
    SESSION_EXPIRED: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
    FORBIDDEN: "คุณไม่มีสิทธิ์ดำเนินการนี้",
    NETWORK_ERROR: "ไม่สามารถเชื่อมต่อระบบได้"
  };

  class ApiError extends Error {
    constructor(error, meta, status) {
      const code = error && error.code ? error.code : "NETWORK_ERROR";

      super(error && error.message ? error.message : ERROR_MESSAGES[code] || ERROR_MESSAGES.NETWORK_ERROR);
      this.name = "ApiError";
      this.code = code;
      this.fields = error && error.fields ? error.fields : {};
      this.retryAfterSeconds = error && Number.isFinite(error.retryAfterSeconds) ? error.retryAfterSeconds : 0;
      this.meta = meta || {};
      this.status = status || 0;
    }
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isReadAction(action) {
    return READ_ACTION_PATTERNS.some(function (pattern) {
      return pattern.test(action);
    });
  }

  function getRequestId() {
    if (window.KPR_UTILS && typeof window.KPR_UTILS.generateRequestId === "function") {
      return window.KPR_UTILS.generateRequestId();
    }

    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "REQ-" + window.crypto.randomUUID().toUpperCase();
    }

    return "REQ-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function shouldIncludeSession(action, options) {
    if (options && typeof options.sessionToken === "string") {
      return true;
    }

    if (options && options.withSession === true) {
      return true;
    }

    if (options && options.withSession === false) {
      return false;
    }

    return action.indexOf("admin.") === 0
      || action.indexOf("dashboard.") === 0
      || action === "auth.me"
      || action === "auth.logout";
  }

  function getSessionToken(action, options) {
    if (options && typeof options.sessionToken === "string") {
      return options.sessionToken;
    }

    if (!shouldIncludeSession(action, options)) {
      return "";
    }

    if (window.KPR_AUTH && typeof window.KPR_AUTH.getSessionToken === "function") {
      return window.KPR_AUTH.getSessionToken() || "";
    }

    return "";
  }

  function getApiUrl() {
    const config = window.APP_CONFIG || {};
    const apiUrl = config.API_URL || "";

    if (!apiUrl || apiUrl === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
      throw new ApiError({ code: "API_NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า API" }, {});
    }

    return apiUrl;
  }

  function createPayload(action, data, options) {
    if (typeof action !== "string" || !action.trim()) {
      throw new ApiError({ code: "VALIDATION_ERROR", message: "กรุณาระบุ API Action" }, {});
    }

    const payload = {
      action: action.trim(),
      requestId: options && options.requestId ? String(options.requestId) : getRequestId(),
      sessionToken: getSessionToken(action.trim(), options),
      data: isObject(data) ? data : {}
    };

    return payload;
  }

  async function parseJsonSafely(response) {
    const text = await response.text();

    if (!text) {
      throw new ApiError({ code: "NETWORK_ERROR", message: "ระบบไม่ส่งข้อมูลกลับมา" }, {}, response.status);
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ApiError({ code: "NETWORK_ERROR", message: "รูปแบบข้อมูลจากระบบไม่ถูกต้อง" }, {}, response.status);
    }
  }

  function normalizeResult(result, status) {
    if (!isObject(result) || typeof result.ok !== "boolean") {
      throw new ApiError({ code: "NETWORK_ERROR", message: "รูปแบบคำตอบจากระบบไม่ถูกต้อง" }, {}, status);
    }

    if (!result.ok) {
      throw new ApiError(result.error || {}, result.meta || {}, status);
    }

    return {
      ok: true,
      data: isObject(result.data) ? result.data : {},
      message: result.message || "ดำเนินการสำเร็จ",
      meta: isObject(result.meta) ? result.meta : {}
    };
  }

  function handleSessionExpired(error) {
    if (error.code !== "SESSION_EXPIRED" && error.code !== "UNAUTHORIZED") {
      return;
    }

    if (window.KPR_AUTH && typeof window.KPR_AUTH.handleSessionExpired === "function") {
      window.KPR_AUTH.handleSessionExpired(error);
    }
  }

  function shouldRetry(error, action, attempt, maxRetries) {
    if (attempt >= maxRetries || !isReadAction(action)) {
      return false;
    }

    return error.code === "NETWORK_ERROR" || error.code === "RATE_LIMITED";
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function shouldUseGet(payload) {
    return GET_READ_ACTIONS.indexOf(payload.action) !== -1 && !payload.sessionToken;
  }

  function getCacheTtlMs(action, options) {
    if (!Object.prototype.hasOwnProperty.call(PUBLIC_READ_CACHE_TTL_MS, action)) {
      return 0;
    }

    if (options && options.skipCache === true) {
      return 0;
    }

    if (options && Number.isFinite(options.cacheTtlMs)) {
      return Math.max(Number(options.cacheTtlMs), 0);
    }

    return PUBLIC_READ_CACHE_TTL_MS[action] || 0;
  }

  function cloneResult(result) {
    return JSON.parse(JSON.stringify(result));
  }

  function createCacheKey(payload) {
    return payload.action + "::" + JSON.stringify(payload.data || {});
  }

  function getCachedResult(cacheKey) {
    const entry = responseCache[cacheKey];

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      delete responseCache[cacheKey];
      return null;
    }

    return cloneResult(entry.result);
  }

  function setCachedResult(cacheKey, result, ttlMs) {
    if (!cacheKey || ttlMs <= 0) {
      return;
    }

    responseCache[cacheKey] = {
      expiresAt: Date.now() + ttlMs,
      result: cloneResult(result)
    };
  }

  function createGetUrl(apiUrl, payload) {
    const url = new URL(apiUrl);

    url.searchParams.set("action", payload.action);
    url.searchParams.set("requestId", payload.requestId);

    Object.keys(payload.data || {}).forEach(function (key) {
      const value = payload.data[key];

      if (value === null || value === undefined || isObject(value) || Array.isArray(value)) {
        return;
      }

      url.searchParams.set(key, String(value));
    });

    return url.toString();
  }

  async function sendRequest(apiUrl, payload, timeoutMs, externalSignal) {
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

    try {
      const requestOptions = shouldUseGet(payload)
        ? {
          method: "GET",
          signal: controller.signal
        }
        : {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        };
      const response = await fetch(shouldUseGet(payload) ? createGetUrl(apiUrl, payload) : apiUrl, requestOptions);
      const result = await parseJsonSafely(response);

      if (!response.ok && result.ok) {
        throw new ApiError({ code: "NETWORK_ERROR", message: "ระบบตอบกลับไม่สมบูรณ์" }, result.meta || {}, response.status);
      }

      return normalizeResult(result, response.status);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError({ code: "NETWORK_ERROR", message: ERROR_MESSAGES.NETWORK_ERROR }, {});
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function apiRequest(action, data, options) {
    const settings = options || {};
    const apiUrl = getApiUrl();
    const payload = createPayload(action, data || {}, settings);
    const timeoutMs = Number.isFinite(settings.timeoutMs) ? settings.timeoutMs : DEFAULT_TIMEOUT_MS;
    const maxRetries = isReadAction(payload.action)
      ? Number.isFinite(settings.retries) ? settings.retries : DEFAULT_RETRY_COUNT
      : 0;
    const cacheTtlMs = getCacheTtlMs(payload.action, settings);
    const cacheKey = cacheTtlMs > 0 && !payload.sessionToken ? createCacheKey(payload) : "";
    const cachedResult = cacheKey ? getCachedResult(cacheKey) : null;

    if (cachedResult) {
      return cachedResult;
    }

    if (cacheKey && !settings.signal && inflightRequests[cacheKey]) {
      return cloneResult(await inflightRequests[cacheKey]);
    }

    const requestPromise = (async function () {
      let attempt = 0;

      while (true) {
        try {
          return await sendRequest(apiUrl, payload, timeoutMs, settings.signal);
        } catch (error) {
          handleSessionExpired(error);

          if (!shouldRetry(error, payload.action, attempt, maxRetries)) {
            throw error;
          }

          attempt += 1;
          await wait(error.retryAfterSeconds > 0 ? error.retryAfterSeconds * 1000 : 300 * attempt);
        }
      }
    })();

    if (cacheKey && !settings.signal) {
      inflightRequests[cacheKey] = requestPromise;
    }

    try {
      const result = await requestPromise;

      setCachedResult(cacheKey, result, cacheTtlMs);
      return cloneResult(result);
    } finally {
      if (cacheKey && inflightRequests[cacheKey] === requestPromise) {
        delete inflightRequests[cacheKey];
      }
    }
  }

  function getErrorMessage(error) {
    if (error instanceof ApiError) {
      return ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES.NETWORK_ERROR;
    }

    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  window.KPR_API = Object.freeze({
    ApiError: ApiError,
    request: apiRequest,
    getErrorMessage: getErrorMessage,
    isReadAction: isReadAction,
    read: function (action, data, options) {
      return apiRequest(action, data || {}, options || {});
    },
    write: function (action, data, options) {
      const settings = options || {};
      settings.retries = 0;
      return apiRequest(action, data || {}, settings);
    }
  });

  // Example: window.KPR_API.request("category.list", {});
  // Example: window.KPR_API.request("admin.report.list", { page: 1, pageSize: 20 });
})();
