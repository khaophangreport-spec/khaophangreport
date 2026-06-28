const DEMO_REPORT_SEED_BATCH_ID_ = "DEMO-REPORTS-2026-03-07-V1";
const DEMO_REPORT_SEED_REPORT_PREFIX_ = "DEMO-REPORT-2026-03-07-";
const DEMO_REPORT_SEED_REQUEST_PREFIX_ = "REQ-DEMO-REPORT-2026-03-07-";
const DEMO_REPORT_SEED_UPDATE_PREFIX_ = "DEMO-UPDATE-2026-03-07-";
const DEMO_REPORT_SEED_ASSIGNMENT_PREFIX_ = "DEMO-ASG-2026-03-07-";
const DEMO_REPORT_SEED_CONFIRM_ = "SEED_DEMO_REPORTS_2026";
const DEMO_REPORT_CLEANUP_CONFIRM_ = "CLEAN_DEMO_REPORTS_2026";

const DEMO_REPORT_MONTH_CONFIGS_ = Object.freeze([
  { month: "2026-03", count: 7, completedCount: 7, maxStartDay: 24 },
  { month: "2026-04", count: 8, completedCount: 8, maxStartDay: 24 },
  { month: "2026-05", count: 7, completedCount: 7, maxStartDay: 24 },
  { month: "2026-06", count: 9, completedCount: 7, maxStartDay: 23 },
  { month: "2026-07", count: 6, completedCount: 0, maxStartDay: 25 }
]);

const DEMO_REPORT_SCENARIOS_ = Object.freeze([
  {
    categoryId: "CAT-001",
    title: "ถนนชำรุดบริเวณทางเข้าหมู่บ้าน",
    description: "พื้นผิวถนนเป็นหลุมหลายจุด รถจักรยานยนต์สัญจรลำบากในช่วงเช้าและเย็น",
    locationName: "ทางเข้าหมู่บ้านเขาพัง",
    landmark: "ใกล้ศาลาประชาคม",
    priority: "high"
  },
  {
    categoryId: "CAT-002",
    title: "ไฟส่องสว่างสาธารณะดับ",
    description: "ไฟทางดับต่อเนื่องหลายดวง ทำให้จุดกลับรถมืดและเสี่ยงอุบัติเหตุ",
    locationName: "ถนนสายหลักหน้าศูนย์พัฒนาเด็กเล็ก",
    landmark: "เสาไฟหมายเลข 12",
    priority: "normal"
  },
  {
    categoryId: "CAT-003",
    title: "น้ำประปาไหลอ่อนในช่วงเย็น",
    description: "แรงดันน้ำลดลงหลังเวลา 17.00 น. หลายครัวเรือนใช้น้ำไม่เพียงพอ",
    locationName: "ซอยร่วมใจ หมู่ 4",
    landmark: "ท้ายซอยใกล้แทงก์น้ำ",
    priority: "normal"
  },
  {
    categoryId: "CAT-004",
    title: "ขยะตกค้างหลังวันเก็บขยะ",
    description: "มีถุงขยะตกค้างและส่งกลิ่นรบกวนริมทางเดินสาธารณะ",
    locationName: "จุดพักขยะหน้าตลาดชุมชน",
    landmark: "ข้างร้านค้าชุมชน",
    priority: "normal"
  },
  {
    categoryId: "CAT-005",
    title: "ท่อระบายน้ำอุดตันหลังฝนตก",
    description: "น้ำระบายช้าและเอ่อล้นผิวถนนเมื่อฝนตกหนัก",
    locationName: "หน้าวัดเขาพัง",
    landmark: "ฝั่งประตูทางเข้า",
    priority: "high"
  },
  {
    categoryId: "CAT-007",
    title: "ป้ายเตือนทางโค้งชำรุด",
    description: "ป้ายเตือนเอียงและสีซีด ผู้ขับขี่มองเห็นไม่ชัดในเวลากลางคืน",
    locationName: "ทางโค้งก่อนถึงสะพาน",
    landmark: "ใกล้หลักกิโลเมตรชุมชน",
    priority: "normal"
  },
  {
    categoryId: "CAT-009",
    title: "สนามเด็กเล่นมีอุปกรณ์หลวม",
    description: "นอตยึดเครื่องเล่นบางจุดหลวม ควรตรวจสอบก่อนเปิดใช้งานต่อเนื่อง",
    locationName: "ลานกิจกรรมหมู่บ้าน",
    landmark: "ข้างอาคารเอนกประสงค์",
    priority: "high"
  },
  {
    categoryId: "CAT-010",
    title: "เสียงรบกวนจากงานก่อสร้างช่วงเช้า",
    description: "มีเสียงเครื่องจักรก่อนเวลาที่ชุมชนกำหนด กระทบผู้พักอาศัยใกล้เคียง",
    locationName: "ซอยริมคลอง หมู่ 2",
    landmark: "หลังศูนย์เรียนรู้",
    priority: "normal"
  }
]);

function runSeedDemoReportsMarchToJuly2026ForDevOnly() {
  return seedDemoReportsMarchToJuly2026({
    confirm: DEMO_REPORT_SEED_CONFIRM_
  });
}

function runCleanupDemoReportsMarchToJuly2026ForDevOnly() {
  return cleanupDemoReportsMarchToJuly2026({
    confirm: DEMO_REPORT_CLEANUP_CONFIRM_
  });
}

function diagnoseDemoReportsMarchToJuly2026() {
  DemoSeed_assertDevelopmentOnly_();

  const reportRead = SheetRepository_readRows_("reports", {
    keyColumnName: "report_id",
    includeDeleted: true
  });
  const updateRead = SheetRepository_readRows_("report_updates", {
    keyColumnName: "update_id",
    includeDeleted: true
  });
  const assignmentRead = SheetRepository_readRows_("assignments", {
    keyColumnName: "assignment_id",
    includeDeleted: true
  });
  const activityRead = SheetRepository_readRows_("activity_logs", {
    keyColumnName: "log_id",
    includeDeleted: true
  });
  const categories = SheetRepository_readRows_("categories", {
    keyColumnName: "category_id",
    includeDeleted: true
  }).rows.map(function (entry) {
    return entry.object;
  });
  const users = SheetRepository_readRows_("users", {
    keyColumnName: "user_id",
    includeDeleted: true
  }).rows.map(function (entry) {
    return entry.object;
  });
  const reportEntries = reportRead.rows.filter(function (entry) {
    return DemoSeed_isSeedRow_(entry.object, ["report_id", "request_id", "internal_summary", "search_text"]);
  }).map(function (entry) {
    entry.sheetName = "reports";
    return entry;
  });
  const updateEntries = updateRead.rows.filter(function (entry) {
    return DemoSeed_isSeedRow_(entry.object, ["update_id", "report_id"]);
  }).map(function (entry) {
    entry.sheetName = "report_updates";
    return entry;
  });
  const assignmentEntries = assignmentRead.rows.filter(function (entry) {
    return DemoSeed_isSeedRow_(entry.object, ["assignment_id", "report_id"]);
  }).map(function (entry) {
    entry.sheetName = "assignments";
    return entry;
  });
  const activityEntries = activityRead.rows.filter(function (entry) {
    return DemoSeed_isSeedRow_(entry.object, ["request_id", "entity_id", "detail"]);
  }).map(function (entry) {
    entry.sheetName = "activity_logs";
    return entry;
  });
  const result = {
    ok: true,
    readOnly: true,
    seedBatchId: DEMO_REPORT_SEED_BATCH_ID_,
    counts: {
      reports: reportEntries.length,
      updates: updateEntries.length,
      assignments: assignmentEntries.length,
      activityLogs: activityEntries.length
    },
    months: {},
    duplicates: {
      reportIds: [],
      requestIds: [],
      updateIds: [],
      assignmentIds: []
    },
    unknownStatuses: [],
    missingCategoryIds: [],
    missingAdminIds: [],
    invalidDates: [],
    chronologyErrors: [],
    resolvedWithoutResolvedAt: [],
    inProgressWithResolvedAt: [],
    orphanUpdates: [],
    orphanAssignments: [],
    orphanActivityLogs: [],
    rowShapeErrors: [],
    dashboardSummary: null,
    dashboardSummaryError: null,
    warnings: []
  };
  const categoryMap = DemoSeed_buildCategoryMap_(categories);
  const userMap = DemoSeed_buildUserMap_(users);
  const reportMap = {};
  const updatesByReportId = {};
  const validStatuses = DemoSeed_getValidStatuses_();

  DemoSeed_collectDuplicateValues_(reportEntries, "report_id", result.duplicates.reportIds);
  DemoSeed_collectDuplicateValues_(reportEntries, "request_id", result.duplicates.requestIds);
  DemoSeed_collectDuplicateValues_(updateEntries, "update_id", result.duplicates.updateIds);
  DemoSeed_collectDuplicateValues_(assignmentEntries, "assignment_id", result.duplicates.assignmentIds);
  DemoSeed_collectRowShapeErrors_(reportRead, reportEntries, result.rowShapeErrors);
  DemoSeed_collectRowShapeErrors_(updateRead, updateEntries, result.rowShapeErrors);
  DemoSeed_collectRowShapeErrors_(assignmentRead, assignmentEntries, result.rowShapeErrors);
  DemoSeed_collectRowShapeErrors_(activityRead, activityEntries, result.rowShapeErrors);

  reportEntries.forEach(function (entry) {
    const report = entry.object;
    const reportId = String(report.report_id || "");
    const status = Utils_normalizeString_(report.status).toLowerCase();
    const yearMonth = DashboardService_resolveYearMonth_(report);

    reportMap[reportId] = report;
    result.months[yearMonth] = result.months[yearMonth] || {
      total: 0,
      resolved: 0,
      inProgress: 0,
      open: 0,
      invalidDateRows: 0
    };
    result.months[yearMonth].total += 1;

    if (status === "resolved") {
      result.months[yearMonth].resolved += 1;
    }

    if (status === "in_progress") {
      result.months[yearMonth].inProgress += 1;
    }

    if (!DashboardService_isTerminalStatus_(status)) {
      result.months[yearMonth].open += 1;
    }

    if (validStatuses.indexOf(status) === -1) {
      result.unknownStatuses.push(DemoSeed_issue_(entry, "status", status));
    }

    if (!categoryMap[report.category_id]) {
      result.missingCategoryIds.push(DemoSeed_issue_(entry, "category_id", report.category_id));
    }

    ["assigned_to", "created_by", "updated_by"].forEach(function (columnName) {
      const value = String(report[columnName] || "");

      if (value && !userMap[value]) {
        result.missingAdminIds.push(DemoSeed_issue_(entry, columnName, value));
      }
    });

    ["created_at", "updated_at", "target_due_at", "resolved_at", "closed_at", "rejected_at"].forEach(function (columnName) {
      if (!DemoSeed_isDateValueValidForDiagnostic_(report[columnName])) {
        result.invalidDates.push(DemoSeed_issue_(entry, columnName, report[columnName]));
        result.months[yearMonth].invalidDateRows += 1;
      }
    });

    if (status === "resolved" && !report.resolved_at && !report.closed_at) {
      result.resolvedWithoutResolvedAt.push(DemoSeed_issue_(entry, "resolved_at", report.resolved_at));
    }

    if (status === "in_progress" && (report.resolved_at || report.closed_at)) {
      result.inProgressWithResolvedAt.push(DemoSeed_issue_(entry, "resolved_at", report.resolved_at || report.closed_at));
    }
  });

  updateEntries.forEach(function (entry) {
    const update = entry.object;
    const reportId = String(update.report_id || "");

    if (!reportMap[reportId]) {
      result.orphanUpdates.push(DemoSeed_issue_(entry, "report_id", reportId));
      return;
    }

    updatesByReportId[reportId] = updatesByReportId[reportId] || [];
    updatesByReportId[reportId].push(entry);

    if (!DemoSeed_isDateValueValidForDiagnostic_(update.created_at)) {
      result.invalidDates.push(DemoSeed_issue_(entry, "created_at", update.created_at));
    }

    if (update.new_status && validStatuses.indexOf(Utils_normalizeString_(update.new_status).toLowerCase()) === -1) {
      result.unknownStatuses.push(DemoSeed_issue_(entry, "new_status", update.new_status));
    }

    if (update.updated_by && !userMap[String(update.updated_by || "")]) {
      result.missingAdminIds.push(DemoSeed_issue_(entry, "updated_by", update.updated_by));
    }
  });

  assignmentEntries.forEach(function (entry) {
    const assignment = entry.object;
    const reportId = String(assignment.report_id || "");

    if (!reportMap[reportId]) {
      result.orphanAssignments.push(DemoSeed_issue_(entry, "report_id", reportId));
    }

    ["assigned_to", "assigned_by"].forEach(function (columnName) {
      const value = String(assignment[columnName] || "");

      if (value && !userMap[value]) {
        result.missingAdminIds.push(DemoSeed_issue_(entry, columnName, value));
      }
    });

    ["assigned_at", "target_due_at", "completed_at", "unassigned_at", "created_at"].forEach(function (columnName) {
      if (!DemoSeed_isDateValueValidForDiagnostic_(assignment[columnName])) {
        result.invalidDates.push(DemoSeed_issue_(entry, columnName, assignment[columnName]));
      }
    });
  });

  activityEntries.forEach(function (entry) {
    const log = entry.object;
    const reportId = String(log.entity_id || "");

    if (reportId && !reportMap[reportId]) {
      result.orphanActivityLogs.push(DemoSeed_issue_(entry, "entity_id", reportId));
    }

    if (!DemoSeed_isDateValueValidForDiagnostic_(log.created_at)) {
      result.invalidDates.push(DemoSeed_issue_(entry, "created_at", log.created_at));
    }
  });

  Object.keys(updatesByReportId).forEach(function (reportId) {
    const updateObjects = updatesByReportId[reportId].map(function (entry) {
      return entry.object;
    });

    try {
      DemoSeed_validateReportTimeline_(reportMap[reportId], updateObjects);
    } catch (error) {
      result.chronologyErrors.push({
        reportId: reportId,
        code: error && error.code ? error.code : "VALIDATION_ERROR",
        message: error && error.message ? error.message : String(error)
      });
    }
  });

  try {
    const activeCategories = categories.filter(function (category) {
      return category && category.category_id && Utils_toBoolean_(category.is_active) !== false;
    });
    const summary = DashboardService_buildSummary_(
      reportEntries.map(function (entry) {
        return entry.object;
      }),
      activeCategories,
      { scope: "global" },
      new Date()
    );

    result.dashboardSummary = {
      total: summary.cards.total,
      open: summary.cards.open,
      resolved: summary.cards.resolved,
      closed: summary.cards.closed,
      overdue: summary.cards.overdue,
      months: summary.byMonth.map(function (item) {
        return item.yearMonth;
      }),
      statuses: summary.byStatus.filter(function (item) {
        return item.total > 0;
      })
    };
  } catch (error) {
    result.dashboardSummaryError = {
      code: error && error.code ? error.code : "INTERNAL_ERROR",
      message: error && error.message ? error.message : String(error)
    };
  }

  DemoSeed_updateDiagnosticOk_(result);
  console.log(JSON.stringify(result));
  return result;
}

function seedDemoReportsMarchToJuly2026(options) {
  const safeOptions = options || {};

  DemoSeed_assertAllowed_(safeOptions, DEMO_REPORT_SEED_CONFIRM_);

  const existingRows = DemoSeed_findExistingSeedRows_("reports", [
    "report_id",
    "request_id"
  ]);

  if (existingRows.length > 0 && safeOptions.force !== true) {
    return {
      ok: true,
      skipped: true,
      reason: "Demo seed already exists. Pass force=true after confirming cleanup if you want to rebuild it.",
      seedBatchId: DEMO_REPORT_SEED_BATCH_ID_,
      existingReportCount: existingRows.length
    };
  }

  if (existingRows.length > 0 && safeOptions.force === true) {
    DemoSeed_cleanupRows_();
  }

  const categories = DemoSeed_getActiveCategories_();
  const adminUsers = DemoSeed_getActiveAdminUsers_();
  const plan = DemoSeed_buildDemoReportPlan_({
    categories: categories,
    adminUsers: adminUsers
  });

  DemoSeed_validatePlan_(plan, categories, adminUsers);

  plan.reports.forEach(function (report) {
    DemoSeed_appendRow_("reports", report, "report_id");
  });

  plan.updates.forEach(function (update) {
    DemoSeed_appendRow_("report_updates", update, "update_id");
  });

  plan.assignments.forEach(function (assignment) {
    DemoSeed_appendRow_("assignments", assignment, "assignment_id");
  });

  plan.activityLogs.forEach(function (log) {
    AuditService_log_(log);
  });

  return {
    ok: true,
    skipped: false,
    seedBatchId: DEMO_REPORT_SEED_BATCH_ID_,
    inserted: {
      reports: plan.reports.length,
      updates: plan.updates.length,
      assignments: plan.assignments.length,
      activityLogs: plan.activityLogs.length
    },
    months: plan.months
  };
}

function cleanupDemoReportsMarchToJuly2026(options) {
  const safeOptions = options || {};

  DemoSeed_assertAllowed_(safeOptions, DEMO_REPORT_CLEANUP_CONFIRM_);

  const cleanup = DemoSeed_cleanupRows_();

  return {
    ok: cleanup.errors.length === 0,
    seedBatchId: DEMO_REPORT_SEED_BATCH_ID_,
    clearedCount: cleanup.clearedCount,
    cleared: cleanup.cleared,
    errors: cleanup.errors
  };
}

function DemoSeed_assertAllowed_(options, expectedConfirm) {
  DemoSeed_assertDevelopmentOnly_();

  if (!options || options.confirm !== expectedConfirm) {
    throw ApiError_("VALIDATION_ERROR", "Confirmation is required before running demo report seed tooling.", {
      confirm: "Use confirm=" + expectedConfirm
    });
  }
}

function DemoSeed_assertDevelopmentOnly_() {
  const environment = typeof Config_getEnvironment_ === "function" ?
    Utils_normalizeString_(Config_getEnvironment_()).toLowerCase() :
    "development";

  if (environment === "production") {
    throw ApiError_("FORBIDDEN", "Demo report seed is blocked when ENVIRONMENT=production.");
  }
}

function DemoSeed_getActiveCategories_() {
  const readResult = SheetRepository_readRows_("categories", {
    keyColumnName: "category_id",
    includeDeleted: false
  });

  const categories = readResult.rows.map(function (entry) {
    return entry.object;
  }).filter(function (category) {
    return category && category.category_id && Utils_toBoolean_(category.is_active) !== false;
  });

  if (categories.length === 0) {
    throw ApiError_("VALIDATION_ERROR", "No active categories found for demo report seed.");
  }

  return categories;
}

function DemoSeed_getActiveAdminUsers_() {
  const readResult = SheetRepository_readRows_("users", {
    keyColumnName: "user_id",
    includeDeleted: false
  });
  const allowedRoles = ["super_admin", "admin", "officer"];
  const users = readResult.rows.map(function (entry) {
    return entry.object;
  }).filter(function (user) {
    const role = Utils_normalizeString_(user && user.role).toLowerCase();
    const status = Utils_normalizeString_(user && user.status).toLowerCase();

    return user && user.user_id &&
      allowedRoles.indexOf(role) !== -1 &&
      status === "active" &&
      !Utils_toBoolean_(user.is_deleted);
  });

  if (users.length === 0) {
    throw ApiError_("VALIDATION_ERROR", "No active admin/officer user found for demo report seed.");
  }

  return users;
}

function DemoSeed_buildDemoReportPlan_(context) {
  const safeContext = context || {};
  const categories = safeContext.categories || [];
  const adminUsers = safeContext.adminUsers || [];
  const categoryMap = DemoSeed_buildCategoryMap_(categories);
  const actor = DemoSeed_pickActor_(adminUsers);
  const officers = DemoSeed_filterOfficers_(adminUsers);
  const reports = [];
  const updates = [];
  const assignments = [];
  const activityLogs = [];
  const months = {};
  let sequence = 1;
  let updateSequence = 1;

  DEMO_REPORT_MONTH_CONFIGS_.forEach(function (monthConfig) {
    const monthSummary = {
      month: monthConfig.month,
      reports: 0,
      completed: 0,
      processing: 0,
      futureTestData: monthConfig.month === "2026-07"
    };

    for (let index = 0; index < monthConfig.count; index += 1) {
      const scenario = DemoSeed_pickScenario_(index, monthConfig, categoryMap);
      const isCompleted = index < monthConfig.completedCount;
      const finalStatus = isCompleted ? "resolved" : "in_progress";
      const reportDay = DemoSeed_pickReportDay_(monthConfig, index);
      const reportParts = monthConfig.month.split("-");
      const year = Number(reportParts[0]);
      const month = Number(reportParts[1]);
      const reportSuffix = DemoSeed_formatReportSuffix_(monthConfig.month, index + 1);
      const reportId = DEMO_REPORT_SEED_REPORT_PREFIX_ + reportSuffix;
      const requestId = DEMO_REPORT_SEED_REQUEST_PREFIX_ + reportSuffix;
      const createdAt = DemoSeed_makeIso_(year, month, reportDay, 8 + (index % 4), 10);
      const receivedAt = DemoSeed_addDaysIso_(createdAt, 0, 12 + (index % 3), 20);
      const assignedAt = DemoSeed_addDaysIso_(createdAt, 1, 10 + (index % 2), 15);
      const processingAt = DemoSeed_addDaysIso_(createdAt, 2, 13 + (index % 3), 30);
      const resolvedAt = isCompleted ?
        DemoSeed_addDaysIso_(createdAt, 4 + (index % 3), 15, 45) :
        "";
      const assignee = officers[index % officers.length] || actor;
      const isAnonymous = index % 3 === 2;
      const villageNo = String((index % 8) + 1);
      const priority = index % 11 === 0 ? "critical" : scenario.priority;
      const targetDueAt = DemoSeed_addDaysIso_(createdAt, priority === "critical" ? 2 : 7, 17, 0);
      const publicResult = isCompleted ?
        "ดำเนินการตรวจสอบและแก้ไขเบื้องต้นเรียบร้อยแล้ว" :
        "";
      const reporter = DemoSeed_buildReporter_(sequence, isAnonymous);
      const report = {
        report_id: reportId,
        tracking_code: DemoSeed_makeTrackingCode_(createdAt, sequence),
        request_id: requestId,
        category_id: scenario.categoryId,
        title: scenario.title,
        description: scenario.description,
        incident_date: createdAt.slice(0, 10),
        location_name: scenario.locationName,
        village_no: villageNo,
        landmark: scenario.landmark,
        latitude: "",
        longitude: "",
        map_url: "",
        is_anonymous: isAnonymous,
        reporter_name: reporter.name,
        reporter_phone: reporter.phone,
        reporter_email: reporter.email,
        contact_method: reporter.contactMethod,
        reporter_consent: true,
        truth_confirmation: true,
        privacy_version: "1.0",
        priority_reported: priority,
        priority: priority,
        status: finalStatus,
        assigned_to: assignee.user_id,
        target_due_at: targetDueAt,
        source: "admin",
        public_result: publicResult,
        internal_summary: "Demo seed batch " + DEMO_REPORT_SEED_BATCH_ID_,
        resolved_at: resolvedAt,
        closed_at: "",
        rejected_at: "",
        rejection_reason: "",
        duplicate_of_report_id: "",
        created_at: createdAt,
        updated_at: resolvedAt || processingAt,
        created_by: actor.user_id,
        updated_by: actor.user_id,
        is_deleted: false,
        deleted_at: "",
        deleted_by: "",
        version: 1,
        search_text: DemoSeed_buildSearchText_(scenario, monthConfig.month, reportSuffix),
        year_month: monthConfig.month,
        village_key: villageNo
      };
      const updateSet = DemoSeed_buildTimelineUpdates_({
        report: report,
        actor: actor,
        oldAssigneeId: "",
        assignee: assignee,
        receivedAt: receivedAt,
        assignedAt: assignedAt,
        processingAt: processingAt,
        resolvedAt: resolvedAt,
        isCompleted: isCompleted,
        firstUpdateNumber: updateSequence
      });

      updateSequence += updateSet.length;

      reports.push(report);
      Array.prototype.push.apply(updates, updateSet);
      assignments.push(DemoSeed_buildAssignment_(report, actor, assignee, assignedAt, targetDueAt, resolvedAt));
      activityLogs.push(DemoSeed_buildActivityLog_(report, actor, requestId));

      monthSummary.reports += 1;
      monthSummary.completed += isCompleted ? 1 : 0;
      monthSummary.processing += isCompleted ? 0 : 1;
      sequence += 1;
    }

    months[monthConfig.month] = monthSummary;
  });

  return {
    seedBatchId: DEMO_REPORT_SEED_BATCH_ID_,
    reports: reports,
    updates: updates,
    assignments: assignments,
    activityLogs: activityLogs,
    months: months
  };
}

function DemoSeed_pickScenario_(index, monthConfig, categoryMap) {
  const preferredScenario = DEMO_REPORT_SCENARIOS_[(index + Number(monthConfig.month.slice(5, 7))) % DEMO_REPORT_SCENARIOS_.length];

  if (categoryMap[preferredScenario.categoryId]) {
    return preferredScenario;
  }

  const categoryIds = Object.keys(categoryMap);
  const fallbackCategoryId = categoryIds[index % categoryIds.length];
  const fallbackScenario = Object.assign({}, preferredScenario);
  fallbackScenario.categoryId = fallbackCategoryId;
  return fallbackScenario;
}

function DemoSeed_buildReporter_(sequence, isAnonymous) {
  if (isAnonymous) {
    return {
      name: "",
      phone: "",
      email: "",
      contactMethod: "none"
    };
  }

  const suffix = ("000" + sequence).slice(-3);

  return {
    name: "ผู้แจ้งทดสอบ " + suffix,
    phone: "0800000" + suffix,
    email: "demo-reporter-" + suffix + "@example.test",
    contactMethod: sequence % 2 === 0 ? "email" : "phone"
  };
}

function DemoSeed_buildTimelineUpdates_(details) {
  const report = details.report;
  const actor = details.actor;
  const assignee = details.assignee;
  const updates = [];
  let number = details.firstUpdateNumber;

  updates.push(DemoSeed_buildUpdate_(number, report, {
    updateType: "status",
    oldStatus: "new",
    newStatus: "reviewing",
    publicMessage: "รับเรื่องและอยู่ระหว่างตรวจสอบข้อมูล",
    internalNote: "Demo seed received by admin.",
    isPublic: true,
    actor: actor,
    createdAt: details.receivedAt
  }));
  number += 1;

  updates.push(DemoSeed_buildUpdate_(number, report, {
    updateType: "assignment",
    oldStatus: "reviewing",
    newStatus: "assigned",
    publicMessage: "",
    internalNote: "มอบหมายให้ " + DemoSeed_userDisplayName_(assignee),
    isPublic: false,
    actor: actor,
    createdAt: details.assignedAt
  }));
  number += 1;

  updates.push(DemoSeed_buildUpdate_(number, report, {
    updateType: "status",
    oldStatus: "assigned",
    newStatus: "in_progress",
    publicMessage: "เจ้าหน้าที่รับผิดชอบเริ่มดำเนินการแล้ว",
    internalNote: "Demo seed processing update.",
    isPublic: true,
    actor: actor,
    createdAt: details.processingAt
  }));
  number += 1;

  if (details.isCompleted) {
    updates.push(DemoSeed_buildUpdate_(number, report, {
      updateType: "result",
      oldStatus: "in_progress",
      newStatus: "resolved",
      publicMessage: report.public_result,
      internalNote: "Demo seed resolved update.",
      isPublic: true,
      actor: actor,
      createdAt: details.resolvedAt
    }));
  }

  return updates;
}

function DemoSeed_buildUpdate_(number, report, details) {
  const actor = details.actor || {};

  return {
    update_id: DEMO_REPORT_SEED_UPDATE_PREFIX_ + ("0000" + number).slice(-4),
    report_id: report.report_id,
    update_type: details.updateType,
    old_status: details.oldStatus,
    new_status: details.newStatus,
    public_message: details.publicMessage || "",
    internal_note: details.internalNote || "",
    is_public: details.isPublic === true,
    updated_by: actor.user_id || "",
    updated_by_name_snapshot: DemoSeed_userDisplayName_(actor),
    updated_by_role_snapshot: actor.role || "",
    created_at: details.createdAt,
    is_deleted: false,
    version: 1
  };
}

function DemoSeed_buildAssignment_(report, actor, assignee, assignedAt, targetDueAt, resolvedAt) {
  return {
    assignment_id: DEMO_REPORT_SEED_ASSIGNMENT_PREFIX_ + report.report_id.replace(DEMO_REPORT_SEED_REPORT_PREFIX_, ""),
    report_id: report.report_id,
    assigned_to: assignee.user_id,
    assigned_by: actor.user_id,
    note: "Demo seed assignment",
    assigned_at: assignedAt,
    target_due_at: targetDueAt,
    completed_at: resolvedAt || "",
    unassigned_at: "",
    assignment_status: resolvedAt ? "completed" : "active",
    created_at: assignedAt,
    version: 1
  };
}

function DemoSeed_buildActivityLog_(report, actor, requestId) {
  return {
    userId: actor.user_id,
    userNameSnapshot: DemoSeed_userDisplayName_(actor),
    roleSnapshot: actor.role || "",
    action: "demo.report.seed",
    entityType: "report",
    entityId: report.report_id,
    detail: {
      seedBatchId: DEMO_REPORT_SEED_BATCH_ID_,
      yearMonth: report.year_month,
      status: report.status,
      futureTestData: report.year_month === "2026-07"
    },
    requestId: requestId,
    createdAt: report.created_at,
    severity: "info",
    success: true
  };
}

function DemoSeed_validatePlan_(plan, categories, adminUsers) {
  const categoryMap = DemoSeed_buildCategoryMap_(categories || []);
  const userMap = DemoSeed_buildUserMap_(adminUsers || []);
  const reportsById = {};
  const updatesByReportId = {};
  const monthCounts = {};
  const monthStatusCounts = {};

  (plan.reports || []).forEach(function (report) {
    reportsById[report.report_id] = report;
    monthCounts[report.year_month] = (monthCounts[report.year_month] || 0) + 1;
    monthStatusCounts[report.year_month] = monthStatusCounts[report.year_month] || {};
    monthStatusCounts[report.year_month][report.status] = (monthStatusCounts[report.year_month][report.status] || 0) + 1;

    if (!categoryMap[report.category_id]) {
      throw ApiError_("VALIDATION_ERROR", "Demo report category does not exist.", {
        categoryId: report.category_id
      });
    }

    if (!userMap[report.assigned_to]) {
      throw ApiError_("VALIDATION_ERROR", "Demo report assignee does not exist.", {
        assigneeId: report.assigned_to
      });
    }

    if (Utils_toBoolean_(report.is_anonymous) && (report.reporter_name || report.reporter_phone || report.reporter_email || report.contact_method !== "none")) {
      throw ApiError_("VALIDATION_ERROR", "Anonymous demo report contains reporter PII.", {
        reportId: report.report_id
      });
    }
  });

  (plan.updates || []).forEach(function (update) {
    updatesByReportId[update.report_id] = updatesByReportId[update.report_id] || [];
    updatesByReportId[update.report_id].push(update);
  });

  DEMO_REPORT_MONTH_CONFIGS_.forEach(function (config) {
    const count = monthCounts[config.month] || 0;
    const statuses = monthStatusCounts[config.month] || {};

    if (count < 5 || count > 10) {
      throw ApiError_("VALIDATION_ERROR", "Demo report month count is outside 5-10.", {
        month: config.month,
        count: count
      });
    }

    if (config.month === "2026-06" && (!statuses.resolved || !statuses.in_progress)) {
      throw ApiError_("VALIDATION_ERROR", "June demo reports must include both completed and processing items.");
    }

    if (config.month === "2026-07" && ((statuses.resolved || 0) > 0 || (statuses.closed || 0) > 0)) {
      throw ApiError_("VALIDATION_ERROR", "July demo reports must not be completed.");
    }
  });

  Object.keys(reportsById).forEach(function (reportId) {
    DemoSeed_validateReportTimeline_(reportsById[reportId], updatesByReportId[reportId] || []);
  });

  return {
    ok: true,
    reportCount: (plan.reports || []).length,
    updateCount: (plan.updates || []).length
  };
}

function DemoSeed_validateReportTimeline_(report, updates) {
  const sortedUpdates = updates.slice().sort(function (left, right) {
    return String(left.created_at || "") > String(right.created_at || "") ? 1 : -1;
  });
  const latest = sortedUpdates[sortedUpdates.length - 1];
  const reviewing = DemoSeed_findUpdateStatus_(sortedUpdates, "reviewing");
  const processing = DemoSeed_findUpdateStatus_(sortedUpdates, "in_progress");
  const resolved = DemoSeed_findUpdateStatus_(sortedUpdates, "resolved");

  if (!latest || latest.new_status !== report.status) {
    throw ApiError_("VALIDATION_ERROR", "Demo report latest timeline status does not match report status.", {
      reportId: report.report_id
    });
  }

  if (!reviewing || !processing) {
    throw ApiError_("VALIDATION_ERROR", "Demo report timeline is missing received or processing status.", {
      reportId: report.report_id
    });
  }

  if (reviewing.created_at < report.created_at || processing.created_at < reviewing.created_at) {
    throw ApiError_("VALIDATION_ERROR", "Demo report timeline dates are out of order.", {
      reportId: report.report_id
    });
  }

  if (report.status === "resolved" && (!resolved || !report.resolved_at || resolved.created_at < processing.created_at)) {
    throw ApiError_("VALIDATION_ERROR", "Demo completed report has invalid completion timeline.", {
      reportId: report.report_id
    });
  }

  if (report.year_month === "2026-07" && report.resolved_at) {
    throw ApiError_("VALIDATION_ERROR", "July future demo report contains resolved_at.", {
      reportId: report.report_id
    });
  }
}

function DemoSeed_findUpdateStatus_(updates, status) {
  return (updates || []).filter(function (update) {
    return update.new_status === status;
  })[0] || null;
}

function DemoSeed_cleanupRows_() {
  const targets = [
    { sheetName: "report_updates", columns: ["update_id", "report_id"] },
    { sheetName: "assignments", columns: ["assignment_id", "report_id"] },
    { sheetName: "activity_logs", columns: ["request_id", "entity_id", "detail"] },
    { sheetName: "reports", columns: ["report_id", "request_id"] }
  ];
  const cleanup = {
    clearedCount: 0,
    cleared: [],
    errors: []
  };

  targets.forEach(function (target) {
    try {
      const readResult = SheetRepository_readRows_(target.sheetName, {
        includeDeleted: true
      });

      readResult.rows.forEach(function (entry) {
        if (!DemoSeed_isSeedRow_(entry.object, target.columns)) {
          return;
        }

        readResult.sheet.getRange(entry.rowNumber, 1, 1, readResult.headers.length).clearContent();
        cleanup.clearedCount += 1;
        cleanup.cleared.push({
          sheetName: target.sheetName,
          rowNumber: entry.rowNumber
        });
      });
    } catch (error) {
      cleanup.errors.push({
        sheetName: target.sheetName,
        code: error && error.code ? error.code : "INTERNAL_ERROR",
        message: error && error.message ? error.message : String(error)
      });
    }
  });

  return cleanup;
}

function DemoSeed_findExistingSeedRows_(sheetName, columns) {
  const readResult = SheetRepository_readRows_(sheetName, {
    includeDeleted: true
  });

  return readResult.rows.filter(function (entry) {
    return DemoSeed_isSeedRow_(entry.object, columns);
  });
}

function DemoSeed_isSeedRow_(rowObject, columns) {
  return (columns || []).some(function (columnName) {
    return DemoSeed_isSeedValue_(rowObject && rowObject[columnName]);
  });
}

function DemoSeed_isSeedValue_(value) {
  const text = String(value || "");

  return text.indexOf(DEMO_REPORT_SEED_BATCH_ID_) !== -1 ||
    text.indexOf(DEMO_REPORT_SEED_REPORT_PREFIX_) === 0 ||
    text.indexOf(DEMO_REPORT_SEED_REQUEST_PREFIX_) === 0 ||
    text.indexOf(DEMO_REPORT_SEED_UPDATE_PREFIX_) === 0 ||
    text.indexOf(DEMO_REPORT_SEED_ASSIGNMENT_PREFIX_) === 0;
}

function DemoSeed_appendRow_(sheetName, rowObject, keyColumnName) {
  const sheet = SheetRepository_getSheet_(sheetName);
  const headers = SheetRepository_getHeaders_(sheet);
  const row = SheetRepository_objectToRow_(headers, rowObject || {});
  const targetRow = keyColumnName ?
    findFirstEmptyDataRow_(sheet, keyColumnName) :
    Math.max(sheet.getLastRow() + 1, 2);

  sheet.getRange(targetRow, 1, 1, headers.length).setValues([row]);

  return rowObject;
}

function DemoSeed_buildCategoryMap_(categories) {
  const map = {};

  (categories || []).forEach(function (category) {
    const categoryId = category.category_id || category.categoryId;

    if (categoryId) {
      map[categoryId] = category;
    }
  });

  return map;
}

function DemoSeed_buildUserMap_(users) {
  const map = {};

  (users || []).forEach(function (user) {
    const userId = user.user_id || user.userId;

    if (userId) {
      map[userId] = user;
    }
  });

  return map;
}

function DemoSeed_getValidStatuses_() {
  if (typeof REPORT_STATUS_VALUES_ !== "undefined" && Array.isArray(REPORT_STATUS_VALUES_)) {
    return REPORT_STATUS_VALUES_.slice();
  }

  return [
    "new",
    "reviewing",
    "assigned",
    "in_progress",
    "waiting",
    "resolved",
    "closed",
    "rejected",
    "duplicate"
  ];
}

function DemoSeed_collectDuplicateValues_(entries, columnName, output) {
  const seen = {};

  (entries || []).forEach(function (entry) {
    const value = String(entry.object && entry.object[columnName] || "");

    if (!value) {
      return;
    }

    if (seen[value]) {
      output.push(DemoSeed_issue_(entry, columnName, value));
      return;
    }

    seen[value] = true;
  });
}

function DemoSeed_collectRowShapeErrors_(readResult, entries, output) {
  (entries || []).forEach(function (entry) {
    if ((entry.values || []).length !== (readResult.headers || []).length) {
      output.push({
        sheetName: readResult.sheet ? readResult.sheet.getName() : "",
        rowNumber: entry.rowNumber,
        expectedColumns: (readResult.headers || []).length,
        actualColumns: (entry.values || []).length
      });
    }
  });
}

function DemoSeed_issue_(entry, columnName, value) {
  return {
    sheetName: entry && entry.sheetName ? entry.sheetName : "",
    rowNumber: entry && entry.rowNumber ? entry.rowNumber : "",
    reportId: entry && entry.object ? String(entry.object.report_id || entry.object.entity_id || "") : "",
    column: columnName,
    value: value === undefined || value === null ? "" : String(value)
  };
}

function DemoSeed_isDateValueValidForDiagnostic_(value) {
  if (value === "" || value === null || value === undefined) {
    return true;
  }

  const date = value instanceof Date ? value : new Date(value);

  return !isNaN(date.getTime());
}

function DemoSeed_updateDiagnosticOk_(result) {
  const issueKeys = [
    "unknownStatuses",
    "missingCategoryIds",
    "missingAdminIds",
    "invalidDates",
    "chronologyErrors",
    "resolvedWithoutResolvedAt",
    "inProgressWithResolvedAt",
    "orphanUpdates",
    "orphanAssignments",
    "orphanActivityLogs",
    "rowShapeErrors"
  ];
  const duplicateCount = Object.keys(result.duplicates || {}).reduce(function (total, key) {
    return total + ((result.duplicates[key] || []).length);
  }, 0);

  result.ok = !result.dashboardSummaryError &&
    duplicateCount === 0 &&
    issueKeys.every(function (key) {
      return (result[key] || []).length === 0;
    });
}

function DemoSeed_filterOfficers_(users) {
  const officers = (users || []).filter(function (user) {
    return Utils_normalizeString_(user.role).toLowerCase() === "officer";
  });

  return officers.length > 0 ? officers : users;
}

function DemoSeed_pickActor_(users) {
  const preferred = (users || []).filter(function (user) {
    const role = Utils_normalizeString_(user.role).toLowerCase();
    return role === "super_admin" || role === "admin";
  })[0];

  return preferred || (users || [])[0] || {
    user_id: "system",
    display_name: "System",
    role: "admin"
  };
}

function DemoSeed_userDisplayName_(user) {
  return (user && (user.display_name || user.displayName || user.username)) || "Demo Admin";
}

function DemoSeed_pickReportDay_(monthConfig, index) {
  const maxStartDay = Number(monthConfig.maxStartDay || 24);
  return Math.max(2, Math.floor(((index + 1) * maxStartDay) / (monthConfig.count + 1)));
}

function DemoSeed_makeIso_(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0)).toISOString();
}

function DemoSeed_addDaysIso_(isoValue, days, hour, minute) {
  const date = new Date(isoValue);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  date.setUTCHours(Number(hour || 0), Number(minute || 0), 0, 0);
  return date.toISOString();
}

function DemoSeed_formatReportSuffix_(monthValue, index) {
  return monthValue.replace("-", "") + "-" + ("00" + index).slice(-2);
}

function DemoSeed_makeTrackingCode_(createdAt, sequence) {
  const date = new Date(createdAt);
  const day = ("0" + date.getUTCDate()).slice(-2);
  const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
  const year = String(date.getUTCFullYear()).slice(-2);

  return "KPR-" + day + month + year + "-D" + ("000" + sequence).slice(-3);
}

function DemoSeed_buildSearchText_(scenario, monthValue, reportSuffix) {
  return [
    scenario.title,
    scenario.description,
    scenario.locationName,
    scenario.landmark,
    scenario.categoryId,
    monthValue,
    reportSuffix,
    DEMO_REPORT_SEED_BATCH_ID_
  ].join(" ").toLowerCase();
}

function DemoSeed_buildPlanForTest_() {
  return DemoSeed_buildDemoReportPlan_({
    categories: DemoSeed_getTestCategories_(),
    adminUsers: DemoSeed_getTestAdminUsers_()
  });
}

function DemoSeed_getTestCategories_() {
  return [
    { category_id: "CAT-001", is_active: true },
    { category_id: "CAT-002", is_active: true },
    { category_id: "CAT-003", is_active: true },
    { category_id: "CAT-004", is_active: true },
    { category_id: "CAT-005", is_active: true },
    { category_id: "CAT-007", is_active: true },
    { category_id: "CAT-009", is_active: true },
    { category_id: "CAT-010", is_active: true }
  ];
}

function DemoSeed_getTestAdminUsers_() {
  return [
    {
      user_id: "USER-DEMO-ADMIN",
      username: "demo.admin",
      display_name: "Demo Admin",
      role: "admin",
      status: "active"
    },
    {
      user_id: "USER-DEMO-OFFICER",
      username: "demo.officer",
      display_name: "Demo Officer",
      role: "officer",
      status: "active"
    }
  ];
}
