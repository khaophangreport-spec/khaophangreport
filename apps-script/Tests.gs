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
