const ROUTER_ACTIONS_ = Object.freeze({
  "health.check": Router_healthCheck_,
  "public.config": SettingsService_getPublicConfig,
  "category.list": CategoryService_listPublic,
  "announcement.list": AnnouncementService_listPublic
});

function Router_handleGet_(e) {
  const action = e && e.parameter && e.parameter.action ? e.parameter.action : "health.check";
  const requestId = e && e.parameter && e.parameter.requestId ? e.parameter.requestId : Utils_createRequestId_();

  return Router_dispatch_({
    action: action,
    requestId: requestId,
    sessionToken: "",
    data: {}
  });
}

function Router_handlePost_(e) {
  const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : "";
  const parsed = Utils_safeJsonParse_(rawBody);

  if (!parsed.ok) {
    return Response_error_("VALIDATION_ERROR", "รูปแบบ JSON ไม่ถูกต้อง", {
      request: "กรุณาส่ง JSON ตามรูปแบบ API"
    }, {
      requestId: "",
      action: ""
    });
  }

  return Router_dispatch_(parsed.data);
}

function Router_dispatch_(payload) {
  const meta = {
    requestId: payload && payload.requestId ? String(payload.requestId) : "",
    action: payload && payload.action ? String(payload.action) : ""
  };

  try {
    Validation_validateEnvelope_(payload);

    const action = Utils_normalizeString_(payload.action);
    const handler = ROUTER_ACTIONS_[action];

    if (!handler) {
      throw ApiError_("NOT_FOUND", "ไม่พบ API Action นี้", {
        action: "Action ไม่อยู่ในรายการที่อนุญาต"
      });
    }

    meta.requestId = payload.requestId || Utils_createRequestId_();
    meta.action = action;

    const result = handler({
      action: action,
      requestId: meta.requestId,
      sessionToken: payload.sessionToken || "",
      data: payload.data || {}
    });

    return Response_success_(result.data, result.message, meta);
  } catch (error) {
    return Response_fromException_(error, meta);
  }
}

function Router_healthCheck_(request) {
  const publicConfig = Config_getPublicAppConfig_();

  return {
    data: {
      status: "ok",
      apiVersion: publicConfig.apiVersion,
      environment: publicConfig.environment,
      requestId: request.requestId
    },
    message: "ระบบพร้อมใช้งาน"
  };
}
