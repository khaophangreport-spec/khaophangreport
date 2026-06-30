const DASHBOARD_CACHE_TTL_SECONDS_ = 120;
const DASHBOARD_SUMMARY_SCHEMA_VERSION_ = "village-v2";
const DASHBOARD_CACHE_VERSION_KEY_ = "DASHBOARD_CACHE_VERSION";
const DASHBOARD_REPORT_COLUMNS_ = Object.freeze([
  "report_id",
  "category_id",
  "status",
  "assigned_to",
  "target_due_at",
  "resolved_at",
  "closed_at",
  "created_at",
  "year_month",
  "village_no",
  "village_key",
  "is_deleted"
]);
const DASHBOARD_CATEGORY_COLUMNS_ = Object.freeze([
  "category_id",
  "code",
  "name",
  "icon",
  "color",
  "is_active",
  "sort_order",
  "is_deleted"
]);
const DASHBOARD_STATUS_ORDER_ = Object.freeze([
  "new",
  "reviewing",
  "assigned",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
  "rejected",
  "duplicate"
]);
const DASHBOARD_VILLAGE_NUMBERS_ = Object.freeze(["1", "2", "3", "4", "5"]);

function DashboardService_summary(request) {
  const diagnostics = DashboardService_createDiagnostics_(request);

  try {
    diagnostics.log("AUTH_START", {});

    const context = DashboardService_requireContext_(request);

    diagnostics.log("AUTH_OK", {
      role: context.user && context.user.role ? context.user.role : "",
      scope: context.scope
    });

    return DashboardService_buildSummaryResponse_(context, diagnostics, {
      useCache: true,
      writeCache: true
    });
  } catch (error) {
    diagnostics.fail(error);
    throw error;
  }
}

function DashboardService_buildSummaryResponse_(context, diagnostics, options) {
  const safeOptions = options || {};
  const safeDiagnostics = diagnostics || DashboardService_createDiagnostics_({});
  const cacheKey = DashboardService_buildCacheKey_(context);

  safeDiagnostics.log("DASHBOARD_SERVICE_START", {
    scope: context.scope,
    cacheKeyLength: cacheKey.length
  });

  if (safeOptions.useCache !== false) {
    const cachedData = DashboardService_getCachedSummarySafe_(cacheKey, safeDiagnostics);

    if (cachedData) {
      safeDiagnostics.log("RESPONSE_BUILD_OK", {
        source: "cache",
        total: cachedData.cards && cachedData.cards.total ? cachedData.cards.total : 0
      });

      return {
        data: cachedData,
        message: "โหลดข้อมูล Dashboard สำเร็จ"
      };
    }
  }

  const reports = DashboardService_readReportSummaryRows_(context);

  safeDiagnostics.log("REPORT_SUMMARY_OK", {
    reportCount: reports.length,
    scope: context.scope
  });

  safeDiagnostics.log("MY_WORK_SUMMARY_OK", {
    reportCount: reports.length,
    scope: context.scope
  });

  safeDiagnostics.log("DASHBOARD_USERS_OK", {
    userCount: context && context.user ? 1 : 0
  });

  const categories = DashboardService_readCategorySummaryRows_();

  safeDiagnostics.log("DASHBOARD_STEP_07_CATEGORIES_OK", {
    categoryCount: categories.length
  });

  const data = DashboardService_buildSummary_(reports, categories, context, new Date());
  const serializationIssues = DashboardService_findSerializationIssues_(data);

  if (serializationIssues.length > 0) {
    throw ApiError_("INTERNAL_ERROR", "Dashboard response contains non-serializable values", {
      serializationIssues: serializationIssues.slice(0, 10)
    });
  }

  if (safeOptions.writeCache !== false) {
    DashboardService_putCachedSummarySafe_(cacheKey, data, safeDiagnostics);
  }

  safeDiagnostics.log("RESPONSE_BUILD_OK", {
    source: "fresh",
    total: data.cards.total,
    open: data.cards.open,
    resolved: data.cards.resolved
  });

  return {
    data: data,
    message: "โหลดข้อมูล Dashboard สำเร็จ"
  };
}

function runDiagnoseActualAdminDashboardForDevOnly() {
  DashboardService_assertDevelopmentOnly_();

  const user = DashboardService_findDiagnosticAdminUser_();
  const permissions = UserService_getPermissions_(user.role);
  const results = {};

  ["global", "mine"].forEach(function (scope) {
    const requestId = "REQ-DIAG-DASHBOARD-" + scope.toUpperCase();
    const diagnostics = DashboardService_createDiagnostics_({
      action: "dashboard.summary",
      requestId: requestId,
      data: {
        scope: scope
      }
    });

    try {
      diagnostics.log("AUTH_START", {
        diagnostic: true
      });
      DashboardService_assertPermission_(permissions, "report.read");

      const resolvedScope = DashboardService_resolveScope_({
        scope: scope
      }, user, permissions);
      const context = {
        user: user,
        permissions: permissions,
        scope: resolvedScope
      };
      const response = DashboardService_buildSummaryResponse_(context, diagnostics, {
        useCache: true,
        writeCache: false
      });

      results[scope] = {
        ok: true,
        requestId: requestId,
        scope: response.data.scope,
        total: response.data.cards.total,
        open: response.data.cards.open,
        resolved: response.data.cards.resolved,
        closed: response.data.cards.closed,
        overdue: response.data.cards.overdue,
        months: response.data.byMonth.map(function (item) {
          return item.yearMonth;
        }),
        statuses: response.data.byStatus.filter(function (item) {
          return item.total > 0;
        }),
        steps: diagnostics.steps
      };
    } catch (error) {
      diagnostics.fail(error);
      results[scope] = {
        ok: false,
        requestId: requestId,
        code: error && error.code ? error.code : "INTERNAL_ERROR",
        name: error && error.name ? error.name : "Error",
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : "",
        steps: diagnostics.steps
      };
    }
  });

  const result = {
    ok: results.global && results.global.ok === true && results.mine && results.mine.ok === true,
    readOnly: true,
    diagnosticType: "actual-dashboard-flow",
    user: {
      userId: user.user_id,
      role: user.role
    },
    results: results
  };

  console.log(JSON.stringify(result));
  return result;
}

function DashboardService_requireContext_(request) {
  const sessionContext = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const user = sessionContext.user;
  const permissions = UserService_getPermissions_(user.role);

  DashboardService_assertPermission_(permissions, "report.read");

  const scope = DashboardService_resolveScope_(request && request.data, user, permissions);

  return {
    user: user,
    permissions: permissions,
    scope: scope
  };
}

function DashboardService_assertPermission_(permissions, permission) {
  if (!DashboardService_hasPermission_(permissions, permission)) {
    throw ApiError_("FORBIDDEN", "ไม่มีสิทธิ์เข้าถึง Dashboard");
  }
}

function DashboardService_hasPermission_(permissions, permission) {
  const safePermissions = permissions || [];

  return safePermissions.indexOf("admin.full") !== -1 || safePermissions.indexOf(permission) !== -1;
}

function DashboardService_resolveScope_(data, user, permissions) {
  const requestedScope = Utils_normalizeString_(data && data.scope).toLowerCase();
  const role = Utils_normalizeString_(user && user.role).toLowerCase();
  const scope = requestedScope || (role === "officer" ? "mine" : "global");

  if (scope !== "global" && scope !== "mine") {
    throw ApiError_("VALIDATION_ERROR", "กรุณาระบุ Scope ให้ถูกต้อง", {
      scope: "รองรับเฉพาะ global หรือ mine"
    });
  }

  if (role === "officer" && scope === "global" && !DashboardService_hasPermission_(permissions, "admin.full")) {
    throw ApiError_("FORBIDDEN", "ไม่มีสิทธิ์ดู Dashboard ทั้งหมด");
  }

  return scope;
}

function DashboardService_readReportSummaryRows_(context) {
  const readResult = SheetRepository_selectColumns_("reports", DASHBOARD_REPORT_COLUMNS_, {
    keyColumnName: "report_id"
  });
  const userId = String(context && context.user ? context.user.user_id : "");

  return readResult.objects.filter(function (report) {
    if (context.scope !== "mine") {
      return true;
    }

    return String(report.assigned_to || "") === userId;
  });
}

function DashboardService_readCategorySummaryRows_() {
  return SheetRepository_selectColumns_("categories", DASHBOARD_CATEGORY_COLUMNS_, {
    keyColumnName: "category_id"
  }).objects;
}

function DashboardService_buildSummary_(reports, categories, context, now) {
  const safeReports = Array.isArray(reports) ? reports : [];
  const categoryMap = DashboardService_buildCategoryMap_(categories || []);
  const nowDate = now || new Date();
  const aggregate = {
    total: 0,
    open: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
    withinTarget: 0,
    targetMeasured: 0,
    resolutionHoursTotal: 0,
    resolutionMeasured: 0,
    byMonth: {},
    byCategory: {},
    byStatus: {},
    byVillage: {}
  };

  safeReports.forEach(function (report) {
    const status = DashboardService_normalizeStatus_(report.status);
    const categoryId = String(report.category_id || "");
    const villageKey = DashboardService_normalizeVillageKey_(report);
    const yearMonth = DashboardService_resolveYearMonth_(report);
    const resolutionDate = DashboardService_getResolutionDate_(report);
    const targetDate = DashboardService_parseDate_(report.target_due_at);
    const createdDate = DashboardService_parseDate_(report.created_at);

    aggregate.total += 1;
    aggregate.byStatus[status] = (aggregate.byStatus[status] || 0) + 1;
    DashboardService_incrementGroup_(aggregate.byMonth, yearMonth, "yearMonth", yearMonth);
    DashboardService_incrementGroup_(aggregate.byCategory, categoryId || "uncategorized", "categoryId", categoryId);
    if (villageKey) {
      DashboardService_incrementGroup_(aggregate.byVillage, villageKey, "villageKey", villageKey);
      aggregate.byVillage[villageKey].villageNo = villageKey;
    }

    if (DashboardService_isClosedStatus_(status)) {
      aggregate.closed += 1;
      aggregate.byMonth[yearMonth].closed = (aggregate.byMonth[yearMonth].closed || 0) + 1;
    }

    if (DashboardService_isResolvedStatus_(status) || resolutionDate) {
      aggregate.resolved += 1;
      aggregate.byMonth[yearMonth].resolved = (aggregate.byMonth[yearMonth].resolved || 0) + 1;
    } else {
      aggregate.open += 1;
      aggregate.byMonth[yearMonth].open = (aggregate.byMonth[yearMonth].open || 0) + 1;
    }

    if (!DashboardService_isTerminalStatus_(status) && targetDate && targetDate.getTime() < nowDate.getTime()) {
      aggregate.overdue += 1;
      aggregate.byCategory[categoryId || "uncategorized"].overdue += 1;
      if (villageKey) {
        aggregate.byVillage[villageKey].overdue += 1;
      }
      aggregate.byMonth[yearMonth].overdue = (aggregate.byMonth[yearMonth].overdue || 0) + 1;
    }

    if (resolutionDate && createdDate) {
      aggregate.resolutionMeasured += 1;
      aggregate.resolutionHoursTotal += Math.max(resolutionDate.getTime() - createdDate.getTime(), 0) / 36e5;
    }

    if (resolutionDate && targetDate) {
      aggregate.targetMeasured += 1;
      if (resolutionDate.getTime() <= targetDate.getTime()) {
        aggregate.withinTarget += 1;
      }
    }
  });

  return DashboardService_projectSummary_(aggregate, categoryMap, context, nowDate);
}

function DashboardService_projectSummary_(aggregate, categoryMap, context, nowDate) {
  const averageResolutionHours = aggregate.resolutionMeasured > 0 ?
    DashboardService_roundNumber_(aggregate.resolutionHoursTotal / aggregate.resolutionMeasured, 2) :
    0;
  const withinTargetPercent = aggregate.targetMeasured > 0 ?
    DashboardService_roundNumber_((aggregate.withinTarget / aggregate.targetMeasured) * 100, 2) :
    0;

  return {
    scope: context.scope,
    generatedAt: nowDate.toISOString(),
    cards: {
      total: aggregate.total,
      open: aggregate.open,
      resolved: aggregate.resolved,
      closed: aggregate.closed,
      overdue: aggregate.overdue,
      averageResolutionHours: averageResolutionHours,
      withinTargetPercent: withinTargetPercent
    },
    byMonth: DashboardService_projectByMonth_(aggregate.byMonth),
    byCategory: DashboardService_projectByCategory_(aggregate.byCategory, categoryMap),
    byStatus: DashboardService_projectByStatus_(aggregate.byStatus),
    byVillage: DashboardService_projectByVillage_(aggregate.byVillage)
  };
}

function DashboardService_buildCategoryMap_(categories) {
  const map = {};

  (categories || []).forEach(function (category) {
    const categoryId = String(category.category_id || "");

    if (!categoryId || !Utils_toBoolean_(category.is_active)) {
      return;
    }

    map[categoryId] = {
      categoryId: categoryId,
      code: String(category.code || ""),
      name: Security_sanitizeText_(category.name || ""),
      icon: Security_sanitizeText_(category.icon || "circle"),
      color: CategoryService_normalizeColor_(category.color || "#287444"),
      sortOrder: Number(category.sort_order || 0)
    };
  });

  return map;
}

function DashboardService_incrementGroup_(groups, key, keyName, keyValue) {
  const groupKey = key || "unknown";

  if (!groups[groupKey]) {
    groups[groupKey] = {
      total: 0,
      overdue: 0
    };
    groups[groupKey][keyName] = keyValue || groupKey;
  }

  groups[groupKey].total += 1;
}

function DashboardService_projectByMonth_(groups) {
  return Object.keys(groups || {}).sort().slice(-12).map(function (key) {
    return {
      yearMonth: groups[key].yearMonth,
      total: groups[key].total,
      open: Number(groups[key].open || 0),
      resolved: Number(groups[key].resolved || 0),
      closed: Number(groups[key].closed || 0),
      overdue: Number(groups[key].overdue || 0)
    };
  });
}

function DashboardService_projectByCategory_(groups, categoryMap) {
  return Object.keys(groups || {}).map(function (key) {
    const group = groups[key];
    const category = categoryMap[group.categoryId] || {
      categoryId: group.categoryId,
      code: "",
      name: "",
      icon: "circle",
      color: "#287444",
      sortOrder: 999999
    };

    return {
      categoryId: category.categoryId,
      code: category.code,
      name: category.name,
      icon: category.icon,
      color: category.color,
      total: group.total,
      overdue: group.overdue,
      sortOrder: category.sortOrder
    };
  }).sort(function (left, right) {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return right.total - left.total;
  }).map(function (item) {
    return {
      categoryId: item.categoryId,
      code: item.code,
      name: item.name,
      icon: item.icon,
      color: item.color,
      total: item.total,
      overdue: item.overdue
    };
  });
}

function DashboardService_projectByStatus_(groups) {
  const keys = {};
  const statusOrder = DashboardService_getStatusOrder_();

  statusOrder.forEach(function (status) {
    keys[status] = true;
  });
  Object.keys(groups || {}).forEach(function (status) {
    keys[status] = true;
  });

  return Object.keys(keys).map(function (status) {
    return {
      status: status,
      total: Number(groups[status] || 0)
    };
  }).sort(function (left, right) {
    const leftIndex = statusOrder.indexOf(left.status);
    const rightIndex = statusOrder.indexOf(right.status);
    const safeLeftIndex = leftIndex === -1 ? 999 : leftIndex;
    const safeRightIndex = rightIndex === -1 ? 999 : rightIndex;

    if (safeLeftIndex !== safeRightIndex) {
      return safeLeftIndex - safeRightIndex;
    }

    return left.status.localeCompare(right.status);
  });
}

function DashboardService_getStatusOrder_() {
  if (typeof REPORT_STATUS_VALUES_ !== "undefined" && Array.isArray(REPORT_STATUS_VALUES_)) {
    return REPORT_STATUS_VALUES_.slice();
  }

  return DASHBOARD_STATUS_ORDER_.slice();
}

function DashboardService_projectByVillage_(groups) {
  const projected = {};

  DASHBOARD_VILLAGE_NUMBERS_.forEach(function (villageNo) {
    projected[villageNo] = {
      villageKey: villageNo,
      villageNo: villageNo,
      label: "หมู่ " + villageNo,
      total: 0,
      overdue: 0
    };
  });

  Object.keys(groups || {}).forEach(function (key) {
    const villageNo = DashboardService_normalizeVillageNumber_(groups[key].villageNo || groups[key].villageKey || key);

    if (!villageNo) {
      DashboardService_logInvalidVillageForDev_(groups[key].villageNo || groups[key].villageKey || key);
      return;
    }

    projected[villageNo].total += Number(groups[key].total || 0);
    projected[villageNo].overdue += Number(groups[key].overdue || 0);
  });

  return DASHBOARD_VILLAGE_NUMBERS_.map(function (villageNo) {
    return projected[villageNo];
  });
}

function DashboardService_normalizeStatus_(status) {
  return Utils_normalizeString_(status || "new").toLowerCase() || "new";
}

function DashboardService_isResolvedStatus_(status) {
  return status === "resolved" || status === "closed";
}

function DashboardService_isClosedStatus_(status) {
  return status === "closed";
}

function DashboardService_isTerminalStatus_(status) {
  return status === "resolved" || status === "closed" || status === "rejected" || status === "duplicate";
}

function DashboardService_getResolutionDate_(report) {
  return DashboardService_parseDate_(report.closed_at) || DashboardService_parseDate_(report.resolved_at);
}

function DashboardService_parseDate_(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return isNaN(date.getTime()) ? null : date;
}

function DashboardService_resolveYearMonth_(report) {
  const explicitValue = Utils_normalizeString_(report.year_month);

  if (/^\d{4}-\d{2}$/.test(explicitValue)) {
    return explicitValue;
  }

  const createdDate = DashboardService_parseDate_(report.created_at);

  if (!createdDate) {
    return "unknown";
  }

  return createdDate.toISOString().slice(0, 7);
}

function DashboardService_normalizeVillageKey_(report) {
  const villageKey = DashboardService_normalizeVillageNumber_(report && report.village_key);

  if (villageKey) {
    return villageKey;
  }

  const villageNo = DashboardService_normalizeVillageNumber_(report && report.village_no);

  if (villageNo) {
    return villageNo;
  }

  DashboardService_logInvalidVillageForDev_(report && (report.village_key || report.village_no));
  return "";
}

function DashboardService_normalizeVillageNumber_(value) {
  let text = DashboardService_normalizeThaiDigits_(Utils_normalizeString_(value)).toLowerCase();
  let match;

  if (!text) {
    return "";
  }

  text = text.replace(/\s+/g, " ");

  if (/^[1-5]$/.test(text)) {
    return text;
  }

  match = text.match(/^(?:\u0e2b\u0e21\u0e39\u0e48(?:\u0e17\u0e35\u0e48)?|\u0e21\.?|moo|village)\s*([1-5])$/);

  if (match && match[1]) {
    return match[1];
  }

  return "";
}

function DashboardService_normalizeThaiDigits_(value) {
  const thaiDigits = {
    "\u0e50": "0",
    "\u0e51": "1",
    "\u0e52": "2",
    "\u0e53": "3",
    "\u0e54": "4",
    "\u0e55": "5",
    "\u0e56": "6",
    "\u0e57": "7",
    "\u0e58": "8",
    "\u0e59": "9"
  };

  return String(value || "").replace(/[\u0e50-\u0e59]/g, function (digit) {
    return thaiDigits[digit] || digit;
  });
}

function DashboardService_logInvalidVillageForDev_(value) {
  if (!value || typeof console === "undefined" || typeof console.warn !== "function") {
    return;
  }

  try {
    if (typeof Config_getEnvironment_ === "function" && Config_getEnvironment_() !== "production") {
      console.warn("DASHBOARD_INVALID_VILLAGE_IGNORED", {
        value: String(value)
      });
    }
  } catch (error) {
    console.warn("DASHBOARD_INVALID_VILLAGE_IGNORED", {
      value: String(value)
    });
  }
}

function DashboardService_roundNumber_(value, digits) {
  const factor = Math.pow(10, digits || 0);

  return Math.round(Number(value || 0) * factor) / factor;
}

function DashboardService_buildCacheKey_(context) {
  const version = DashboardService_getCacheVersion_();
  const userPart = context.scope === "mine" && context.user ? String(context.user.user_id || "") : "global";
  const rawKey = [
    "dashboard.summary",
    DASHBOARD_SUMMARY_SCHEMA_VERSION_,
    version,
    context.scope,
    userPart
  ].join(".");

  return rawKey.slice(0, 240);
}

function DashboardService_getCacheVersion_() {
  return Config_getScriptProperties_().getProperty(DASHBOARD_CACHE_VERSION_KEY_) || "1";
}

function DashboardService_clearCache_() {
  const nextVersion = [
    new Date().getTime(),
    Utils_createUuid_().replace(/-/g, "").slice(0, 8)
  ].join(".");

  Config_getScriptProperties_().setProperty(DASHBOARD_CACHE_VERSION_KEY_, nextVersion);
  return {
    ok: true,
    version: nextVersion
  };
}

function DashboardService_getCachedSummarySafe_(cacheKey, diagnostics) {
  try {
    return SettingsService_getCachedJson_(cacheKey);
  } catch (error) {
    DashboardService_logStep_("DASHBOARD_CACHE_READ_FAILED", diagnostics, {
      code: error && error.code ? error.code : "INTERNAL_ERROR",
      name: error && error.name ? error.name : "Error",
      message: error && error.message ? error.message : String(error)
    });
    return null;
  }
}

function DashboardService_putCachedSummarySafe_(cacheKey, data, diagnostics) {
  try {
    SettingsService_putCachedJson_(cacheKey, data, DASHBOARD_CACHE_TTL_SECONDS_);
    return true;
  } catch (error) {
    DashboardService_logStep_("DASHBOARD_CACHE_WRITE_FAILED", diagnostics, {
      code: error && error.code ? error.code : "INTERNAL_ERROR",
      name: error && error.name ? error.name : "Error",
      message: error && error.message ? error.message : String(error),
      payloadBytes: JSON.stringify(data || {}).length
    });
    return false;
  }
}

function DashboardService_createDiagnostics_(request) {
  const safeRequest = request || {};
  const diagnostics = {
    enabled: DashboardService_isDevelopment_(),
    requestId: safeRequest.requestId || "",
    action: safeRequest.action || "dashboard.summary",
    startedMs: new Date().getTime(),
    lastStep: "",
    steps: []
  };

  diagnostics.log = function (step, detail) {
    diagnostics.lastStep = step;
    const entry = {
      step: step,
      elapsedMs: new Date().getTime() - diagnostics.startedMs,
      detail: DashboardService_projectDiagnosticDetail_(detail || {})
    };

    diagnostics.steps.push(entry);
    DashboardService_logStep_(step, diagnostics, entry.detail);
  };

  diagnostics.fail = function (error) {
    if (error) {
      error.dashboardLastStep = diagnostics.lastStep;
    }

    DashboardService_logStep_("DASHBOARD_STEP_FAILED", diagnostics, {
      lastStep: diagnostics.lastStep,
      code: error && error.code ? error.code : "INTERNAL_ERROR",
      name: error && error.name ? error.name : "Error",
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : ""
    });
  };

  return diagnostics;
}

function DashboardService_logStep_(step, diagnostics, detail) {
  const safeDiagnostics = diagnostics || {};

  if (!safeDiagnostics.enabled) {
    return;
  }

  Security_safeLog_("DASHBOARD_FLOW", {
    requestId: safeDiagnostics.requestId || "",
    action: safeDiagnostics.action || "dashboard.summary",
    step: step,
    elapsedMs: new Date().getTime() - Number(safeDiagnostics.startedMs || new Date().getTime()),
    detail: DashboardService_projectDiagnosticDetail_(detail || {})
  });
}

function DashboardService_projectDiagnosticDetail_(detail) {
  const safeDetail = detail || {};
  const output = {};

  Object.keys(safeDetail).forEach(function (key) {
    const value = safeDetail[key];

    if (key.toLowerCase().indexOf("token") !== -1 ||
        key.toLowerCase().indexOf("email") !== -1 ||
        key.toLowerCase().indexOf("phone") !== -1) {
      output[key] = "REDACTED";
      return;
    }

    if (value === undefined) {
      output[key] = "";
      return;
    }

    output[key] = value;
  });

  return output;
}

function DashboardService_findSerializationIssues_(value) {
  const issues = [];
  const stack = [];

  DashboardService_walkSerializable_(value, "$", stack, issues);
  return issues;
}

function DashboardService_walkSerializable_(value, path, stack, issues) {
  if (issues.length >= 50) {
    return;
  }

  if (value === undefined) {
    issues.push({
      path: path,
      reason: "undefined"
    });
    return;
  }

  if (typeof value === "number" && !isFinite(value)) {
    issues.push({
      path: path,
      reason: "non-finite-number"
    });
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      issues.push({
        path: path,
        reason: "invalid-date"
      });
    }
    return;
  }

  if (stack.indexOf(value) !== -1) {
    issues.push({
      path: path,
      reason: "circular"
    });
    return;
  }

  stack.push(value);

  if (Array.isArray(value)) {
    value.forEach(function (item, index) {
      DashboardService_walkSerializable_(item, path + "[" + index + "]", stack, issues);
    });
  } else if (Utils_isPlainObject_(value)) {
    Object.keys(value).forEach(function (key) {
      DashboardService_walkSerializable_(value[key], path + "." + key, stack, issues);
    });
  } else {
    issues.push({
      path: path,
      reason: "non-plain-object"
    });
  }

  stack.pop();
}

function DashboardService_findDiagnosticAdminUser_() {
  const users = SheetRepository_readRows_("users", {
    keyColumnName: "user_id",
    includeDeleted: false
  }).rows.map(function (entry) {
    return entry.object;
  }).filter(function (user) {
    return user && user.user_id &&
      !Utils_toBoolean_(user.is_deleted) &&
      UserService_isActive_(user) &&
      DashboardService_hasPermission_(UserService_getPermissions_(user.role), "report.read");
  });
  const preferred = users.filter(function (user) {
    return Utils_normalizeString_(user.role).toLowerCase() === "super_admin";
  })[0];

  if (!preferred && users.length === 0) {
    throw ApiError_("VALIDATION_ERROR", "No active admin user found for dashboard diagnostic.");
  }

  return preferred || users[0];
}

function DashboardService_assertDevelopmentOnly_() {
  if (!DashboardService_isDevelopment_()) {
    throw ApiError_("FORBIDDEN", "Dashboard diagnostic is available only outside production.");
  }
}

function DashboardService_isDevelopment_() {
  const environment = typeof Config_getEnvironment_ === "function" ?
    Utils_normalizeString_(Config_getEnvironment_()).toLowerCase() :
    "development";

  return environment !== "production";
}
