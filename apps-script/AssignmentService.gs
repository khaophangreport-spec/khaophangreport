const ASSIGNMENT_ACTIVE_STATUS_ = "active";
const ASSIGNMENT_REASSIGNED_STATUS_ = "reassigned";

function AssignmentService_assign(request) {
  const lock = LockService.getScriptLock();
  const context = ReportService_requireAdminListContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  ReportService_assertPermission_(context.permissions, "report.assign", "ไม่มีสิทธิ์มอบหมายงาน");
  lock.waitLock(30000);

  try {
    const payload = AssignmentService_validateAssignPayload_(request && request.data);
    const report = AssignmentService_getAssignableReport_(payload.reportId);
    const officer = AssignmentService_getActiveOfficer_(payload.assigneeId);
    const now = Utils_nowIso_();
    const targetDueAt = AssignmentService_resolveTargetDueAt_(report, now);
    const oldAssigneeId = String(report.assigned_to || "");
    const nextStatus = AssignmentService_getNextReportStatus_(report.status);

    AssignmentService_updateReportAssignment_(report, {
      assigneeId: payload.assigneeId,
      status: nextStatus,
      targetDueAt: targetDueAt,
      expectedVersion: payload.version,
      actorUserId: context.user.user_id
    });

    AssignmentService_closeOpenAssignments_(report.report_id, now, context.user.user_id);
    const assignment = AssignmentService_createAssignment_(report, {
      assigneeId: payload.assigneeId,
      assignedBy: context.user.user_id,
      note: payload.note,
      assignedAt: now,
      targetDueAt: targetDueAt
    });

    const updatedReport = Object.assign({}, report, {
      assigned_to: payload.assigneeId,
      status: nextStatus,
      target_due_at: targetDueAt,
      version: Number(report.version || 0) + 1
    });

    ReportService_createAssignmentTimeline_(report, updatedReport, officer, context.user, payload.note, now);
    AuditService_logReportAssigned_(report, updatedReport, assignment, officer, context.user, requestId, oldAssigneeId);
    ReportService_clearDashboardCacheSafe_();

    return {
      data: {
        reportId: String(report.report_id || ""),
        assignmentId: String(assignment.assignment_id || ""),
        assignedTo: String(officer.user_id || ""),
        assignedToName: Security_sanitizeText_(officer.display_name || officer.username || ""),
        assignedAt: now,
        targetDueAt: targetDueAt,
        status: nextStatus,
        version: Number(updatedReport.version || 0)
      },
      message: "มอบหมายงานเรียบร้อยแล้ว"
    };
  } finally {
    lock.releaseLock();
  }
}

function AssignmentService_validateAssignPayload_(data) {
  const safeData = Utils_isPlainObject_(data) ? data : {};
  const fields = {};
  const reportId = Utils_normalizeString_(safeData.reportId);
  const assigneeId = Utils_normalizeString_(safeData.assigneeId);
  const version = Number(safeData.version || 0);
  const note = Security_sanitizeUserText_(safeData.note, 1000);

  if (!reportId) {
    fields.reportId = "กรุณาระบุเรื่องที่ต้องการมอบหมาย";
  }

  if (!assigneeId) {
    fields.assigneeId = "กรุณาเลือกเจ้าหน้าที่ผู้รับผิดชอบ";
  }

  if (!isFinite(version) || version < 1) {
    fields.version = "ข้อมูลเรื่องไม่เป็นปัจจุบัน กรุณาโหลดใหม่";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูล", fields);
  }

  return {
    reportId: reportId,
    assigneeId: assigneeId,
    version: version,
    note: note
  };
}

function AssignmentService_getAssignableReport_(reportId) {
  const report = SheetRepository_findById_("reports", "report_id", reportId, {
    keyColumnName: "report_id"
  });

  if (!report || Utils_toBoolean_(report.is_deleted)) {
    throw ApiError_("NOT_FOUND", "ไม่พบเรื่องแจ้งนี้");
  }

  if (ReportService_isClosedStatus_(report.status)) {
    throw ApiError_("REPORT_CLOSED", "เรื่องนี้ปิดแล้ว ไม่สามารถมอบหมายงานได้");
  }

  return report;
}

function AssignmentService_getActiveOfficer_(userId) {
  const user = SheetRepository_findById_("users", "user_id", userId, {
    keyColumnName: "user_id",
    includeDeleted: true
  });

  if (!user || !UserService_isActive_(user) || Utils_normalizeString_(user.role).toLowerCase() !== "officer") {
    throw ApiError_("VALIDATION_ERROR", "เลือกได้เฉพาะเจ้าหน้าที่ที่เปิดใช้งานอยู่", {
      assigneeId: "เลือกได้เฉพาะเจ้าหน้าที่ที่เปิดใช้งานอยู่"
    });
  }

  return user;
}

function AssignmentService_resolveTargetDueAt_(report, nowIso) {
  const existingDueAt = Utils_normalizeString_(report && report.target_due_at);

  if (existingDueAt) {
    return existingDueAt;
  }

  const category = SheetRepository_findById_("categories", "category_id", report.category_id, {
    keyColumnName: "category_id"
  });

  return ReportService_calculateTargetDueAt_(nowIso, category && category.target_days);
}

function AssignmentService_getNextReportStatus_(status) {
  const normalized = Utils_normalizeString_(status).toLowerCase();

  if (!normalized || normalized === "new") {
    return "assigned";
  }

  return normalized;
}

function AssignmentService_updateReportAssignment_(report, updates) {
  return SheetRepository_updateById_("reports", "report_id", report.report_id, {
    assigned_to: updates.assigneeId,
    status: updates.status,
    target_due_at: updates.targetDueAt
  }, {
    userId: updates.actorUserId,
    expectedVersion: updates.expectedVersion
  });
}

function AssignmentService_closeOpenAssignments_(reportId, nowIso, userId) {
  AssignmentService_findOpenAssignments_(reportId).forEach(function (assignment) {
    SheetRepository_updateById_("assignments", "assignment_id", assignment.assignment_id, {
      unassigned_at: nowIso,
      assignment_status: ASSIGNMENT_REASSIGNED_STATUS_
    }, {
      userId: userId
    });
  });
}

function AssignmentService_findOpenAssignments_(reportId) {
  return SheetRepository_list_("assignments", {
    keyColumnName: "assignment_id",
    page: 1,
    pageSize: 100
  }).items.filter(function (assignment) {
    return String(assignment.report_id || "") === String(reportId || "") &&
      AssignmentService_isOpenAssignment_(assignment);
  });
}

function AssignmentService_isOpenAssignment_(assignment) {
  const status = Utils_normalizeString_(assignment && assignment.assignment_status).toLowerCase();

  return !Utils_toBoolean_(assignment && assignment.is_deleted) &&
    !assignment.completed_at &&
    !assignment.unassigned_at &&
    (!status || status === ASSIGNMENT_ACTIVE_STATUS_);
}

function AssignmentService_createAssignment_(report, details) {
  const record = {
    assignment_id: Utils_createUuid_(),
    report_id: report.report_id,
    assigned_to: details.assigneeId,
    assigned_by: details.assignedBy,
    note: details.note,
    assigned_at: details.assignedAt,
    target_due_at: details.targetDueAt,
    completed_at: "",
    unassigned_at: "",
    assignment_status: ASSIGNMENT_ACTIVE_STATUS_,
    created_at: details.assignedAt,
    version: 1
  };

  SheetRepository_append_("assignments", record, {
    keyColumnName: "assignment_id",
    userId: details.assignedBy
  });

  return record;
}

function AssignmentService_listAssignableOfficers_(permissions) {
  if (!ReportService_hasPermission_(permissions, "report.assign")) {
    return [];
  }

  return AssignmentService_filterAssignableOfficers_(SheetRepository_selectColumns_("users", [
    "user_id",
    "username",
    "display_name",
    "role",
    "status",
    "is_deleted"
  ], {
    keyColumnName: "user_id"
  }).objects);
}

function AssignmentService_filterAssignableOfficers_(users) {
  return (users || []).filter(function (user) {
    return UserService_isActive_(user) &&
      Utils_normalizeString_(user.role).toLowerCase() === "officer";
  }).map(AssignmentService_projectAssignableOfficer_);
}

function AssignmentService_projectAssignableOfficer_(user) {
  return {
    userId: String(user.user_id || ""),
    displayName: Security_sanitizeText_(user.display_name || user.username || ""),
    role: "officer"
  };
}

function AssignmentService_listByReport_(reportId, userMap, permissions) {
  const safeUserMap = userMap || {};
  const canViewInternal = ReportService_canViewInternalNotes_(permissions);

  return SheetRepository_list_("assignments", {
    keyColumnName: "assignment_id",
    page: 1,
    pageSize: 100
  }).items.filter(function (assignment) {
    return String(assignment.report_id || "") === String(reportId || "");
  }).sort(function (left, right) {
    return String(left.assigned_at || left.created_at || "").localeCompare(String(right.assigned_at || right.created_at || ""));
  }).map(function (assignment) {
    const assignedToId = String(assignment.assigned_to || "");
    const assignedById = String(assignment.assigned_by || "");
    const assignedTo = assignedToId && safeUserMap[assignedToId] ? safeUserMap[assignedToId] : null;
    const assignedBy = assignedById && safeUserMap[assignedById] ? safeUserMap[assignedById] : null;

    return {
      assignmentId: String(assignment.assignment_id || ""),
      reportId: String(assignment.report_id || ""),
      assignedTo: assignedToId,
      assignedToName: assignedTo ? assignedTo.displayName : "",
      assignedBy: assignedById,
      assignedByName: assignedBy ? assignedBy.displayName : "",
      note: canViewInternal ? Security_sanitizeText_(assignment.note || "") : "",
      assignedAt: String(assignment.assigned_at || ""),
      targetDueAt: String(assignment.target_due_at || ""),
      completedAt: String(assignment.completed_at || ""),
      unassignedAt: String(assignment.unassigned_at || ""),
      assignmentStatus: Security_sanitizeText_(assignment.assignment_status || ""),
      createdAt: String(assignment.created_at || ""),
      version: Number(assignment.version || 0)
    };
  });
}
