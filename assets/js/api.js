(function () {
  "use strict";

  class ApiError extends Error {
    constructor(error, meta) {
      super(error && error.message ? error.message : "ไม่สามารถเชื่อมต่อระบบได้");
      this.name = "ApiError";
      this.code = error && error.code ? error.code : "NETWORK_ERROR";
      this.fields = error && error.fields ? error.fields : {};
      this.meta = meta || {};
    }
  }

  async function apiRequest(action, data, options) {
    if (!window.APP_CONFIG || !window.APP_CONFIG.API_URL) {
      throw new ApiError({ code: "API_NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า API" }, {});
    }

    const payload = {
      action: action,
      requestId: options && options.requestId ? options.requestId : crypto.randomUUID(),
      sessionToken: options && options.sessionToken ? options.sessionToken : "",
      data: data || {}
    };

    const response = await fetch(window.APP_CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!result.ok) {
      throw new ApiError(result.error, result.meta);
    }

    return result;
  }

  window.KPRApi = {
    ApiError: ApiError,
    request: apiRequest
  };
})();

