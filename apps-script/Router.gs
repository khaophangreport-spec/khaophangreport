var ACTIONS_ = Object.freeze({
  'health.check': handleHealthCheck_,
  'public.config': function (request) {
    return SettingsService.getPublicConfig(request);
  },
  'category.list': function (request) {
    return CategoryService.listPublic(request);
  },
  'announcement.list': function (request) {
    return AnnouncementService.listPublic(request);
  }
});

function routeRequest_(e, method) {
  var request = parseRequest_(e, method);
  var requestId = request.requestId || createRequestId_();

  try {
    var validationErrors = validateRequestEnvelope_(request);

    if (Object.keys(validationErrors).length > 0) {
      return createErrorResponse_('VALIDATION_ERROR', 'กรุณาตรวจสอบข้อมูล', requestId, validationErrors);
    }

    if (!ACTIONS_[request.action]) {
      return createErrorResponse_('NOT_FOUND', 'ไม่พบ Action ที่ร้องขอ', requestId);
    }

    return ACTIONS_[request.action](request);
  } catch (error) {
    safeLog_('router.error', {
      action: request.action || '',
      requestId: requestId,
      errorCode: error && error.code ? error.code : 'INTERNAL_ERROR',
      errorMessage: error && error.message ? error.message : 'Unknown error'
    });

    return createErrorResponse_(
      error && error.code ? error.code : 'INTERNAL_ERROR',
      error && error.publicMessage ? error.publicMessage : 'ระบบขัดข้อง กรุณาลองใหม่ภายหลัง',
      requestId,
      error && error.fields ? error.fields : {}
    );
  }
}

function parseRequest_(e, method) {
  if (method === 'GET') {
    return {
      action: e && e.parameter && e.parameter.action ? e.parameter.action : 'health.check',
      requestId: e && e.parameter && e.parameter.requestId ? e.parameter.requestId : createRequestId_(),
      sessionToken: '',
      data: {}
    };
  }

  var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '';
  var parsedBody = safeJsonParse_(rawBody, null);

  if (!parsedBody) {
    return {
      action: '',
      requestId: createRequestId_(),
      sessionToken: '',
      data: {}
    };
  }

  return {
    action: parsedBody.action || '',
    requestId: parsedBody.requestId || createRequestId_(),
    sessionToken: parsedBody.sessionToken || '',
    data: parsedBody.data || {}
  };
}

function handleHealthCheck_(request) {
  var healthConfig = getPublicHealthConfig_();

  return createSuccessResponse_({
    status: 'ok',
    apiVersion: healthConfig.apiVersion,
    environment: healthConfig.environment
  }, 'ระบบพร้อมใช้งาน', request.requestId);
}
