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
