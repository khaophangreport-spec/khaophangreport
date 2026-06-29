const ROUTER_ACTIONS_ = Object.freeze({
  "health.check": Router_healthCheck_,
  "public.config": SettingsService_getPublicConfig,
  "admin.settings.get": SettingsService_getAdmin,
  "admin.settings.update": SettingsService_updateAdmin,
  "admin.activity.list": AuditService_listAdmin,
  "admin.export.csv": ExportService_exportCsvAdmin,
  "category.list": CategoryService_listPublic,
  "admin.category.list": CategoryService_listAdmin,
  "admin.category.save": CategoryService_saveAdmin,
  "announcement.list": AnnouncementService_listPublic,
  "admin.announcement.list": AnnouncementService_listAdmin,
  "admin.announcement.save": AnnouncementService_saveAdmin,
  "auth.login": AuthService_login,
  "auth.me": AuthService_me,
  "auth.logout": AuthService_logout,
  "auth.changePassword": AuthService_changePassword,
  "dashboard.summary": DashboardService_summary,
  "admin.report.list": ReportService_listAdmin,
  "admin.report.detail": ReportService_detailAdmin,
  "admin.report.assign": AssignmentService_assign,
  "admin.report.updateStatus": ReportService_updateStatus,
  "admin.report.updatePriority": ReportService_updatePriority,
  "admin.report.addUpdate": ReportService_addUpdate,
  "admin.user.list": UserService_listAdmin,
  "admin.user.save": UserService_saveAdmin,
  "admin.user.resetPassword": UserService_resetPasswordAdmin,
  "admin.user.revokeSessions": UserService_revokeSessionsAdmin,
  "report.create": ReportService_create,
  "report.track": ReportService_track,
  "report.addInfo": ReportService_addInfo
});

function Router_handleGet_(e) {
  const parameters = e && e.parameter ? e.parameter : {};
  const action = parameters.action || "";
  const requestId = parameters.requestId || Utils_createRequestId_();
  const dataResult = Router_parseGetData_(parameters);

  return Router_dispatch_({
    action: action,
    requestId: requestId,
    sessionToken: "",
    data: dataResult
  }, {
    method: "GET",
    contentType: ""
  });
}

function Router_handlePost_(e) {
  const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : "";
  const contentType = e && e.postData && e.postData.type ? e.postData.type : "";
  const parsed = Utils_safeJsonParse_(rawBody);

  if (!parsed.ok) {
    Router_logRequest_("error", {
      action: "",
      requestId: "",
      method: "POST",
      contentType: contentType,
      code: "VALIDATION_ERROR"
    });

    return Response_error_("VALIDATION_ERROR", "รูปแบบ JSON ไม่ถูกต้อง", {
      request: "กรุณาส่ง JSON ตามรูปแบบ API"
    }, {
      requestId: "",
      action: "",
      method: "POST",
      contentType: contentType
    });
  }

  return Router_dispatch_(parsed.data, {
    method: "POST",
    contentType: contentType
  });
}

function Router_dispatch_(payload, context) {
  const safeContext = Utils_isPlainObject_(context) ? context : {};
  const meta = {
    requestId: payload && payload.requestId ? String(payload.requestId) : "",
    action: payload && payload.action ? String(payload.action) : "",
    handler: "",
    method: safeContext.method || "",
    contentType: safeContext.contentType || ""
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
    meta.handler = Router_getHandlerName_(handler);

    const result = handler({
      action: action,
      requestId: meta.requestId,
      sessionToken: payload.sessionToken || "",
      data: payload.data || {}
    });

    Router_logRequest_("success", {
      action: meta.action,
      requestId: meta.requestId,
      method: meta.method,
      contentType: meta.contentType,
      code: ""
    });

    return Response_success_(result.data, result.message, meta);
  } catch (error) {
    meta.lastStep = error && error.dashboardLastStep ? error.dashboardLastStep : "";
    Response_logUnhandledBackendError_(error, meta);

    Router_logRequest_("error", {
      action: meta.action,
      requestId: meta.requestId,
      method: meta.method,
      contentType: meta.contentType,
      code: error && error.code ? error.code : "INTERNAL_ERROR"
    });

    return Response_fromException_(error, meta);
  }
}

function Router_parseGetData_(parameters) {
  const data = {};

  if (parameters && parameters.data) {
    const parsed = Utils_safeJsonParse_(parameters.data);

    if (parsed.ok && Utils_isPlainObject_(parsed.data)) {
      return parsed.data;
    }
  }

  Object.keys(parameters || {}).forEach(function (key) {
    if (key === "action" || key === "requestId" || key === "sessionToken" || key === "data") {
      return;
    }

    data[key] = parameters[key];
  });

  return data;
}

function Router_getHandlerName_(handler) {
  if (handler && handler.name) {
    return handler.name;
  }

  const source = handler ? String(handler) : "";
  const match = source.match(/function\s+([A-Za-z0-9_]+)/);

  return match && match[1] ? match[1] : "";
}

function Router_extractMetaFromEvent_(e, method) {
  const safeMethod = method || "";
  const meta = {
    requestId: "",
    action: "",
    handler: "",
    method: safeMethod,
    contentType: "",
    lastStep: "GLOBAL_" + safeMethod + "_CATCH"
  };

  if (safeMethod === "GET") {
    const parameters = e && e.parameter ? e.parameter : {};

    meta.requestId = parameters.requestId ? String(parameters.requestId) : "";
    meta.action = parameters.action ? String(parameters.action) : "";
    return meta;
  }

  meta.contentType = e && e.postData && e.postData.type ? String(e.postData.type) : "";

  try {
    const rawBody = e && e.postData && e.postData.contents ? String(e.postData.contents) : "";
    const parsed = rawBody ? JSON.parse(rawBody) : {};

    meta.requestId = parsed && parsed.requestId ? String(parsed.requestId) : "";
    meta.action = parsed && parsed.action ? String(parsed.action) : "";
  } catch (parseError) {
    meta.action = "";
  }

  return meta;
}

function Router_logRequest_(status, details) {
  Security_safeLog_("API_REQUEST", {
    action: details && details.action ? details.action : "",
    requestId: details && details.requestId ? details.requestId : "",
    method: details && details.method ? details.method : "",
    contentType: details && details.contentType ? details.contentType : "",
    status: status || "",
    code: details && details.code ? details.code : ""
  });
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
