const DASHBOARD_CACHE_TTL_SECONDS_ = 120;
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

function DashboardService_summary(request) {
  const context = DashboardService_requireContext_(request);
  const cacheKey = DashboardService_buildCacheKey_(context);
  const cachedData = SettingsService_getCachedJson_(cacheKey);

  if (cachedData) {
    return {
      data: cachedData,
      message: "โหลดข้อมูล Dashboard สำเร็จ"
    };
  }

  const reports = DashboardService_readReportSummaryRows_(context);
  const categories = DashboardService_readCategorySummaryRows_();
  const data = DashboardService_buildSummary_(reports, categories, context, new Date());

  SettingsService_putCachedJson_(cacheKey, data, DASHBOARD_CACHE_TTL_SECONDS_);

  return {
    data: data,
    message: "โหลดข้อมูล Dashboard สำเร็จ"
  };
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
    DashboardService_incrementGroup_(aggregate.byVillage, villageKey, "villageKey", villageKey);
    aggregate.byVillage[villageKey].villageNo = Utils_normalizeString_(report.village_no) || villageKey;

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
      aggregate.byVillage[villageKey].overdue += 1;
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
  return Object.keys(groups || {}).map(function (key) {
    return {
      villageKey: groups[key].villageKey,
      villageNo: groups[key].villageNo || groups[key].villageKey,
      total: groups[key].total,
      overdue: groups[key].overdue
    };
  }).sort(function (left, right) {
    if (right.total !== left.total) {
      return right.total - left.total;
    }

    return String(left.villageKey || "").localeCompare(String(right.villageKey || ""));
  }).slice(0, 20);
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
  const villageKey = Utils_normalizeString_(report.village_key).toLowerCase();

  if (villageKey) {
    return villageKey;
  }

  return Utils_normalizeString_(report.village_no).toLowerCase() || "unknown";
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
