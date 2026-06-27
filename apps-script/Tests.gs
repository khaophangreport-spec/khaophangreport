function testValidateSeedData() {
  const result = validateSeedData();

  if (!result || result.ok !== true) {
    throw new Error("validateSeedData did not return ok=true");
  }

  console.log(JSON.stringify(result));
  return result;
}

function testSeedSettings() {
  const result = seedSettings();

  if (!result || result.missingAfterSeed.length > 0) {
    throw new Error("seedSettings still has missing keys: " + (result ? result.missingAfterSeed.join(", ") : "unknown"));
  }

  console.log(JSON.stringify(result));
  return result;
}

function testFindFirstEmptyDataRow() {
  const spreadsheet = SheetRepository_getSpreadsheet_();
  const categoriesRow = findFirstEmptyDataRow_(spreadsheet.getSheetByName("categories"), "code");
  const settingsRow = findFirstEmptyDataRow_(spreadsheet.getSheetByName("settings"), "key");

  if (categoriesRow < 2 || settingsRow < 2) {
    throw new Error("findFirstEmptyDataRow_ returned invalid row");
  }

  const result = {
    ok: true,
    categoriesNextRow: categoriesRow,
    settingsNextRow: settingsRow
  };

  console.log(JSON.stringify(result));
  return result;
}

function testRepairSeedRowPlacement() {
  const repairResult = repairSeedRowPlacement();
  const validationResult = validatePhysicalSeedPlacement();

  const result = {
    ok: true,
    repair: repairResult,
    validation: validationResult
  };

  console.log(JSON.stringify(result));
  return result;
}

function testValidatePhysicalSeedPlacement() {
  const result = validatePhysicalSeedPlacement();

  if (!result || result.ok !== true) {
    throw new Error("validatePhysicalSeedPlacement did not return ok=true");
  }

  console.log(JSON.stringify(result));
  return result;
}

function testUtilsToBoolean() {
  const cases = [
    { input: true, expected: true, label: "true" },
    { input: false, expected: false, label: "false" },
    { input: "TRUE", expected: true, label: "TRUE" },
    { input: "FALSE", expected: false, label: "FALSE" },
    { input: 1, expected: true, label: "1" },
    { input: 0, expected: false, label: "0" },
    { input: "", expected: false, label: "empty string" },
    { input: null, expected: false, label: "null" }
  ];

  cases.forEach(function (testCase) {
    const actual = Utils_toBoolean_(testCase.input);

    if (actual !== testCase.expected) {
      throw new Error(
        "Utils_toBoolean_ failed for " + testCase.label +
        ". Expected: " + testCase.expected +
        ". Actual: " + actual
      );
    }
  });

  console.log("testUtilsToBoolean passed: " + cases.length + " cases");
  return {
    ok: true,
    cases: cases.length
  };
}

function testPublicConfigApi() {
  const result = SettingsService_getPublicConfig({
    action: "public.config",
    requestId: Utils_createRequestId_(),
    data: {}
  });

  if (!result || !result.data || !result.data.appName || !result.data.appNameTh) {
    throw new Error("public.config did not return expected public fields");
  }

  if (result.data.spreadsheetId || result.data.rootFolderId || result.data.sessionSecret || result.data.appSecret) {
    throw new Error("public.config returned sensitive data");
  }

  console.log(JSON.stringify(result));
  return result;
}

function testCategoryListApi() {
  const result = CategoryService_listPublic({
    action: "category.list",
    requestId: Utils_createRequestId_(),
    data: {}
  });

  if (!result || !result.data || !Array.isArray(result.data.items)) {
    throw new Error("category.list did not return items");
  }

  result.data.items.forEach(function (item) {
    if (item.default_assignee !== undefined || item.defaultAssignee !== undefined) {
      throw new Error("category.list returned default assignee");
    }
  });

  console.log(JSON.stringify(result));
  return result;
}

function testAnnouncementListApi() {
  const result = AnnouncementService_listPublic({
    action: "announcement.list",
    requestId: Utils_createRequestId_(),
    data: {
      limit: 5
    }
  });

  if (!result || !result.data || !Array.isArray(result.data.items)) {
    throw new Error("announcement.list did not return items");
  }

  if (result.data.items.length > 5) {
    throw new Error("announcement.list returned more than requested limit");
  }

  console.log(JSON.stringify(result));
  return result;
}

function testAnnouncementListPublic() {
  const result = AnnouncementService_listPublic({
    action: "announcement.list",
    requestId: "REQ-TEST-ANNOUNCEMENT-PUBLIC",
    data: {
      limit: 5
    }
  });

  if (!result || !result.data || !Array.isArray(result.data.items)) {
    throw new Error("AnnouncementService_listPublic did not return data.items array");
  }

  if (result.data.items.length > 5) {
    throw new Error("AnnouncementService_listPublic returned more than requested limit");
  }

  Tests_assertAnnouncementPublicProjection_(result.data.items);

  console.log(JSON.stringify({
    ok: true,
    count: result.data.items.length
  }));
  return result;
}

function testRouterAnnouncementList() {
  if (ROUTER_ACTIONS_["announcement.list"] !== AnnouncementService_listPublic) {
    throw new Error("announcement.list is not registered to AnnouncementService_listPublic");
  }

  const response = Router_dispatch_({
    action: "announcement.list",
    requestId: "REQ-TEST-ANNOUNCEMENT-ROUTER",
    sessionToken: "",
    data: {
      limit: 5
    }
  }, {
    method: "POST",
    contentType: "text/plain;charset=utf-8"
  });
  const payload = JSON.parse(response.getContent());

  if (!payload.ok || !payload.data || !Array.isArray(payload.data.items)) {
    throw new Error("Router announcement.list did not return ok data.items array");
  }

  if (payload.data.items.length > 5) {
    throw new Error("Router announcement.list returned more than requested limit");
  }

  Tests_assertAnnouncementPublicProjection_(payload.data.items);

  console.log(JSON.stringify({
    ok: true,
    count: payload.data.items.length
  }));
  return payload;
}

function Tests_assertAnnouncementPublicProjection_(items) {
  const forbiddenKeys = [
    "created_by",
    "createdBy",
    "updated_by",
    "updatedBy",
    "updated_at",
    "updatedAt",
    "is_active",
    "isActive",
    "is_deleted",
    "isDeleted",
    "sort_order",
    "sortOrder",
    "version",
    "secret",
    "password",
    "token"
  ];

  (items || []).forEach(function (item) {
    const serialized = JSON.stringify(item);

    forbiddenKeys.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(item, key) || serialized.indexOf("\"" + key + "\"") !== -1) {
        throw new Error("announcement.list leaked internal field: " + key);
      }
    });
  });
}

function testPublicReadApiRouter() {
  const actions = [
    "public.config",
    "category.list",
    "announcement.list"
  ];
  const results = {};

  actions.forEach(function (action) {
    const response = Router_dispatch_({
      action: action,
      requestId: Utils_createRequestId_(),
      sessionToken: "",
      data: action === "announcement.list" ? { limit: 3 } : {}
    });
    const payload = JSON.parse(response.getContent());

    if (!payload.ok || !payload.data) {
      throw new Error(action + " did not return ok response");
    }

    results[action] = payload.data;
  });

  console.log(JSON.stringify(results));
  return {
    ok: true,
    actions: actions
  };
}

function testGetHealthCheckRouter() {
  const response = Router_handleGet_({
    parameter: {
      action: "health.check",
      requestId: "REQ-TEST-GET-HEALTH"
    }
  });
  const payload = JSON.parse(response.getContent());

  if (!payload.ok || !payload.data || payload.data.status !== "ok") {
    throw new Error("GET health.check did not return ok status");
  }

  console.log(JSON.stringify(payload));
  return payload;
}

function testGetCategoryListRouter() {
  const response = Router_handleGet_({
    parameter: {
      action: "category.list",
      requestId: "REQ-TEST-GET-CATEGORY"
    }
  });
  const payload = JSON.parse(response.getContent());

  if (!payload.ok || !payload.data || !Array.isArray(payload.data.items)) {
    throw new Error("GET category.list did not return items");
  }

  console.log(JSON.stringify({
    ok: payload.ok,
    count: payload.data.items.length
  }));
  return payload;
}

function testPostTextPlainRouter() {
  const response = Router_handlePost_({
    postData: {
      type: "text/plain;charset=utf-8",
      contents: JSON.stringify({
        action: "health.check",
        requestId: "REQ-TEST-POST-TEXT",
        sessionToken: "",
        data: {}
      })
    }
  });
  const payload = JSON.parse(response.getContent());

  if (!payload.ok || !payload.data || payload.data.status !== "ok") {
    throw new Error("POST text/plain health.check did not return ok status");
  }

  console.log(JSON.stringify(payload));
  return payload;
}

function testRouterJsonParseFailure() {
  const response = Router_handlePost_({
    postData: {
      type: "text/plain;charset=utf-8",
      contents: "{invalid-json"
    }
  });
  const payload = JSON.parse(response.getContent());

  if (payload.ok !== false || !payload.error || payload.error.code !== "VALIDATION_ERROR") {
    throw new Error("Invalid JSON did not return VALIDATION_ERROR");
  }

  console.log(JSON.stringify(payload));
  return payload;
}

function testRouterMissingAction() {
  const response = Router_handleGet_({
    parameter: {
      requestId: "REQ-TEST-MISSING-ACTION"
    }
  });
  const payload = JSON.parse(response.getContent());

  if (payload.ok !== false || !payload.error || payload.error.code !== "VALIDATION_ERROR") {
    throw new Error("Missing action did not return VALIDATION_ERROR");
  }

  console.log(JSON.stringify(payload));
  return payload;
}

function testReportCreateRouterWhitelist() {
  if (ROUTER_ACTIONS_["report.create"] !== ReportService_create) {
    throw new Error("report.create is not registered in Router whitelist");
  }

  console.log("report.create is registered in Router whitelist");
  return {
    ok: true,
    action: "report.create"
  };
}

function testReportCreateRequiresRequestId() {
  try {
    ReportService_create({
      action: "report.create",
      requestId: "",
      data: {}
    });
  } catch (error) {
    if (error && error.code === "VALIDATION_ERROR") {
      console.log("report.create rejected missing requestId");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("report.create did not reject missing requestId");
}

function testReportCreateValidationMissingConsent() {
  const fields = {};

  ReportService_validateConsent_({
    truthConfirmed: false,
    privacyAccepted: false,
    privacyVersion: ""
  }, {
    privacyVersion: "1.0"
  }, fields);

  if (!fields["consent.truthConfirmed"] || !fields["consent.privacyAccepted"] || !fields["consent.privacyVersion"]) {
    throw new Error("Report consent validation did not detect all missing consent fields");
  }

  console.log(JSON.stringify(fields));
  return {
    ok: true,
    fields: fields
  };
}

function testReportCreateAnonymousReporterSanitizesPii() {
  const reporter = ReportService_normalizeReporter_({
    isAnonymous: true,
    name: "สมชาย ใจดี",
    phone: "0812345678",
    email: "person@example.com",
    contactMethod: "phone"
  }, true, "phone");

  if (reporter.name || reporter.phone || reporter.email || reporter.contactMethod !== "none") {
    throw new Error("Anonymous reporter normalization kept PII");
  }

  console.log(JSON.stringify(reporter));
  return {
    ok: true,
    reporter: reporter
  };
}

function testReportCreateAttachmentValidationLimit() {
  const fields = {};

  AttachmentService_validateCreatePayload_([
    { fileName: "1.jpg", mimeType: "image/jpeg", base64: "x", fileSize: 10, width: 10, height: 10 },
    { fileName: "2.jpg", mimeType: "image/jpeg", base64: "x", fileSize: 10, width: 10, height: 10 },
    { fileName: "3.jpg", mimeType: "image/jpeg", base64: "x", fileSize: 10, width: 10, height: 10 },
    { fileName: "4.jpg", mimeType: "image/jpeg", base64: "x", fileSize: 10, width: 10, height: 10 }
  ], fields, {
    maxImages: 3,
    maxImageSizeMb: 1,
    maxImageDimension: 1600
  });

  if (!fields.attachments) {
    throw new Error("Attachment validation did not reject more than 3 images");
  }

  console.log(JSON.stringify(fields));
  return {
    ok: true,
    fields: fields
  };
}

function testReportCreateMimeDetection() {
  const jpeg = AttachmentService_detectMimeType_([0xFF, 0xD8, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = AttachmentService_detectMimeType_([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]);
  const webp = AttachmentService_detectMimeType_([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

  if (jpeg !== "image/jpeg" || png !== "image/png" || webp !== "image/webp") {
    throw new Error("MIME detection failed");
  }

  console.log(JSON.stringify({
    jpeg: jpeg,
    png: png,
    webp: webp
  }));
  return {
    ok: true,
    mimeTypes: [jpeg, png, webp]
  };
}

function testReportCreateRateLimitKeyNoRawPii() {
  const rateKey = ReportService_buildRateLimitKey_({
    data: {
      categoryId: "CAT-001",
      title: "ไฟดับหน้าบ้าน",
      location: {
        name: "หน้าบ้าน"
      },
      reporter: {
        phone: "0812345678",
        email: "person@example.com"
      }
    }
  });

  if (rateKey.indexOf("0812345678") !== -1 || rateKey.indexOf("person@example.com") !== -1 || rateKey.indexOf("ไฟดับ") !== -1) {
    throw new Error("Rate limit key contains raw user data");
  }

  if (rateKey.indexOf("rl_") !== 0) {
    throw new Error("Rate limit key does not use expected prefix");
  }

  console.log(rateKey);
  return {
    ok: true,
    rateKey: rateKey
  };
}

function testReportTrackRouterWhitelist() {
  if (ROUTER_ACTIONS_["report.track"] !== ReportService_track) {
    throw new Error("report.track is not registered in Router whitelist");
  }

  console.log("report.track is registered in Router whitelist");
  return {
    ok: true,
    action: "report.track"
  };
}

function testReportTrackNormalizeTrackingCode() {
  const normalized = ReportService_normalizeTrackingCode_(" kpr - 260626 - a7f4 ");

  if (normalized !== "KPR-260626-A7F4") {
    throw new Error("Tracking code normalization failed: " + normalized);
  }

  if (!ReportService_isTrackingCodeFormatValid_(normalized)) {
    throw new Error("Normalized tracking code did not pass format validation");
  }

  console.log(normalized);
  return {
    ok: true,
    trackingCode: normalized
  };
}

function testReportTrackNotFoundGeneric() {
  try {
    ReportService_track({
      action: "report.track",
      requestId: "REQ-TEST-TRACK-NOT-FOUND",
      data: {
        trackingCode: "invalid"
      }
    });
  } catch (error) {
    if (error && error.code === "NOT_FOUND") {
      console.log("report.track returned generic not found for invalid code");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("report.track did not reject invalid tracking code");
}

function testReportTrackPublicProjectionNoLeak() {
  const publicData = ReportService_projectPublicTrack_({
    report_id: "REPORT-SECRET",
    tracking_code: "KPR-260626-A7F4",
    request_id: "REQ-SECRET",
    category_id: "CAT-001",
    title: "Public title",
    incident_date: "2026-06-25",
    created_at: "2026-06-26T00:00:00.000Z",
    status: "new",
    priority: "normal",
    assigned_to: "USER-SECRET",
    public_result: "Public result",
    internal_summary: "Internal summary",
    reporter_name: "Private Name",
    reporter_phone: "0812345678",
    reporter_email: "person@example.com",
    version: 9
  }, {
    categoryId: "CAT-001",
    name: "Road",
    icon: "road",
    color: "#287444",
    default_assignee: "USER-SECRET"
  }, [{
    updateId: "UPD-001",
    type: "status",
    status: "new",
    message: "Public timeline",
    createdAt: "2026-06-26T00:00:00.000Z",
    internal_note: "Internal note",
    updated_by: "USER-SECRET",
    attachments: []
  }], [{
    attachmentId: "ATT-001",
    updateId: "UPD-001",
    fileName: "photo.jpg",
    mimeType: "image/jpeg",
    fileSize: 100,
    width: 10,
    height: 10,
    fileRole: "report",
    createdAt: "2026-06-26T00:00:00.000Z",
    file_id: "DRIVE-SECRET"
  }]);

  const serialized = JSON.stringify(publicData);
  const forbiddenValues = [
    "REPORT-SECRET",
    "REQ-SECRET",
    "USER-SECRET",
    "Internal summary",
    "Internal note",
    "Private Name",
    "0812345678",
    "person@example.com",
    "DRIVE-SECRET"
  ];
  const forbiddenKeys = [
    "report_id",
    "reportId",
    "request_id",
    "requestId",
    "reporter_name",
    "reporterName",
    "reporter_phone",
    "reporterPhone",
    "reporter_email",
    "reporterEmail",
    "internal_summary",
    "internalSummary",
    "internal_note",
    "internalNote",
    "assigned_to",
    "assignedTo",
    "default_assignee",
    "defaultAssignee",
    "file_id",
    "fileId"
  ];

  forbiddenValues.concat(forbiddenKeys).forEach(function (forbidden) {
    if (serialized.indexOf(forbidden) !== -1) {
      throw new Error("report.track public projection leaked: " + forbidden);
    }
  });

  if (publicData.trackingCode !== "KPR-260626-A7F4" || publicData.category.categoryId !== "CAT-001") {
    throw new Error("report.track public projection missed required public fields");
  }

  console.log(JSON.stringify(publicData));
  return {
    ok: true,
    projection: publicData
  };
}

function testReportTrackRateLimitKeyNoRawTrackingCode() {
  const rateKey = ReportService_buildTrackRateLimitKey_("KPR-260626-A7F4");

  if (rateKey.indexOf("KPR-260626-A7F4") !== -1) {
    throw new Error("report.track rate limit key contains raw tracking code");
  }

  if (rateKey.indexOf("rl_track_") !== 0) {
    throw new Error("report.track rate limit key does not use expected prefix");
  }

  console.log(rateKey);
  return {
    ok: true,
    rateKey: rateKey
  };
}

function testReportAddInfoRouterWhitelist() {
  if (ROUTER_ACTIONS_["report.addInfo"] !== ReportService_addInfo) {
    throw new Error("report.addInfo is not registered in Router whitelist");
  }

  console.log("report.addInfo is registered in Router whitelist");
  return {
    ok: true,
    action: "report.addInfo"
  };
}

function testReportAddInfoRequiresRequestId() {
  try {
    ReportService_addInfo({
      action: "report.addInfo",
      requestId: "",
      data: {}
    });
  } catch (error) {
    if (error && error.code === "VALIDATION_ERROR") {
      console.log("report.addInfo rejected missing requestId");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("report.addInfo did not reject missing requestId");
}

function testReportAddInfoClosedPolicy() {
  try {
    ReportService_assertAddInfoAllowed_({
      status: "closed"
    });
  } catch (error) {
    if (error && error.code === "REPORT_CLOSED") {
      console.log("report.addInfo rejected closed report");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("report.addInfo did not reject closed report");
}

function testReportAddInfoBuildRecordPending() {
  const record = ReportService_buildAdditionalInfoRecord_({
    report: {
      report_id: "REPORT-001"
    },
    message: "ข้อมูลเพิ่มเติม",
    contact: {
      name: "ผู้แจ้ง",
      phone: "0812345678"
    }
  }, {
    additionalInfoId: "INFO-001",
    requestId: "REQ-ADD-INFO",
    createdAt: "2026-06-27T00:00:00.000Z"
  });

  if (record.review_status !== "pending" || record.is_public !== false || record.request_id !== "REQ-ADD-INFO") {
    throw new Error("report.addInfo record did not use pending/private defaults");
  }

  console.log(JSON.stringify(record));
  return {
    ok: true,
    record: record
  };
}

function testReportAddInfoRateLimitKeyNoRawData() {
  const rateKey = ReportService_buildAddInfoRateLimitKey_({
    data: {
      trackingCode: "KPR-260626-A7F4",
      message: "ยังมีปัญหาเดิมอยู่หน้าบ้าน",
      contact: {
        phone: "0812345678"
      }
    }
  });

  if (rateKey.indexOf("KPR-260626-A7F4") !== -1 || rateKey.indexOf("0812345678") !== -1 || rateKey.indexOf("หน้าบ้าน") !== -1) {
    throw new Error("report.addInfo rate limit key contains raw data");
  }

  if (rateKey.indexOf("rl_add_info_") !== 0) {
    throw new Error("report.addInfo rate limit key does not use expected prefix");
  }

  console.log(rateKey);
  return {
    ok: true,
    rateKey: rateKey
  };
}

function testAuthRouterWhitelist() {
  const expected = {
    "auth.login": AuthService_login,
    "auth.me": AuthService_me,
    "auth.logout": AuthService_logout,
    "auth.changePassword": AuthService_changePassword
  };

  Object.keys(expected).forEach(function (action) {
    if (ROUTER_ACTIONS_[action] !== expected[action]) {
      throw new Error(action + " is not registered in Router whitelist");
    }
  });

  console.log("auth actions are registered in Router whitelist");
  return {
    ok: true,
    actions: Object.keys(expected)
  };
}

function testAuthPasswordHashNoPlainText() {
  const password = "StrongPass123";
  const salt = Security_generateSalt_();
  const hash = Security_hashPassword_(password, salt);

  if (!hash || hash === password || hash.indexOf(password) !== -1 || hash === salt) {
    throw new Error("Password hash contains plain password or salt");
  }

  if (!Security_constantTimeEquals_(hash, Security_hashPassword_(password, salt))) {
    throw new Error("Password hash verification helper is inconsistent");
  }

  console.log(JSON.stringify({
    ok: true,
    hashLength: hash.length
  }));
  return {
    ok: true,
    hashLength: hash.length
  };
}

function testAuthSessionTokenHashNoRawToken() {
  const token = Security_generateSessionToken_();
  const tokenHash = Security_hashSessionToken_(token);

  if (!token || !tokenHash || tokenHash === token || tokenHash.indexOf(token) !== -1) {
    throw new Error("Session token hash contains raw token");
  }

  console.log(JSON.stringify({
    ok: true,
    tokenHashLength: tokenHash.length
  }));
  return {
    ok: true,
    tokenHashLength: tokenHash.length
  };
}

function testAuthUserProjectionNoSecrets() {
  const user = {
    user_id: "USER-001",
    username: "admin",
    password_hash: "HASH-SECRET",
    password_salt: "SALT-SECRET",
    display_name: "Admin",
    email: "admin@example.com",
    phone: "0812345678",
    role: "admin",
    must_change_password: true
  };
  const projection = UserService_projectMe_(user);
  const serialized = JSON.stringify(projection);

  ["password_hash", "passwordHash", "password_salt", "passwordSalt", "HASH-SECRET", "SALT-SECRET"].forEach(function (forbidden) {
    if (serialized.indexOf(forbidden) !== -1) {
      throw new Error("Auth user projection leaked secret: " + forbidden);
    }
  });

  if (!projection.userId || !projection.permissions || projection.permissions.length < 1) {
    throw new Error("Auth user projection missed public auth fields");
  }

  console.log(JSON.stringify(projection));
  return {
    ok: true,
    projection: projection
  };
}

function testAuthWeakPasswordValidation() {
  const fields = {};

  UserService_validatePassword_("12345678", "password", fields);

  if (!fields.password) {
    throw new Error("Weak password validation did not reject weak value");
  }

  console.log(JSON.stringify(fields));
  return {
    ok: true,
    fields: fields
  };
}

function testAuthLoginGenericError() {
  const testUsername = "missing-user-" + Utils_createUuid_();

  try {
    AuthService_login({
      action: "auth.login",
      requestId: "REQ-TEST-AUTH-LOGIN",
      data: {
        username: testUsername,
        password: "StrongPass123",
        deviceKey: "test-device"
      }
    });
  } catch (error) {
    if (error && error.code === "INVALID_CREDENTIALS" && error.message === AUTH_GENERIC_LOGIN_MESSAGE_) {
      console.log("auth.login returned generic error");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("auth.login did not reject missing user");
}

function testFirstAdminSetupKeyRequired() {
  try {
    Setup_validateFirstAdminSetupKey_("wrong-key");
  } catch (error) {
    if (error && (error.code === "FORBIDDEN" || error.code === "SETUP_KEY_MISSING")) {
      console.log("first admin setup key validation rejected invalid key");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("Setup_validateFirstAdminSetupKey_ did not reject invalid key");
}

function testDashboardSummaryRouterWhitelist() {
  if (ROUTER_ACTIONS_["dashboard.summary"] !== DashboardService_summary) {
    throw new Error("dashboard.summary is not registered in Router whitelist");
  }

  console.log("dashboard.summary is registered in Router whitelist");
  return {
    ok: true,
    action: "dashboard.summary"
  };
}

function testDashboardSummaryOfficerDefaultMine() {
  const scope = DashboardService_resolveScope_({}, {
    user_id: "USER-OFFICER",
    role: "officer"
  }, UserService_getPermissions_("officer"));

  if (scope !== "mine") {
    throw new Error("Officer default dashboard scope should be mine");
  }

  console.log(scope);
  return {
    ok: true,
    scope: scope
  };
}

function testDashboardSummaryOfficerCannotGlobal() {
  try {
    DashboardService_resolveScope_({
      scope: "global"
    }, {
      user_id: "USER-OFFICER",
      role: "officer"
    }, UserService_getPermissions_("officer"));
  } catch (error) {
    if (error && error.code === "FORBIDDEN") {
      console.log("Officer global dashboard scope rejected");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("Officer global dashboard scope was not rejected");
}

function testDashboardSummaryBuildNoPii() {
  const summary = DashboardService_buildSummary_([
    {
      report_id: "REPORT-SECRET",
      request_id: "REQ-SECRET",
      category_id: "CAT-ROAD",
      status: "new",
      assigned_to: "USER-SECRET",
      target_due_at: "2026-06-20T00:00:00.000Z",
      created_at: "2026-06-01T00:00:00.000Z",
      year_month: "2026-06",
      village_no: "1",
      village_key: "1",
      title: "Private title",
      reporter_name: "Private Name",
      reporter_phone: "0812345678",
      reporter_email: "person@example.com"
    },
    {
      report_id: "REPORT-CLOSED",
      category_id: "CAT-ROAD",
      status: "closed",
      assigned_to: "USER-SECRET",
      target_due_at: "2026-06-05T00:00:00.000Z",
      created_at: "2026-06-01T00:00:00.000Z",
      closed_at: "2026-06-03T00:00:00.000Z",
      year_month: "2026-06",
      village_no: "2",
      village_key: "2"
    }
  ], [{
    category_id: "CAT-ROAD",
    code: "road",
    name: "Road",
    icon: "road",
    color: "#287444",
    sort_order: 1,
    is_active: true
  }], {
    scope: "global"
  }, new Date("2026-06-27T00:00:00.000Z"));

  const serialized = JSON.stringify(summary);
  const forbidden = [
    "REPORT-SECRET",
    "REQ-SECRET",
    "USER-SECRET",
    "Private title",
    "Private Name",
    "0812345678",
    "person@example.com",
    "report_id",
    "request_id",
    "assigned_to",
    "reporter_name",
    "reporter_phone",
    "reporter_email"
  ];

  forbidden.forEach(function (value) {
    if (serialized.indexOf(value) !== -1) {
      throw new Error("dashboard.summary leaked private data: " + value);
    }
  });

  if (summary.cards.total !== 2 || summary.cards.overdue !== 1 || summary.byCategory[0].categoryId !== "CAT-ROAD") {
    throw new Error("dashboard.summary build returned invalid aggregates");
  }

  console.log(JSON.stringify(summary));
  return {
    ok: true,
    summary: summary
  };
}

function testDashboardSummaryCacheClearVersion() {
  const beforeVersion = DashboardService_getCacheVersion_();
  const result = DashboardService_clearCache_();
  const afterVersion = DashboardService_getCacheVersion_();

  if (!result.ok || beforeVersion === afterVersion) {
    throw new Error("Dashboard cache version did not change");
  }

  console.log(JSON.stringify({
    beforeVersion: beforeVersion,
    afterVersion: afterVersion
  }));
  return {
    ok: true,
    beforeVersion: beforeVersion,
    afterVersion: afterVersion
  };
}

function testAdminReportListRouterWhitelist() {
  if (ROUTER_ACTIONS_["admin.report.list"] !== ReportService_listAdmin) {
    throw new Error("admin.report.list is not registered in Router whitelist");
  }

  console.log("admin.report.list is registered in Router whitelist");
  return {
    ok: true,
    action: "admin.report.list"
  };
}

function testAdminReportListOfficerScope() {
  const query = ReportService_normalizeAdminListQuery_({
    scope: "global"
  }, {
    user: {
      user_id: "USER-OFFICER",
      role: "officer"
    },
    permissions: UserService_getPermissions_("officer")
  });
  const filtered = ReportService_filterAdminReports_([
    {
      report_id: "REPORT-MINE",
      assigned_to: "USER-OFFICER",
      status: "new",
      created_at: "2026-06-26T00:00:00.000Z"
    },
    {
      report_id: "REPORT-OTHER",
      assigned_to: "USER-OTHER",
      status: "new",
      created_at: "2026-06-26T00:00:00.000Z"
    }
  ], query, {
    user: {
      user_id: "USER-OFFICER"
    }
  });

  if (query.scope !== "mine" || filtered.length !== 1 || filtered[0].report_id !== "REPORT-MINE") {
    throw new Error("Officer admin.report.list scope did not default/enforce mine");
  }

  console.log(JSON.stringify({
    scope: query.scope,
    count: filtered.length
  }));
  return {
    ok: true,
    scope: query.scope,
    count: filtered.length
  };
}

function testAdminReportListFiltersSortPagination() {
  const query = ReportService_normalizeAdminListQuery_({
    page: 1,
    pageSize: 1,
    keyword: "ไฟดับ",
    status: "new",
    categoryId: "CAT-ELECTRIC",
    priority: "critical",
    assigneeId: "USER-001",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
    scope: "global",
    sortBy: "priority",
    sortDirection: "desc"
  }, {
    user: {
      user_id: "USER-ADMIN",
      role: "admin"
    },
    permissions: UserService_getPermissions_("admin")
  });
  const filtered = ReportService_filterAdminReports_([
    {
      report_id: "REPORT-001",
      tracking_code: "KPR-260626-A001",
      category_id: "CAT-ELECTRIC",
      title: "ไฟดับหน้าบ้าน",
      search_text: "ไฟดับหน้าบ้าน",
      priority: "critical",
      status: "new",
      assigned_to: "USER-001",
      created_at: "2026-06-20T00:00:00.000Z"
    },
    {
      report_id: "REPORT-002",
      tracking_code: "KPR-260626-A002",
      category_id: "CAT-ROAD",
      title: "ถนนชำรุด",
      search_text: "ถนนชำรุด",
      priority: "normal",
      status: "closed",
      assigned_to: "USER-002",
      created_at: "2026-06-21T00:00:00.000Z"
    }
  ], query, {
    user: {
      user_id: "USER-ADMIN"
    }
  });
  const sorted = ReportService_sortAdminReports_(filtered, query.sortBy, query.sortDirection);
  const page = SheetRepository_paginate_(sorted, query.page, query.pageSize);

  if (filtered.length !== 1 || page.pagination.pageSize !== 1 || page.items[0].report_id !== "REPORT-001") {
    throw new Error("admin.report.list filters/sort/pagination returned invalid result");
  }

  console.log(JSON.stringify({
    total: page.pagination.total,
    pageSize: page.pagination.pageSize
  }));
  return {
    ok: true,
    pagination: page.pagination
  };
}

function testAdminReportListProjectionNoPii() {
  const projection = ReportService_projectAdminListReport_({
    report_id: "REPORT-001",
    tracking_code: "KPR-260626-A001",
    request_id: "REQ-SECRET",
    category_id: "CAT-ROAD",
    title: "หัวข้อสาธารณะในรายการ",
    description: "รายละเอียดที่อาจมีข้อมูลส่วนตัว",
    location_name: "หน้าศาลา",
    village_no: "3",
    reporter_name: "Private Name",
    reporter_phone: "0812345678",
    reporter_email: "person@example.com",
    internal_summary: "Internal only",
    priority_reported: "normal",
    priority: "high",
    status: "new",
    assigned_to: "USER-001",
    target_due_at: "2026-06-26T00:00:00.000Z",
    created_at: "2026-06-25T00:00:00.000Z",
    updated_at: "2026-06-25T00:00:00.000Z",
    version: 7
  }, {
    "CAT-ROAD": {
      categoryId: "CAT-ROAD",
      code: "road",
      name: "ถนน",
      icon: "road",
      color: "#287444"
    }
  }, {
    "USER-001": {
      userId: "USER-001",
      displayName: "เจ้าหน้าที่",
      role: "officer",
      isActive: true
    }
  }, new Date("2026-06-27T00:00:00.000Z"));

  const serialized = JSON.stringify(projection);
  const forbidden = [
    "REQ-SECRET",
    "Private Name",
    "0812345678",
    "person@example.com",
    "Internal only",
    "รายละเอียดที่อาจมีข้อมูลส่วนตัว",
    "request_id",
    "reporter_name",
    "reporter_phone",
    "reporter_email",
    "internal_summary",
    "description"
  ];

  forbidden.forEach(function (value) {
    if (serialized.indexOf(value) !== -1) {
      throw new Error("admin.report.list projection leaked PII/internal data: " + value);
    }
  });

  if (projection.version !== 7 || projection.isOverdue !== true || projection.ageHours !== 48) {
    throw new Error("admin.report.list projection missed version/overdue/age fields");
  }

  console.log(JSON.stringify(projection));
  return {
    ok: true,
    projection: projection
  };
}

function testAdminReportListViewerReadOnly() {
  const permissions = ReportService_buildAdminListPermissions_(UserService_getPermissions_("viewer"));

  if (!permissions.canRead || permissions.canUpdate || permissions.canAssign) {
    throw new Error("Viewer permissions should be read-only for admin.report.list");
  }

  console.log(JSON.stringify(permissions));
  return {
    ok: true,
    permissions: permissions
  };
}

function testAdminReportDetailRouterWhitelist() {
  if (ROUTER_ACTIONS_["admin.report.detail"] !== ReportService_detailAdmin) {
    throw new Error("admin.report.detail is not registered in Router whitelist");
  }

  console.log("admin.report.detail is registered in Router whitelist");
  return {
    ok: true,
    action: "admin.report.detail"
  };
}

function testAdminReportDetailOfficerScope() {
  try {
    ReportService_assertAdminReportAccess_({
      report_id: "REPORT-OTHER",
      assigned_to: "USER-OTHER"
    }, {
      user: {
        user_id: "USER-OFFICER",
        role: "officer"
      },
      permissions: UserService_getPermissions_("officer")
    });
  } catch (error) {
    if (error && error.code === "FORBIDDEN") {
      ReportService_assertAdminReportAccess_({
        report_id: "REPORT-MINE",
        assigned_to: "USER-OFFICER"
      }, {
        user: {
          user_id: "USER-OFFICER",
          role: "officer"
        },
        permissions: UserService_getPermissions_("officer")
      });

      console.log("admin.report.detail officer scope enforced");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("Officer was allowed to view another officer's report detail");
}

function testAdminReportDetailViewerProjectionMasksPii() {
  const projection = ReportService_projectAdminDetailReport_({
    report_id: "REPORT-001",
    tracking_code: "KPR-260626-A001",
    request_id: "REQ-SECRET",
    category_id: "CAT-ROAD",
    title: "Public title",
    description: "Public description",
    incident_date: "2026-06-25",
    location_name: "Public location",
    village_no: "3",
    landmark: "Public landmark",
    latitude: 8.1,
    longitude: 98.1,
    map_url: "https://maps.example.test",
    is_anonymous: false,
    reporter_name: "Private Name",
    reporter_phone: "0812345678",
    reporter_email: "person@example.com",
    contact_method: "phone",
    status: "new",
    priority_reported: "normal",
    priority: "high",
    assigned_to: "USER-001",
    public_result: "Public result",
    internal_summary: "Internal summary",
    rejection_reason: "Internal rejection",
    source: "web",
    created_at: "2026-06-26T00:00:00.000Z",
    updated_at: "2026-06-26T00:00:00.000Z",
    version: 4,
    password_hash: "PASSWORD-SECRET",
    token_hash: "TOKEN-SECRET"
  }, {
    "CAT-ROAD": {
      categoryId: "CAT-ROAD",
      code: "ROAD",
      name: "Road",
      icon: "road",
      color: "#287444"
    }
  }, {
    "USER-001": {
      userId: "USER-001",
      displayName: "Officer One",
      role: "officer",
      isActive: true
    }
  }, UserService_getPermissions_("viewer"));

  const serialized = JSON.stringify(projection);
  [
    "Private Name",
    "0812345678",
    "person@example.com",
    "Internal summary",
    "Internal rejection",
    "REQ-SECRET",
    "PASSWORD-SECRET",
    "TOKEN-SECRET",
    "password_hash",
    "token_hash",
    "request_id"
  ].forEach(function (forbidden) {
    if (serialized.indexOf(forbidden) !== -1) {
      throw new Error("admin.report.detail viewer projection leaked: " + forbidden);
    }
  });

  if (projection.reporter.phone !== "08X-XXX-5678" || projection.internalSummary !== "" || projection.version !== 4) {
    throw new Error("admin.report.detail viewer projection did not mask expected fields");
  }

  console.log(JSON.stringify(projection));
  return {
    ok: true,
    projection: projection
  };
}

function testAdminReportDetailAdminProjectionCanSeeInternal() {
  const projection = ReportService_projectAdminDetailReport_({
    report_id: "REPORT-001",
    tracking_code: "KPR-260626-A001",
    category_id: "CAT-ROAD",
    title: "Public title",
    description: "Public description",
    is_anonymous: false,
    reporter_name: "Private Name",
    reporter_phone: "0812345678",
    reporter_email: "person@example.com",
    contact_method: "phone",
    internal_summary: "Internal summary",
    status: "new",
    priority: "normal",
    version: 1
  }, {}, {}, UserService_getPermissions_("admin"));

  if (projection.reporter.name !== "Private Name" ||
      projection.reporter.phone !== "0812345678" ||
      projection.internalSummary !== "Internal summary") {
    throw new Error("admin.report.detail admin projection did not include permitted fields");
  }

  console.log(JSON.stringify(projection));
  return {
    ok: true,
    projection: projection
  };
}

function testAdminReportDetailAttachmentProjectionNoDriveLeak() {
  const projection = AttachmentService_projectAdmin_({
    attachment_id: "ATT-001",
    report_id: "REPORT-001",
    update_id: "UPD-001",
    additional_info_id: "",
    file_id: "DRIVE-SECRET",
    file_name: "photo.jpg",
    original_file_name: "original.jpg",
    mime_type: "image/jpeg",
    file_size: 100,
    width: 10,
    height: 10,
    file_role: "report",
    is_public: true,
    uploaded_by: "public",
    created_at: "2026-06-26T00:00:00.000Z",
    drive_folder_id: "FOLDER-SECRET",
    checksum: "CHECKSUM-SECRET",
    version: 2
  });
  const serialized = JSON.stringify(projection);

  ["DRIVE-SECRET", "FOLDER-SECRET", "CHECKSUM-SECRET", "file_id", "drive_folder_id", "checksum"].forEach(function (forbidden) {
    if (serialized.indexOf(forbidden) !== -1) {
      throw new Error("admin.report.detail attachment projection leaked: " + forbidden);
    }
  });

  console.log(JSON.stringify(projection));
  return {
    ok: true,
    projection: projection
  };
}

function testAdminReportAssignRouterWhitelist() {
  if (ROUTER_ACTIONS_["admin.report.assign"] !== AssignmentService_assign) {
    throw new Error("admin.report.assign is not registered in Router whitelist");
  }

  console.log("admin.report.assign is registered in Router whitelist");
  return {
    ok: true,
    action: "admin.report.assign"
  };
}

function testAdminReportAssignPayloadRequiresVersion() {
  try {
    AssignmentService_validateAssignPayload_({
      reportId: "REPORT-001",
      assigneeId: "USER-001"
    });
  } catch (error) {
    if (error && error.code === "VALIDATION_ERROR" && error.fields && error.fields.version) {
      console.log("admin.report.assign rejected missing version");
      return {
        ok: true,
        code: error.code
      };
    }

    throw error;
  }

  throw new Error("admin.report.assign did not reject missing version");
}

function testAdminReportAssignActiveOfficerOnly() {
  const officers = AssignmentService_filterAssignableOfficers_([{
    user_id: "OFFICER-ACTIVE",
    username: "officer.active",
    display_name: "Officer Active",
    role: "officer",
    status: "active",
    is_deleted: false
  }, {
    user_id: "OFFICER-INACTIVE",
    username: "officer.inactive",
    display_name: "Officer Inactive",
    role: "officer",
    status: "inactive",
    is_deleted: false
  }, {
    user_id: "ADMIN-ACTIVE",
    username: "admin.active",
    display_name: "Admin Active",
    role: "admin",
    status: "active",
    is_deleted: false
  }, {
    user_id: "OFFICER-DELETED",
    username: "officer.deleted",
    display_name: "Officer Deleted",
    role: "officer",
    status: "active",
    is_deleted: true
  }]);

  if (officers.length !== 1 || officers[0].userId !== "OFFICER-ACTIVE") {
    throw new Error("Assignable officers filter did not return active officers only");
  }

  console.log(JSON.stringify(officers));
  return {
    ok: true,
    officers: officers
  };
}

function testAdminReportAssignOpenAssignmentDetection() {
  const open = AssignmentService_isOpenAssignment_({
    report_id: "REPORT-001",
    assignment_status: "active",
    completed_at: "",
    unassigned_at: "",
    is_deleted: false
  });
  const reassigned = AssignmentService_isOpenAssignment_({
    report_id: "REPORT-001",
    assignment_status: "reassigned",
    completed_at: "",
    unassigned_at: "2026-06-26T00:00:00.000Z",
    is_deleted: false
  });

  if (!open || reassigned) {
    throw new Error("Open assignment detection failed");
  }

  return {
    ok: true,
    open: open,
    reassigned: reassigned
  };
}

function testAdminReportUpdateStatusRouterWhitelist() {
  if (ROUTER_ACTIONS_["admin.report.updateStatus"] !== ReportService_updateStatus) {
    throw new Error("admin.report.updateStatus is not registered in Router whitelist");
  }

  console.log("admin.report.updateStatus is registered in Router whitelist");
  return {
    ok: true,
    action: "admin.report.updateStatus"
  };
}

function testAdminReportUpdateStatusTransitionMatrix() {
  const officerPermissions = UserService_getPermissions_("officer");
  const adminPermissions = UserService_getPermissions_("admin");

  if (!ReportService_isStatusTransitionAllowed_("new", "reviewing", officerPermissions)) {
    throw new Error("Expected new -> reviewing to be allowed");
  }

  if (!ReportService_isStatusTransitionAllowed_("resolved", "in_progress", officerPermissions)) {
    throw new Error("Expected resolved -> in_progress reopen to be allowed");
  }

  if (ReportService_isStatusTransitionAllowed_("closed", "in_progress", adminPermissions)) {
    throw new Error("Expected closed -> in_progress to be blocked");
  }

  if (ReportService_isStatusTransitionAllowed_("rejected", "reviewing", officerPermissions)) {
    throw new Error("Expected officer rejected -> reviewing to be blocked");
  }

  if (!ReportService_isStatusTransitionAllowed_("rejected", "reviewing", adminPermissions)) {
    throw new Error("Expected admin rejected -> reviewing to be allowed");
  }

  return {
    ok: true,
    checked: 5
  };
}

function testAdminReportUpdateStatusRequiredFields() {
  const fields = {};

  ReportService_validateStatusRequiredFields_("assigned", {
    newStatus: "resolved",
    publicMessage: "",
    internalNote: "",
    result: "",
    rejectionReason: "",
    duplicateOfReportId: "",
    duplicateReason: "",
    reason: "",
    confirmed: false
  }, fields);

  ReportService_validateStatusRequiredFields_("in_progress", {
    newStatus: "waiting",
    publicMessage: "",
    internalNote: "",
    result: "",
    rejectionReason: "",
    duplicateOfReportId: "",
    duplicateReason: "",
    reason: "",
    confirmed: false
  }, fields);

  ReportService_validateStatusRequiredFields_("reviewing", {
    newStatus: "rejected",
    publicMessage: "",
    internalNote: "",
    result: "",
    rejectionReason: "",
    duplicateOfReportId: "",
    duplicateReason: "",
    reason: "",
    confirmed: false
  }, fields);

  ReportService_validateStatusRequiredFields_("new", {
    newStatus: "duplicate",
    publicMessage: "",
    internalNote: "",
    result: "",
    rejectionReason: "",
    duplicateOfReportId: "",
    duplicateReason: "",
    reason: "",
    confirmed: false
  }, fields);

  ReportService_validateStatusRequiredFields_("resolved", {
    newStatus: "in_progress",
    publicMessage: "",
    internalNote: "",
    result: "",
    rejectionReason: "",
    duplicateOfReportId: "",
    duplicateReason: "",
    reason: "",
    confirmed: false
  }, fields);

  if (!fields.result || !fields.publicMessage || !fields.rejectionReason || !fields.duplicate || !fields.reason || !fields.confirmed) {
    throw new Error("admin.report.updateStatus required fields were not detected");
  }

  console.log(JSON.stringify(fields));
  return {
    ok: true,
    fields: fields
  };
}

function testAdminReportUpdateStatusBuildUpdates() {
  const updates = ReportService_buildStatusUpdateFields_({
    report_id: "REPORT-001",
    status: "assigned",
    version: 3
  }, {
    newStatus: "resolved",
    result: "ดำเนินการซ่อมแซมเรียบร้อย",
    publicMessage: "",
    internalNote: "",
    rejectionReason: "",
    duplicateOfReportId: "",
    duplicateReason: "",
    reason: "",
    confirmed: false
  }, {
    user_id: "USER-001"
  }, "2026-06-26T00:00:00.000Z");

  if (updates.status !== "resolved" ||
      updates.public_result !== "ดำเนินการซ่อมแซมเรียบร้อย" ||
      updates.resolved_at !== "2026-06-26T00:00:00.000Z" ||
      updates.updated_by !== "USER-001") {
    throw new Error("admin.report.updateStatus build updates failed");
  }

  console.log(JSON.stringify(updates));
  return {
    ok: true,
    updates: updates
  };
}
