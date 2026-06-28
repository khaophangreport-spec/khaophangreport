const REPORT_PRIORITY_VALUES_ = Object.freeze(["low", "normal", "high", "critical"]);
const REPORT_CONTACT_METHOD_VALUES_ = Object.freeze(["phone", "email", "none"]);
const REPORT_CREATE_RATE_LIMIT_ = Object.freeze({
  limit: 5,
  windowSeconds: 10 * 60
});
const REPORT_TRACK_RATE_LIMIT_ = Object.freeze({
  limit: 30,
  windowSeconds: 10 * 60
});
const REPORT_ADD_INFO_RATE_LIMIT_ = Object.freeze({
  limit: 10,
  windowSeconds: 10 * 60
});
const REPORT_ADMIN_LIST_COLUMNS_ = Object.freeze([
  "report_id",
  "tracking_code",
  "category_id",
  "title",
  "incident_date",
  "location_name",
  "village_no",
  "landmark",
  "priority_reported",
  "priority",
  "status",
  "assigned_to",
  "target_due_at",
  "created_at",
  "updated_at",
  "resolved_at",
  "closed_at",
  "version",
  "search_text",
  "is_deleted"
]);
const REPORT_ADMIN_LIST_SORT_COLUMNS_ = Object.freeze({
  created_at: "created_at",
  updated_at: "updated_at",
  priority: "priority",
  status: "status",
  target_due_at: "target_due_at"
});
const REPORT_ADMIN_LIST_STATUS_VALUES_ = Object.freeze([
  "new",
  "reviewing",
  "accepted",
  "assigned",
  "in_progress",
  "waiting",
  "waiting_info",
  "resolved",
  "closed",
  "rejected",
  "duplicate"
]);
const REPORT_STATUS_VALUES_ = Object.freeze(["new", "reviewing", "assigned", "in_progress", "waiting", "resolved", "closed", "rejected", "duplicate"]);
const REPORT_STATUS_TRANSITIONS_ = Object.freeze({
  new: Object.freeze(["reviewing", "assigned", "waiting", "rejected", "duplicate"]),
  reviewing: Object.freeze(["assigned", "in_progress", "waiting", "rejected", "duplicate"]),
  assigned: Object.freeze(["in_progress", "waiting", "resolved"]),
  in_progress: Object.freeze(["waiting", "resolved"]),
  waiting: Object.freeze(["reviewing", "assigned", "in_progress", "rejected"]),
  resolved: Object.freeze(["closed", "in_progress"]),
  closed: Object.freeze([]),
  rejected: Object.freeze(["reviewing"]),
  duplicate: Object.freeze(["reviewing"])
});
const REPORT_CRITICAL_STATUS_VALUES_ = Object.freeze(["closed", "rejected", "duplicate"]);
const REPORT_ADMIN_CLOSED_STATUS_VALUES_ = Object.freeze(["resolved", "closed", "rejected", "duplicate"]);
const REPORT_ADMIN_PRIORITY_ORDER_ = Object.freeze({
  low: 1,
  normal: 2,
  high: 3,
  critical: 4
});

function ReportService_create(request) {
  const lock = LockService.getScriptLock();
  const requestId = Utils_normalizeString_(request && request.requestId);

  if (!requestId) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาระบุ Request ID", {
      requestId: "จำเป็นสำหรับการส่งเรื่อง"
    });
  }

  lock.waitLock(30000);

  let createdReportId = "";
  let createdUpdateId = "";
  let createdAttachmentIds = [];
  let uploadedFileIds = [];

  try {
    ReportService_checkRateLimit_(request);
    ReportService_assertNotDuplicateRequest_(requestId);

    const context = ReportService_validateCreateRequest_(request);
    const now = Utils_nowIso_();
    const reportId = Utils_createUuid_();
    const updateId = Utils_createUuid_();
    const trackingCode = ReportService_generateUniqueTrackingCode_(now);
    const report = ReportService_buildReportRecord_(context, {
      reportId: reportId,
      trackingCode: trackingCode,
      requestId: requestId,
      createdAt: now
    });

    SheetRepository_append_("reports", report, {
      keyColumnName: "report_id",
      userId: "public"
    });
    createdReportId = reportId;

    const attachmentResult = AttachmentService_uploadReportAttachments_(reportId, updateId, context.attachments, now);
    uploadedFileIds = attachmentResult.uploadedFileIds;
    createdAttachmentIds = attachmentResult.records.map(function (record) {
      return record.attachment_id;
    });

    ReportService_createInitialTimeline_(report, updateId, attachmentResult.records.length, now);
    createdUpdateId = updateId;
    AuditService_logReportCreated_(report, attachmentResult.records.length, requestId);
    ReportService_clearDashboardCacheSafe_("report.create", requestId);

    return {
      data: {
        trackingCode: trackingCode,
        createdAt: now,
        status: "new"
      },
      message: "ส่งเรื่องเรียบร้อยแล้ว"
    };
  } catch (error) {
    ReportService_compensateCreateFailure_(createdReportId, createdUpdateId, createdAttachmentIds, uploadedFileIds, requestId, error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function ReportService_track(request) {
  const trackingCode = ReportService_normalizeTrackingCode_(
    request && request.data ? request.data.trackingCode : ""
  );

  if (!ReportService_isTrackingCodeFormatValid_(trackingCode)) {
    ReportService_throwTrackNotFound_();
  }

  ReportService_checkTrackRateLimit_(trackingCode);

  const report = SheetRepository_findOne_("reports", {
    tracking_code: trackingCode
  }, {
    keyColumnName: "report_id"
  });

  if (!report || Utils_toBoolean_(report.is_deleted)) {
    ReportService_throwTrackNotFound_();
  }

  const category = CategoryService_getPublicById_(report.category_id);
  const attachments = AttachmentService_listPublicByReport_(report.report_id);
  const timeline = ReportService_listPublicTimeline_(report.report_id, attachments);

  return {
    data: ReportService_projectPublicTrack_(report, category, timeline, attachments),
    message: "พบข้อมูลเรื่องแจ้ง"
  };
}

function ReportService_addInfo(request) {
  const lock = LockService.getScriptLock();
  const requestId = Utils_normalizeString_(request && request.requestId);

  if (!requestId) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาระบุ Request ID", {
      requestId: "จำเป็นสำหรับการส่งข้อมูลเพิ่มเติม"
    });
  }

  lock.waitLock(30000);

  let createdAdditionalInfoId = "";
  let createdUpdateId = "";
  let createdAttachmentIds = [];
  let uploadedFileIds = [];

  try {
    ReportService_checkAddInfoRateLimit_(request);
    ReportService_assertAddInfoNotDuplicateRequest_(requestId);

    const context = ReportService_validateAddInfoRequest_(request);
    const now = Utils_nowIso_();
    const additionalInfoId = Utils_createUuid_();
    const updateId = Utils_createUuid_();
    const additionalInfo = ReportService_buildAdditionalInfoRecord_(context, {
      additionalInfoId: additionalInfoId,
      requestId: requestId,
      createdAt: now
    });

    SheetRepository_append_("report_additional_info", additionalInfo, {
      keyColumnName: "additional_info_id",
      userId: "public"
    });
    createdAdditionalInfoId = additionalInfoId;

    const attachmentResult = AttachmentService_uploadAdditionalInfoAttachments_(
      context.report.report_id,
      additionalInfoId,
      updateId,
      context.attachments,
      now
    );
    uploadedFileIds = attachmentResult.uploadedFileIds;
    createdAttachmentIds = attachmentResult.records.map(function (record) {
      return record.attachment_id;
    });

    ReportService_createAdditionalInfoTimeline_(context.report, updateId, attachmentResult.records.length, now);
    createdUpdateId = updateId;
    AuditService_logAdditionalInfoCreated_(context.report, additionalInfo, attachmentResult.records.length, requestId);
    ReportService_clearDashboardCacheSafe_("report.addInfo", requestId);

    return {
      data: {
        additionalInfoId: additionalInfoId,
        createdAt: now,
        reviewStatus: "pending"
      },
      message: "ส่งข้อมูลเพิ่มเติมเรียบร้อยแล้ว"
    };
  } catch (error) {
    ReportService_compensateAddInfoFailure_(createdAdditionalInfoId, createdUpdateId, createdAttachmentIds, uploadedFileIds, requestId, error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function ReportService_listAdmin(request) {
  const context = ReportService_requireAdminListContext_(request);
  const query = ReportService_normalizeAdminListQuery_(request && request.data, context);
  const reports = ReportService_readAdminListRows_();
  const categories = ReportService_readAdminListCategories_();
  const users = ReportService_readAdminListUsers_();
  const categoryMap = ReportService_buildAdminCategoryMap_(categories);
  const userMap = ReportService_buildAdminUserMap_(users);
  const now = new Date();
  const filteredReports = ReportService_filterAdminReports_(reports, query, context);
  const sortedReports = ReportService_sortAdminReports_(filteredReports, query.sortBy, query.sortDirection);
  const page = SheetRepository_paginate_(sortedReports, query.page, query.pageSize);

  return {
    data: {
      items: page.items.map(function (report) {
        return ReportService_projectAdminListReport_(report, categoryMap, userMap, now);
      }),
      pagination: page.pagination,
      filters: {
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        status: query.status,
        categoryId: query.categoryId,
        priority: query.priority,
        assigneeId: query.assigneeId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        scope: query.scope,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection
      },
      permissions: ReportService_buildAdminListPermissions_(context.permissions)
    },
    message: "โหลดรายการเรื่องแจ้งสำเร็จ"
  };
}

function ReportService_detailAdmin(request) {
  const context = ReportService_requireAdminListContext_(request);
  const data = request && Utils_isPlainObject_(request.data) ? request.data : {};
  const reportId = Utils_normalizeString_(data.reportId);

  if (!reportId) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาระบุเรื่องที่ต้องการดู", {
      reportId: "จำเป็นสำหรับการดูรายละเอียดเรื่องแจ้ง"
    });
  }

  const report = SheetRepository_findById_("reports", "report_id", reportId, {
    keyColumnName: "report_id"
  });

  if (!report || Utils_toBoolean_(report.is_deleted)) {
    throw ApiError_("NOT_FOUND", "ไม่พบเรื่องแจ้งนี้");
  }

  ReportService_assertAdminReportAccess_(report, context);

  const categoryMap = ReportService_buildAdminCategoryMap_(ReportService_readAdminListCategories_());
  const userMap = ReportService_buildAdminUserMap_(ReportService_readAdminListUsers_());
  const permissions = ReportService_buildAdminDetailPermissions_(context.permissions);
  const attachments = AttachmentService_listAdminByReport_(report.report_id);
  const timeline = ReportService_listAdminTimeline_(report.report_id, attachments, context.permissions);
  const assignments = AssignmentService_listByReport_(report.report_id, userMap, context.permissions);
  const additionalInfo = ReportService_listAdminAdditionalInfo_(report.report_id, attachments, context.permissions);

  return {
    data: {
      report: ReportService_projectAdminDetailReport_(report, categoryMap, userMap, context.permissions),
      timeline: timeline,
      attachments: attachments,
      assignments: assignments,
      additionalInfo: additionalInfo,
      eligibleOfficers: AssignmentService_listAssignableOfficers_(context.permissions),
      permissions: permissions
    },
    message: "โหลดรายละเอียดเรื่องสำเร็จ"
  };
}

function ReportService_updateStatus(request) {
  const lock = LockService.getScriptLock();
  const context = ReportService_requireAdminListContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  ReportService_assertPermission_(context.permissions, "report.update", "ไม่มีสิทธิ์เปลี่ยนสถานะเรื่องแจ้ง");
  lock.waitLock(30000);

  try {
    const payload = ReportService_normalizeUpdateStatusPayload_(request && request.data);
    const report = SheetRepository_findById_("reports", "report_id", payload.reportId, {
      keyColumnName: "report_id"
    });

    if (!report || Utils_toBoolean_(report.is_deleted)) {
      throw ApiError_("NOT_FOUND", "ไม่พบเรื่องแจ้งนี้");
    }

    ReportService_assertAdminReportAccess_(report, context);
    ReportService_validateStatusTransition_(report, payload, context.permissions);

    const now = Utils_nowIso_();
    const updates = ReportService_buildStatusUpdateFields_(report, payload, context.user, now);
    const updatedReport = SheetRepository_updateById_("reports", "report_id", report.report_id, updates, {
      userId: context.user.user_id,
      expectedVersion: payload.version
    });

    ReportService_createStatusTimeline_(report, updatedReport, payload, context.user, now);
    AuditService_logReportStatusUpdated_(report, updatedReport, payload, context.user, requestId);
    ReportService_clearDashboardCacheSafe_("admin.report.updateStatus", requestId);

    return {
      data: {
        reportId: String(updatedReport.report_id || ""),
        oldStatus: String(report.status || ""),
        newStatus: String(updatedReport.status || ""),
        updatedAt: now,
        version: Number(updatedReport.version || 0)
      },
      message: "อัปเดตสถานะเรื่องแจ้งสำเร็จ"
    };
  } finally {
    lock.releaseLock();
  }
}

function ReportService_updatePriority(request) {
  const lock = LockService.getScriptLock();
  const context = ReportService_requireAdminListContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  ReportService_assertPermission_(context.permissions, "report.update", "ไม่มีสิทธิ์ปรับความสำคัญเรื่องแจ้ง");
  lock.waitLock(30000);

  try {
    const payload = ReportService_normalizeUpdatePriorityPayload_(request && request.data);
    const report = SheetRepository_findById_("reports", "report_id", payload.reportId, {
      keyColumnName: "report_id"
    });

    if (!report || Utils_toBoolean_(report.is_deleted)) {
      throw ApiError_("NOT_FOUND", "ไม่พบเรื่องแจ้งนี้");
    }

    ReportService_assertAdminReportAccess_(report, context);
    ReportService_validatePriorityChange_(report, payload);

    const now = Utils_nowIso_();
    const updatedReport = SheetRepository_updateById_("reports", "report_id", report.report_id, {
      priority: payload.priority,
      updated_at: now,
      updated_by: context.user.user_id
    }, {
      userId: context.user.user_id,
      expectedVersion: payload.version
    });

    ReportService_createPriorityTimeline_(report, updatedReport, payload, context.user, now);
    AuditService_logReportPriorityUpdated_(report, updatedReport, payload, context.user, requestId);
    ReportService_clearDashboardCacheSafe_("admin.report.updatePriority", requestId);

    return {
      data: {
        reportId: String(updatedReport.report_id || ""),
        oldPriority: String(report.priority || ""),
        newPriority: String(updatedReport.priority || ""),
        updatedAt: now,
        version: Number(updatedReport.version || 0)
      },
      message: "ปรับความสำคัญเรื่องแจ้งสำเร็จ"
    };
  } finally {
    lock.releaseLock();
  }
}

function ReportService_addUpdate(request) {
  const lock = LockService.getScriptLock();
  const context = ReportService_requireAdminListContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  ReportService_assertPermission_(context.permissions, "report.update", "à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸´à¸—à¸˜à¸´à¹Œà¹€à¸žà¸´à¹ˆà¸¡à¸­à¸±à¸›à¹€à¸”à¸•à¹€à¸£à¸·à¹ˆà¸­à¸‡à¹à¸ˆà¹‰à¸‡");
  lock.waitLock(30000);

  let createdUpdateId = "";
  let createdAttachmentIds = [];
  let uploadedFileIds = [];

  try {
    const payload = ReportService_normalizeAddUpdatePayload_(request && request.data);
    const report = SheetRepository_findById_("reports", "report_id", payload.reportId, {
      keyColumnName: "report_id"
    });

    if (!report || Utils_toBoolean_(report.is_deleted)) {
      throw ApiError_("NOT_FOUND", "à¹„à¸¡à¹ˆà¸žà¸šà¹€à¸£à¸·à¹ˆà¸­à¸‡à¹à¸ˆà¹‰à¸‡à¸™à¸µà¹‰");
    }

    ReportService_assertAdminReportAccess_(report, context);

    const updateId = Utils_createUuid_();
    const now = Utils_nowIso_();

    SheetRepository_assertVersion_(report.version, payload.version);

    const attachmentResult = AttachmentService_uploadAdminUpdateAttachments_(
      report.report_id,
      updateId,
      payload.attachments,
      context.user,
      now
    );
    uploadedFileIds = attachmentResult.uploadedFileIds;
    createdAttachmentIds = attachmentResult.records.map(function (record) {
      return record.attachment_id;
    });

    const updatedReport = SheetRepository_updateById_("reports", "report_id", report.report_id, {
      updated_at: now,
      updated_by: context.user.user_id
    }, {
      userId: context.user.user_id,
      expectedVersion: payload.version
    });
    const updateRecord = ReportService_createAdminUpdateTimeline_(updatedReport, updateId, payload, context.user, now);
    createdUpdateId = updateId;

    AuditService_logReportUpdateAdded_(updatedReport, updateRecord, attachmentResult.records.length, context.user, requestId);
    ReportService_clearDashboardCacheSafe_("admin.report.addUpdate", requestId);

    return {
      data: {
        reportId: String(updatedReport.report_id || ""),
        updateId: updateId,
        createdAt: now,
        version: Number(updatedReport.version || 0),
        attachmentCount: attachmentResult.records.length
      },
      message: "à¹€à¸žà¸´à¹ˆà¸¡à¸­à¸±à¸›à¹€à¸”à¸•à¹€à¸£à¸·à¹ˆà¸­à¸‡à¹à¸ˆà¹‰à¸‡à¸ªà¸³à¹€à¸£à¹‡à¸ˆ"
    };
  } catch (error) {
    ReportService_compensateAdminUpdateFailure_(createdUpdateId, createdAttachmentIds, uploadedFileIds);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function ReportService_requireAdminListContext_(request) {
  const sessionContext = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const user = sessionContext.user;
  const permissions = UserService_getPermissions_(user.role);

  ReportService_assertPermission_(permissions, "report.read", "ไม่มีสิทธิ์ดูรายการเรื่องแจ้ง");

  return {
    user: user,
    permissions: permissions
  };
}

function ReportService_hasPermission_(permissions, permission) {
  const safePermissions = permissions || [];

  return safePermissions.indexOf("admin.full") !== -1 || safePermissions.indexOf(permission) !== -1;
}

function ReportService_assertPermission_(permissions, permission, message) {
  if (!ReportService_hasPermission_(permissions, permission)) {
    throw ApiError_("FORBIDDEN", message || "ไม่มีสิทธิ์ดำเนินการ");
  }
}

function ReportService_assertAdminReportAccess_(report, context) {
  const user = context && context.user ? context.user : {};
  const role = Utils_normalizeString_(user.role).toLowerCase();

  if (role === "officer" &&
      !ReportService_hasPermission_(context.permissions, "admin.full") &&
      String(report.assigned_to || "") !== String(user.user_id || "")) {
    throw ApiError_("FORBIDDEN", "ไม่มีสิทธิ์ดูรายละเอียดเรื่องนี้");
  }
}

function ReportService_normalizeUpdateStatusPayload_(data) {
  const safeData = Utils_isPlainObject_(data) ? data : {};
  const fields = {};
  const payload = {
    reportId: Utils_normalizeString_(safeData.reportId),
    version: safeData.version,
    newStatus: Utils_normalizeString_(safeData.newStatus).toLowerCase(),
    publicMessage: Security_sanitizeUserText_(safeData.publicMessage, 1000),
    internalNote: Security_sanitizeUserText_(safeData.internalNote, 2000),
    result: Security_sanitizeUserText_(safeData.result, 2000),
    rejectionReason: Security_sanitizeUserText_(safeData.rejectionReason, 1000),
    duplicateOfReportId: Utils_normalizeString_(safeData.duplicateOfReportId || safeData.duplicateReportId),
    duplicateReason: Security_sanitizeUserText_(safeData.duplicateReason || safeData.reason, 1000),
    reason: Security_sanitizeUserText_(safeData.reason, 1000),
    confirmed: Utils_toBoolean_(safeData.confirmed)
  };

  if (!payload.reportId) {
    fields.reportId = "กรุณาระบุเรื่องแจ้ง";
  }

  if (payload.version === undefined || payload.version === null || payload.version === "") {
    fields.version = "กรุณาระบุ Version ปัจจุบัน";
  }

  if (!payload.newStatus || REPORT_STATUS_VALUES_.indexOf(payload.newStatus) === -1) {
    fields.newStatus = "สถานะใหม่ไม่ถูกต้อง";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูลการเปลี่ยนสถานะ", fields);
  }

  return payload;
}

function ReportService_normalizeUpdatePriorityPayload_(data) {
  const safeData = Utils_isPlainObject_(data) ? data : {};
  const fields = {};
  const payload = {
    reportId: Utils_normalizeString_(safeData.reportId),
    version: safeData.version,
    priority: Utils_normalizeString_(safeData.priority || safeData.newPriority).toLowerCase(),
    note: Security_sanitizeUserText_(safeData.note || safeData.internalNote, 1000)
  };

  if (!payload.reportId) {
    fields.reportId = "กรุณาระบุเรื่องแจ้ง";
  }

  if (payload.version === undefined || payload.version === null || payload.version === "") {
    fields.version = "กรุณาระบุ Version ปัจจุบัน";
  }

  if (!payload.priority || REPORT_PRIORITY_VALUES_.indexOf(payload.priority) === -1) {
    fields.priority = "ระดับความสำคัญไม่ถูกต้อง";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูลการปรับความสำคัญ", fields);
  }

  return payload;
}

function ReportService_normalizeAddUpdatePayload_(data) {
  const safeData = Utils_isPlainObject_(data) ? data : {};
  const fields = {};
  const payload = {
    reportId: Utils_normalizeString_(safeData.reportId),
    version: safeData.version,
    publicMessage: Security_sanitizeUserText_(safeData.publicMessage, 1000),
    internalNote: Security_sanitizeUserText_(safeData.internalNote, 2000),
    isPublic: Utils_toBoolean_(safeData.isPublic),
    attachments: AttachmentService_validateCreatePayload_(safeData.attachments || [], fields, {})
  };

  if (!payload.reportId) {
    fields.reportId = "à¸à¸£à¸¸à¸“à¸²à¸£à¸°à¸šà¸¸à¹€à¸£à¸·à¹ˆà¸­à¸‡à¹à¸ˆà¹‰à¸‡";
  }

  if (payload.version === undefined || payload.version === null || payload.version === "") {
    fields.version = "à¸à¸£à¸¸à¸“à¸²à¸£à¸°à¸šà¸¸ Version à¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™";
  }

  if (!payload.publicMessage && !payload.internalNote) {
    fields.update = "à¸à¸£à¸¸à¸“à¸²à¸£à¸°à¸šà¸¸ Public Message à¸«à¸£à¸·à¸­ Internal Note";
  }

  payload.attachments = payload.attachments.map(function (attachment, index) {
    const source = Array.isArray(safeData.attachments) && Utils_isPlainObject_(safeData.attachments[index]) ? safeData.attachments[index] : {};

    attachment.isPublic = payload.isPublic && Utils_toBoolean_(source.isPublic);
    attachment.fileRole = ReportService_normalizeAttachmentFileRole_(source.fileRole);
    return attachment;
  });

  const publicAttachmentCount = payload.attachments.filter(function (attachment) {
    return Utils_toBoolean_(attachment.isPublic);
  }).length;

  if (payload.isPublic && !payload.publicMessage && publicAttachmentCount === 0) {
    fields.publicMessage = "à¸­à¸±à¸›à¹€à¸”à¸•à¸ªà¸²à¸˜à¸²à¸£à¸“à¸°à¸•à¹‰à¸­à¸‡à¸¡à¸µà¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸«à¸£à¸·à¸­à¹„à¸Ÿà¸¥à¹Œà¸ªà¸²à¸˜à¸²à¸£à¸“à¸°";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "à¸à¸£à¸¸à¸“à¸²à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸à¹ˆà¸­à¸™à¸šà¸±à¸™à¸—à¸¶à¸", fields);
  }

  return payload;
}

function ReportService_normalizeAttachmentFileRole_(value) {
  const role = Utils_normalizeString_(value || "progress").toLowerCase();
  const allowedRoles = ["report", "progress", "resolved", "additional", "announcement"];

  return allowedRoles.indexOf(role) === -1 ? "progress" : role;
}

function ReportService_validateStatusTransition_(report, payload, permissions) {
  const fields = {};
  const oldStatus = Utils_normalizeString_(report && report.status).toLowerCase();
  const newStatus = payload.newStatus;

  if (!ReportService_isStatusTransitionAllowed_(oldStatus, newStatus, permissions)) {
    throw ApiError_("INVALID_STATUS_TRANSITION", "ไม่สามารถเปลี่ยนสถานะตามที่เลือกได้", {
      newStatus: "สถานะนี้ไม่สามารถเปลี่ยนจากสถานะปัจจุบันได้"
    });
  }

  ReportService_validateStatusRequiredFields_(oldStatus, payload, fields);

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณากรอกข้อมูลที่จำเป็นสำหรับสถานะนี้", fields);
  }
}

function ReportService_validatePriorityChange_(report, payload) {
  const fields = {};
  const oldPriority = Utils_normalizeString_(report && report.priority).toLowerCase() || "normal";

  if (oldPriority === payload.priority) {
    fields.priority = "ระดับความสำคัญยังเป็นค่าเดิม";
  }

  if (ReportService_requiresPriorityIncreaseNote_(oldPriority, payload.priority) && !payload.note) {
    fields.note = "กรุณาระบุหมายเหตุเมื่อปรับความสำคัญขึ้นเป็นสูงหรือวิกฤต";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูลการปรับความสำคัญ", fields);
  }
}

function ReportService_requiresPriorityIncreaseNote_(oldPriority, newPriority) {
  const oldRank = ReportService_getPriorityRank_(oldPriority);
  const newRank = ReportService_getPriorityRank_(newPriority);

  return (newPriority === "high" || newPriority === "critical") && newRank > oldRank;
}

function ReportService_getPriorityRank_(priority) {
  return Number(REPORT_ADMIN_PRIORITY_ORDER_[Utils_normalizeString_(priority).toLowerCase()] || 0);
}

function ReportService_isStatusTransitionAllowed_(oldStatus, newStatus, permissions) {
  const fromStatus = Utils_normalizeString_(oldStatus).toLowerCase();
  const toStatus = Utils_normalizeString_(newStatus).toLowerCase();
  const allowed = REPORT_STATUS_TRANSITIONS_[fromStatus] || Object.freeze([]);

  if (!fromStatus || !toStatus || fromStatus === toStatus || allowed.indexOf(toStatus) === -1) {
    return false;
  }

  if ((fromStatus === "rejected" || fromStatus === "duplicate") && toStatus === "reviewing") {
    return ReportService_hasPermission_(permissions, "report.assign");
  }

  return true;
}

function ReportService_validateStatusRequiredFields_(oldStatus, payload, fields) {
  if (payload.newStatus === "waiting" && !payload.publicMessage) {
    fields.publicMessage = "กรุณาระบุข้อความที่ประชาชนเห็นได้";
  }

  if (payload.newStatus === "resolved" && !payload.result) {
    fields.result = "กรุณาระบุผลการดำเนินการ";
  }

  if (payload.newStatus === "rejected" && !payload.rejectionReason) {
    fields.rejectionReason = "กรุณาระบุเหตุผลการปฏิเสธ";
  }

  if (payload.newStatus === "duplicate" && !payload.duplicateOfReportId && !payload.duplicateReason) {
    fields.duplicate = "กรุณาระบุเรื่องอ้างอิงหรือเหตุผลว่าเป็นเรื่องซ้ำ";
  }

  if (ReportService_isReopenTransition_(oldStatus, payload.newStatus) && !payload.reason) {
    fields.reason = "กรุณาระบุเหตุผลการเปิดกลับมาดำเนินการ";
  }

  if (ReportService_isCriticalStatus_(payload.newStatus) && !payload.confirmed) {
    fields.confirmed = "กรุณายืนยันก่อนเปลี่ยนเป็นสถานะสำคัญ";
  }
}

function ReportService_isCriticalStatus_(status) {
  return REPORT_CRITICAL_STATUS_VALUES_.indexOf(Utils_normalizeString_(status).toLowerCase()) !== -1;
}

function ReportService_isReopenTransition_(oldStatus, newStatus) {
  const fromStatus = Utils_normalizeString_(oldStatus).toLowerCase();
  const toStatus = Utils_normalizeString_(newStatus).toLowerCase();

  return (fromStatus === "resolved" && toStatus === "in_progress") ||
    ((fromStatus === "rejected" || fromStatus === "duplicate") && toStatus === "reviewing");
}

function ReportService_buildStatusUpdateFields_(report, payload, actor, updatedAt) {
  const oldStatus = Utils_normalizeString_(report && report.status).toLowerCase();
  const updates = {
    status: payload.newStatus,
    updated_at: updatedAt,
    updated_by: actor && actor.user_id ? actor.user_id : "system"
  };

  if (payload.newStatus === "resolved") {
    updates.public_result = payload.result;
    updates.resolved_at = updatedAt;
  }

  if (payload.newStatus === "closed") {
    updates.closed_at = updatedAt;
  }

  if (payload.newStatus === "rejected") {
    updates.rejected_at = updatedAt;
    updates.rejection_reason = payload.rejectionReason;
  }

  if (payload.newStatus === "duplicate") {
    updates.duplicate_of_report_id = payload.duplicateOfReportId || "";
    if (payload.duplicateReason) {
      updates.rejection_reason = payload.duplicateReason;
    }
  }

  if (oldStatus === "resolved" && payload.newStatus === "in_progress") {
    updates.resolved_at = "";
  }

  if (oldStatus === "rejected" && payload.newStatus === "reviewing") {
    updates.rejected_at = "";
    updates.rejection_reason = "";
  }

  if (oldStatus === "duplicate" && payload.newStatus === "reviewing") {
    updates.duplicate_of_report_id = "";
  }

  return updates;
}

function ReportService_canViewReporterPii_(permissions) {
  return ReportService_hasPermission_(permissions, "report.view_pii") ||
    ReportService_hasPermission_(permissions, "report.update") ||
    ReportService_hasPermission_(permissions, "report.assign");
}

function ReportService_canViewInternalNotes_(permissions) {
  return ReportService_hasPermission_(permissions, "report.view_internal_notes") ||
    ReportService_hasPermission_(permissions, "report.update") ||
    ReportService_hasPermission_(permissions, "report.assign");
}

function ReportService_normalizeAdminListQuery_(data, context) {
  const safeData = Utils_isPlainObject_(data) ? data : {};
  const fields = {};
  const role = Utils_normalizeString_(context && context.user ? context.user.role : "").toLowerCase();
  let scope = Utils_normalizeString_(safeData.scope || (role === "officer" ? "mine" : "global")).toLowerCase();
  let sortBy = Utils_normalizeString_(safeData.sortBy || "created_at").toLowerCase();
  const sortDirection = Utils_normalizeString_(safeData.sortDirection || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const status = Utils_normalizeString_(safeData.status).toLowerCase();
  const priority = Utils_normalizeString_(safeData.priority).toLowerCase();
  const keyword = Security_sanitizeUserText_(safeData.keyword, 120).toLowerCase();

  if (scope !== "global" && scope !== "mine") {
    fields.scope = "รองรับเฉพาะ global หรือ mine";
  }

  if (role === "officer" && scope === "global" && !ReportService_hasPermission_(context.permissions, "admin.full")) {
    scope = "mine";
  }

  if (!REPORT_ADMIN_LIST_SORT_COLUMNS_[sortBy]) {
    fields.sortBy = "Sort field ไม่อยู่ในรายการที่อนุญาต";
    sortBy = "created_at";
  }

  if (status && REPORT_ADMIN_LIST_STATUS_VALUES_.indexOf(status) === -1) {
    fields.status = "สถานะไม่ถูกต้อง";
  }

  if (priority && REPORT_PRIORITY_VALUES_.indexOf(priority) === -1) {
    fields.priority = "ระดับความสำคัญไม่ถูกต้อง";
  }

  ReportService_validateAdminDateRange_(safeData.dateFrom, safeData.dateTo, fields);

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบตัวกรอง", fields);
  }

  return {
    page: Utils_clampInteger_(safeData.page, 1, 1, 1000000),
    pageSize: Utils_clampInteger_(safeData.pageSize, 20, 1, 100),
    keyword: keyword,
    status: status,
    categoryId: Utils_normalizeString_(safeData.categoryId),
    priority: priority,
    assigneeId: Utils_normalizeString_(safeData.assigneeId),
    dateFrom: Utils_normalizeString_(safeData.dateFrom),
    dateTo: Utils_normalizeString_(safeData.dateTo),
    scope: scope,
    sortBy: sortBy,
    sortDirection: sortDirection
  };
}

function ReportService_validateAdminDateRange_(dateFrom, dateTo, fields) {
  const fromText = Utils_normalizeString_(dateFrom);
  const toText = Utils_normalizeString_(dateTo);

  if (fromText && !/^\d{4}-\d{2}-\d{2}$/.test(fromText)) {
    fields.dateFrom = "รูปแบบวันที่เริ่มต้นไม่ถูกต้อง";
  }

  if (toText && !/^\d{4}-\d{2}-\d{2}$/.test(toText)) {
    fields.dateTo = "รูปแบบวันที่สิ้นสุดไม่ถูกต้อง";
  }

  if (fromText && toText && !fields.dateFrom && !fields.dateTo && fromText > toText) {
    fields.dateTo = "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น";
  }
}

function ReportService_readAdminListRows_() {
  return SheetRepository_selectColumns_("reports", REPORT_ADMIN_LIST_COLUMNS_, {
    keyColumnName: "report_id"
  }).objects;
}

function ReportService_readAdminListCategories_() {
  return SheetRepository_selectColumns_("categories", [
    "category_id",
    "code",
    "name",
    "icon",
    "color",
    "is_deleted"
  ], {
    keyColumnName: "category_id"
  }).objects;
}

function ReportService_readAdminListUsers_() {
  return SheetRepository_selectColumns_("users", [
    "user_id",
    "display_name",
    "role",
    "status",
    "is_deleted"
  ], {
    keyColumnName: "user_id"
  }).objects;
}

function ReportService_filterAdminReports_(reports, query, context) {
  const safeQuery = query || {};
  const userId = String(context && context.user ? context.user.user_id : "");
  const keyword = Utils_normalizeString_(safeQuery.keyword).toLowerCase();

  return (reports || []).filter(function (report) {
    if (Utils_toBoolean_(report.is_deleted)) {
      return false;
    }

    if (safeQuery.scope === "mine" && String(report.assigned_to || "") !== userId) {
      return false;
    }

    if (safeQuery.status && Utils_normalizeString_(report.status).toLowerCase() !== safeQuery.status) {
      return false;
    }

    if (safeQuery.categoryId && String(report.category_id || "") !== String(safeQuery.categoryId)) {
      return false;
    }

    if (safeQuery.priority && Utils_normalizeString_(report.priority).toLowerCase() !== safeQuery.priority) {
      return false;
    }

    if (safeQuery.assigneeId && String(report.assigned_to || "") !== String(safeQuery.assigneeId)) {
      return false;
    }

    if (!ReportService_isAdminReportInDateRange_(report, safeQuery.dateFrom, safeQuery.dateTo)) {
      return false;
    }

    if (keyword && !ReportService_adminReportMatchesKeyword_(report, keyword)) {
      return false;
    }

    return true;
  });
}

function ReportService_adminReportMatchesKeyword_(report, keyword) {
  const haystack = [
    report.search_text,
    report.tracking_code,
    report.title,
    report.location_name,
    report.landmark,
    report.village_no
  ].map(function (value) {
    return Utils_normalizeString_(value).toLowerCase();
  }).join(" ");

  return haystack.indexOf(keyword) !== -1;
}

function ReportService_isAdminReportInDateRange_(report, dateFrom, dateTo) {
  const createdAt = Utils_normalizeString_(report && report.created_at);
  const createdDate = createdAt ? createdAt.slice(0, 10) : "";

  if (dateFrom && (!createdDate || createdDate < dateFrom)) {
    return false;
  }

  if (dateTo && (!createdDate || createdDate > dateTo)) {
    return false;
  }

  return true;
}

function ReportService_sortAdminReports_(reports, sortBy, sortDirection) {
  const columnName = REPORT_ADMIN_LIST_SORT_COLUMNS_[sortBy] || "created_at";
  const direction = sortDirection === "asc" ? 1 : -1;

  return (reports || []).slice().sort(function (left, right) {
    const leftRaw = Utils_normalizeString_(left[columnName]);
    const rightRaw = Utils_normalizeString_(right[columnName]);

    if (!leftRaw && rightRaw) {
      return 1;
    }

    if (leftRaw && !rightRaw) {
      return -1;
    }

    const compared = ReportService_compareAdminListValues_(left[columnName], right[columnName], columnName);

    if (compared !== 0) {
      return compared * direction;
    }

    return ReportService_compareAdminListValues_(left.created_at, right.created_at, "created_at") * -1;
  });
}

function ReportService_compareAdminListValues_(leftValue, rightValue, columnName) {
  if (columnName === "priority") {
    return Number(REPORT_ADMIN_PRIORITY_ORDER_[Utils_normalizeString_(leftValue).toLowerCase()] || 0) -
      Number(REPORT_ADMIN_PRIORITY_ORDER_[Utils_normalizeString_(rightValue).toLowerCase()] || 0);
  }

  const left = Utils_normalizeString_(leftValue);
  const right = Utils_normalizeString_(rightValue);

  if (!left && right) {
    return 1;
  }

  if (left && !right) {
    return -1;
  }

  if (left === right) {
    return 0;
  }

  return left > right ? 1 : -1;
}

function ReportService_buildAdminCategoryMap_(categories) {
  const map = {};

  (categories || []).forEach(function (category) {
    map[String(category.category_id || "")] = {
      categoryId: String(category.category_id || ""),
      code: Security_sanitizeText_(category.code || ""),
      name: Security_sanitizeText_(category.name || ""),
      icon: Security_sanitizeText_(category.icon || "circle"),
      color: CategoryService_normalizeColor_(category.color || "#287444")
    };
  });

  return map;
}

function ReportService_buildAdminUserMap_(users) {
  const map = {};

  (users || []).forEach(function (user) {
    if (Utils_toBoolean_(user.is_deleted)) {
      return;
    }

    map[String(user.user_id || "")] = {
      userId: String(user.user_id || ""),
      displayName: Security_sanitizeText_(user.display_name || ""),
      role: Security_sanitizeText_(user.role || ""),
      isActive: UserService_isActive_(user)
    };
  });

  return map;
}

function ReportService_projectAdminListReport_(report, categoryMap, userMap, now) {
  const assignedUserId = String(report.assigned_to || "");
  const assignee = assignedUserId && userMap && userMap[assignedUserId] ? userMap[assignedUserId] : null;
  const createdAt = String(report.created_at || "");

  return {
    reportId: String(report.report_id || ""),
    trackingCode: String(report.tracking_code || ""),
    category: ReportService_projectAdminCategory_(report.category_id, categoryMap),
    title: Security_sanitizeText_(report.title || ""),
    incidentDate: String(report.incident_date || ""),
    locationName: Security_sanitizeText_(report.location_name || ""),
    villageNo: Security_sanitizeText_(report.village_no || ""),
    priorityReported: Security_sanitizeText_(report.priority_reported || ""),
    priority: Security_sanitizeText_(report.priority || ""),
    status: Security_sanitizeText_(report.status || ""),
    assigneeId: assignedUserId,
    assigneeName: assignee ? assignee.displayName : "",
    targetDueAt: String(report.target_due_at || ""),
    createdAt: createdAt,
    updatedAt: String(report.updated_at || ""),
    version: Number(report.version || 0),
    isOverdue: ReportService_isReportOverdue_(report, now),
    ageHours: ReportService_calculateAgeHours_(createdAt, now)
  };
}

function ReportService_projectAdminCategory_(categoryId, categoryMap) {
  const id = String(categoryId || "");
  const category = categoryMap && categoryMap[id] ? categoryMap[id] : null;

  return category || {
    categoryId: id,
    code: "",
    name: "",
    icon: "circle",
    color: "#287444"
  };
}

function ReportService_isReportOverdue_(report, now) {
  const status = Utils_normalizeString_(report && report.status).toLowerCase();
  const dueAt = report && report.target_due_at ? new Date(report.target_due_at) : null;
  const nowDate = now || new Date();

  if (!dueAt || isNaN(dueAt.getTime())) {
    return false;
  }

  if (REPORT_ADMIN_CLOSED_STATUS_VALUES_.indexOf(status) !== -1) {
    return false;
  }

  return dueAt.getTime() < nowDate.getTime();
}

function ReportService_calculateAgeHours_(createdAt, now) {
  const createdDate = createdAt ? new Date(createdAt) : null;
  const nowDate = now || new Date();

  if (!createdDate || isNaN(createdDate.getTime())) {
    return 0;
  }

  const hours = (nowDate.getTime() - createdDate.getTime()) / (60 * 60 * 1000);

  return Math.max(Math.round(hours * 100) / 100, 0);
}

function ReportService_buildAdminListPermissions_(permissions) {
  return {
    canRead: ReportService_hasPermission_(permissions, "report.read"),
    canUpdate: ReportService_hasPermission_(permissions, "report.update"),
    canAssign: ReportService_hasPermission_(permissions, "report.assign")
  };
}

function ReportService_buildAdminDetailPermissions_(permissions) {
  return {
    canRead: ReportService_hasPermission_(permissions, "report.read"),
    canUpdate: ReportService_hasPermission_(permissions, "report.update"),
    canUpdatePriority: ReportService_hasPermission_(permissions, "report.update"),
    canAssign: ReportService_hasPermission_(permissions, "report.assign"),
    canViewReporterPii: ReportService_canViewReporterPii_(permissions),
    canViewInternalNotes: ReportService_canViewInternalNotes_(permissions)
  };
}

function ReportService_isClosedStatus_(status) {
  return REPORT_ADMIN_CLOSED_STATUS_VALUES_.indexOf(Utils_normalizeString_(status).toLowerCase()) !== -1;
}

function ReportService_projectAdminDetailReport_(report, categoryMap, userMap, permissions) {
  const assignedUserId = String(report.assigned_to || "");
  const assignee = assignedUserId && userMap && userMap[assignedUserId] ? userMap[assignedUserId] : null;
  const canViewReporterPii = ReportService_canViewReporterPii_(permissions);
  const canViewInternal = ReportService_canViewInternalNotes_(permissions);

  return {
    reportId: String(report.report_id || ""),
    trackingCode: String(report.tracking_code || ""),
    categoryId: String(report.category_id || ""),
    category: ReportService_projectAdminCategory_(report.category_id, categoryMap),
    title: Security_sanitizeText_(report.title || ""),
    description: Security_sanitizeText_(report.description || ""),
    incidentDate: String(report.incident_date || ""),
    location: {
      name: Security_sanitizeText_(report.location_name || ""),
      villageNo: Security_sanitizeText_(report.village_no || ""),
      landmark: Security_sanitizeText_(report.landmark || ""),
      latitude: ReportService_toOptionalNumber_(report.latitude),
      longitude: ReportService_toOptionalNumber_(report.longitude),
      mapUrl: ReportService_sanitizeMapUrl_(report.map_url)
    },
    reporter: ReportService_projectAdminReporter_(report, canViewReporterPii),
    status: Security_sanitizeText_(report.status || ""),
    priorityReported: Security_sanitizeText_(report.priority_reported || ""),
    priority: Security_sanitizeText_(report.priority || ""),
    assignedTo: assignedUserId,
    assigneeName: assignee ? assignee.displayName : "",
    targetDueAt: String(report.target_due_at || ""),
    publicResult: Security_sanitizeText_(report.public_result || ""),
    internalSummary: canViewInternal ? Security_sanitizeText_(report.internal_summary || "") : "",
    resolvedAt: String(report.resolved_at || ""),
    closedAt: String(report.closed_at || ""),
    rejectedAt: String(report.rejected_at || ""),
    rejectionReason: canViewInternal ? Security_sanitizeText_(report.rejection_reason || "") : "",
    duplicateOfReportId: String(report.duplicate_of_report_id || ""),
    source: Security_sanitizeText_(report.source || ""),
    createdAt: String(report.created_at || ""),
    updatedAt: String(report.updated_at || ""),
    version: Number(report.version || 0)
  };
}

function ReportService_projectAdminReporter_(report, canViewReporterPii) {
  const isAnonymous = Utils_toBoolean_(report.is_anonymous);
  const name = Security_sanitizeText_(report.reporter_name || "");
  const phone = Utils_normalizeString_(report.reporter_phone);
  const email = Utils_normalizeString_(report.reporter_email);

  if (isAnonymous) {
    return {
      isAnonymous: true,
      name: "",
      phone: "",
      email: "",
      contactMethod: "none"
    };
  }

  if (!canViewReporterPii) {
    return {
      isAnonymous: false,
      name: ReportService_maskName_(name),
      phone: ReportService_maskPhone_(phone),
      email: ReportService_maskEmail_(email),
      contactMethod: Security_sanitizeText_(report.contact_method || "")
    };
  }

  return {
    isAnonymous: false,
    name: name,
    phone: Security_sanitizeText_(phone),
    email: Security_sanitizeText_(email),
    contactMethod: Security_sanitizeText_(report.contact_method || "")
  };
}

function ReportService_listAdminTimeline_(reportId, attachments, permissions) {
  const canViewInternal = ReportService_canViewInternalNotes_(permissions);
  const attachmentsByUpdateId = {};

  (attachments || []).forEach(function (attachment) {
    const updateId = String(attachment.updateId || "");
    if (!updateId) {
      return;
    }

    if (!attachmentsByUpdateId[updateId]) {
      attachmentsByUpdateId[updateId] = [];
    }

    attachmentsByUpdateId[updateId].push(attachment);
  });

  return SheetRepository_list_("report_updates", {
    keyColumnName: "update_id",
    page: 1,
    pageSize: 100
  }).items.filter(function (update) {
    return String(update.report_id || "") === String(reportId || "") &&
      !Utils_toBoolean_(update.is_deleted);
  }).sort(function (left, right) {
    return String(left.created_at || "").localeCompare(String(right.created_at || ""));
  }).map(function (update) {
    const updateId = String(update.update_id || "");

    return {
      updateId: updateId,
      reportId: String(update.report_id || ""),
      type: Security_sanitizeText_(update.update_type || ""),
      oldStatus: Security_sanitizeText_(update.old_status || ""),
      newStatus: Security_sanitizeText_(update.new_status || ""),
      publicMessage: Security_sanitizeText_(update.public_message || ""),
      internalNote: canViewInternal ? Security_sanitizeText_(update.internal_note || "") : "",
      isPublic: Utils_toBoolean_(update.is_public),
      updatedBy: canViewInternal ? Security_sanitizeText_(update.updated_by || "") : "",
      updatedByName: Security_sanitizeText_(update.updated_by_name_snapshot || ""),
      updatedByRole: Security_sanitizeText_(update.updated_by_role_snapshot || ""),
      createdAt: String(update.created_at || ""),
      attachments: attachmentsByUpdateId[updateId] || [],
      version: Number(update.version || 0)
    };
  });
}

function ReportService_listAdminAdditionalInfo_(reportId, attachments, permissions) {
  const canViewReporterPii = ReportService_canViewReporterPii_(permissions);
  const canViewInternal = ReportService_canViewInternalNotes_(permissions);
  const attachmentsByAdditionalInfoId = {};

  (attachments || []).forEach(function (attachment) {
    const additionalInfoId = String(attachment.additionalInfoId || "");
    if (!additionalInfoId) {
      return;
    }

    if (!attachmentsByAdditionalInfoId[additionalInfoId]) {
      attachmentsByAdditionalInfoId[additionalInfoId] = [];
    }

    attachmentsByAdditionalInfoId[additionalInfoId].push(attachment);
  });

  return SheetRepository_list_("report_additional_info", {
    keyColumnName: "additional_info_id",
    page: 1,
    pageSize: 100
  }).items.filter(function (info) {
    return String(info.report_id || "") === String(reportId || "") &&
      !Utils_toBoolean_(info.is_deleted);
  }).sort(function (left, right) {
    return String(left.created_at || "").localeCompare(String(right.created_at || ""));
  }).map(function (info) {
    const additionalInfoId = String(info.additional_info_id || "");
    const contactName = Security_sanitizeText_(info.contact_name || "");
    const contactPhone = Utils_normalizeString_(info.contact_phone);

    return {
      additionalInfoId: additionalInfoId,
      reportId: String(info.report_id || ""),
      message: Security_sanitizeText_(info.message || ""),
      contactName: canViewReporterPii ? contactName : ReportService_maskName_(contactName),
      contactPhone: canViewReporterPii ? Security_sanitizeText_(contactPhone) : ReportService_maskPhone_(contactPhone),
      isPublic: Utils_toBoolean_(info.is_public),
      reviewStatus: Security_sanitizeText_(info.review_status || ""),
      reviewedBy: canViewInternal ? Security_sanitizeText_(info.reviewed_by || "") : "",
      reviewedAt: String(info.reviewed_at || ""),
      createdAt: String(info.created_at || ""),
      attachments: attachmentsByAdditionalInfoId[additionalInfoId] || [],
      version: Number(info.version || 0)
    };
  });
}

function ReportService_toOptionalNumber_(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const numberValue = Number(value);

  return isFinite(numberValue) ? numberValue : "";
}

function ReportService_maskName_(value) {
  const text = Utils_normalizeString_(value);

  return text ? "ปกปิดข้อมูลผู้แจ้ง" : "";
}

function ReportService_maskPhone_(value) {
  const digits = Utils_normalizeString_(value).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length < 6) {
    return "***";
  }

  return digits.slice(0, 2) + "X-XXX-" + digits.slice(-4);
}

function ReportService_maskEmail_(value) {
  const email = Utils_normalizeString_(value);
  const atIndex = email.indexOf("@");

  if (!email) {
    return "";
  }

  if (atIndex <= 0) {
    return "***";
  }

  return email.charAt(0) + "***" + email.slice(atIndex);
}

function ReportService_validateCreateRequest_(request) {
  const data = request && Utils_isPlainObject_(request.data) ? request.data : {};
  const fields = {};

  Validation_required_(data.categoryId, "categoryId", fields);
  Validation_required_(data.title, "title", fields);
  Validation_required_(data.description, "description", fields);
  Validation_required_(data.incidentDate, "incidentDate", fields);
  Validation_allowedValue_(data.priorityReported || "normal", REPORT_PRIORITY_VALUES_, "priorityReported", fields);
  Validation_requiredObject_(data.location, "location", fields);
  Validation_requiredObject_(data.reporter, "reporter", fields);
  Validation_requiredObject_(data.consent, "consent", fields);

  const location = Utils_isPlainObject_(data.location) ? data.location : {};
  const reporter = Utils_isPlainObject_(data.reporter) ? data.reporter : {};
  const consent = Utils_isPlainObject_(data.consent) ? data.consent : {};
  const title = Security_sanitizeUserText_(data.title, 150);
  const description = Security_sanitizeUserText_(data.description, 3000);
  const incidentDate = Utils_normalizeString_(data.incidentDate);
  const isAnonymous = Utils_toBoolean_(reporter.isAnonymous);
  const contactMethod = isAnonymous ? "none" : Utils_normalizeString_(reporter.contactMethod || "phone").toLowerCase();
  const settings = ReportService_getPublicSettings_();
  const category = data.categoryId ? ReportService_getActiveCategory_(data.categoryId) : null;
  const attachments = AttachmentService_validateCreatePayload_(data.attachments || [], fields, settings);

  if (title && title.length < 5) {
    fields.title = "กรุณากรอกหัวข้ออย่างน้อย 5 ตัวอักษร";
  }

  if (description && description.length < 10) {
    fields.description = "กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร";
  }

  ReportService_validateIncidentDate_(incidentDate, fields);
  ReportService_validateLocation_(location, fields);
  ReportService_validateReporter_(reporter, isAnonymous, contactMethod, fields);
  ReportService_validateConsent_(consent, settings, fields);

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูล", fields);
  }

  return {
    data: data,
    title: title,
    description: description,
    incidentDate: incidentDate,
    location: ReportService_normalizeLocation_(location),
    reporter: ReportService_normalizeReporter_(reporter, isAnonymous, contactMethod),
    consent: {
      truthConfirmed: true,
      privacyAccepted: true,
      privacyVersion: Utils_normalizeString_(consent.privacyVersion || settings.privacyVersion)
    },
    priorityReported: Utils_normalizeString_(data.priorityReported || "normal").toLowerCase(),
    category: category,
    settings: settings,
    attachments: attachments
  };
}

function ReportService_validateAddInfoRequest_(request) {
  const data = request && Utils_isPlainObject_(request.data) ? request.data : {};
  const fields = {};
  const trackingCode = ReportService_normalizeTrackingCode_(data.trackingCode);
  const message = Security_sanitizeUserText_(data.message, 2000);
  const contact = Utils_isPlainObject_(data.contact) ? data.contact : {};
  const settings = ReportService_getPublicSettings_();
  const attachments = AttachmentService_validateCreatePayload_(data.attachments || [], fields, settings);

  if (!ReportService_isTrackingCodeFormatValid_(trackingCode)) {
    fields.trackingCode = "กรุณาระบุรหัสติดตามให้ถูกต้อง";
  }

  if (!message || message.length < 5) {
    fields.message = "กรุณากรอกข้อมูลเพิ่มเติมอย่างน้อย 5 ตัวอักษร";
  }

  const contactPhone = Utils_normalizeString_(contact.phone).replace(/[\s-]/g, "");
  if (contactPhone && !/^0[0-9]{8,9}$/.test(contactPhone)) {
    fields["contact.phone"] = "รูปแบบเบอร์โทรไม่ถูกต้อง";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูล", fields);
  }

  const report = SheetRepository_findOne_("reports", {
    tracking_code: trackingCode
  }, {
    keyColumnName: "report_id"
  });

  if (!report || Utils_toBoolean_(report.is_deleted)) {
    ReportService_throwTrackNotFound_();
  }

  ReportService_assertAddInfoAllowed_(report);

  return {
    data: data,
    report: report,
    trackingCode: trackingCode,
    message: message,
    contact: {
      name: Security_sanitizeUserText_(contact.name, 120),
      phone: contactPhone
    },
    attachments: attachments
  };
}

function ReportService_assertAddInfoAllowed_(report) {
  const status = Utils_normalizeString_(report && report.status).toLowerCase();

  if (status === "closed") {
    throw ApiError_("REPORT_CLOSED", "เรื่องนี้ถูกปิดแล้ว ไม่สามารถส่งข้อมูลเพิ่มเติมได้");
  }
}

function ReportService_buildAdditionalInfoRecord_(context, ids) {
  return {
    additional_info_id: ids.additionalInfoId,
    report_id: context.report.report_id,
    message: context.message,
    contact_name: context.contact.name,
    contact_phone: context.contact.phone,
    is_public: false,
    review_status: "pending",
    reviewed_by: "",
    reviewed_at: "",
    created_at: ids.createdAt,
    request_id: ids.requestId,
    is_deleted: false,
    version: 1
  };
}

function ReportService_getPublicSettings_() {
  const result = SettingsService_getPublicConfig({
    action: "public.config",
    requestId: Utils_createRequestId_(),
    data: {}
  });

  return result.data || {
    maxImages: APP_CONFIG_.MAX_IMAGES,
    maxImageSizeMb: APP_CONFIG_.MAX_IMAGE_SIZE_BYTES / 1024 / 1024,
    maxImageDimension: APP_CONFIG_.MAX_IMAGE_DIMENSION,
    privacyVersion: "1.0"
  };
}

function ReportService_getActiveCategory_(categoryId) {
  const category = SheetRepository_findById_("categories", "category_id", categoryId, {
    keyColumnName: "category_id"
  });

  if (!category || !Utils_toBoolean_(category.is_active)) {
    throw ApiError_("CATEGORY_NOT_AVAILABLE", "หมวดนี้ไม่พร้อมใช้งาน");
  }

  return category;
}

function ReportService_validateIncidentDate_(incidentDate, fields) {
  if (!incidentDate || !/^\d{4}-\d{2}-\d{2}$/.test(incidentDate)) {
    fields.incidentDate = "กรุณาระบุวันที่ให้ถูกต้อง";
    return;
  }

  const incident = new Date(incidentDate + "T00:00:00Z");
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  if (isNaN(incident.getTime())) {
    fields.incidentDate = "กรุณาระบุวันที่ให้ถูกต้อง";
    return;
  }

  if (incident.getTime() > todayUtc.getTime()) {
    fields.incidentDate = "วันที่พบปัญหาต้องไม่เป็นวันในอนาคต";
  }
}

function ReportService_validateLocation_(location, fields) {
  const locationName = Utils_normalizeString_(location.name);
  const landmark = Utils_normalizeString_(location.landmark);

  if (!locationName && !landmark) {
    fields.location = "กรุณาระบุสถานที่หรือจุดสังเกต";
  }

  Validation_latLng_(location.latitude, location.longitude, fields);
}

function ReportService_validateReporter_(reporter, isAnonymous, contactMethod, fields) {
  if (isAnonymous) {
    return;
  }

  Validation_required_(reporter.name, "reporter.name", fields);
  Validation_required_(reporter.phone, "reporter.phone", fields);
  Validation_allowedValue_(contactMethod, REPORT_CONTACT_METHOD_VALUES_, "reporter.contactMethod", fields);

  const phone = Utils_normalizeString_(reporter.phone).replace(/[\s-]/g, "");
  if (phone && !/^0[0-9]{8,9}$/.test(phone)) {
    fields["reporter.phone"] = "รูปแบบเบอร์โทรไม่ถูกต้อง";
  }

  const email = Utils_normalizeString_(reporter.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields["reporter.email"] = "รูปแบบอีเมลไม่ถูกต้อง";
  }

  if (contactMethod === "email" && !email) {
    fields["reporter.email"] = "กรุณากรอกอีเมลเมื่อเลือกช่องทางติดต่อเป็นอีเมล";
  }
}

function ReportService_validateConsent_(consent, settings, fields) {
  if (!Utils_toBoolean_(consent.truthConfirmed)) {
    fields["consent.truthConfirmed"] = "กรุณายืนยันว่าข้อมูลเป็นความจริง";
  }

  if (!Utils_toBoolean_(consent.privacyAccepted)) {
    fields["consent.privacyAccepted"] = "กรุณายอมรับนโยบายความเป็นส่วนตัว";
  }

  const acceptedVersion = Utils_normalizeString_(consent.privacyVersion);
  if (!acceptedVersion || acceptedVersion !== String(settings.privacyVersion || "1.0")) {
    fields["consent.privacyVersion"] = "เวอร์ชันนโยบายความเป็นส่วนตัวไม่ถูกต้อง";
  }
}

function ReportService_normalizeLocation_(location) {
  const latitude = location.latitude === "" || location.latitude === null || location.latitude === undefined ? "" : Number(location.latitude);
  const longitude = location.longitude === "" || location.longitude === null || location.longitude === undefined ? "" : Number(location.longitude);

  return {
    name: Security_sanitizeUserText_(location.name, 200),
    villageNo: Security_sanitizeUserText_(location.villageNo, 20),
    landmark: Security_sanitizeUserText_(location.landmark, 200),
    latitude: latitude,
    longitude: longitude,
    mapUrl: ReportService_sanitizeMapUrl_(location.mapUrl)
  };
}

function ReportService_sanitizeMapUrl_(value) {
  const text = Utils_normalizeString_(value).slice(0, 500);

  if (!text) {
    return "";
  }

  if (!/^https:\/\/[^\s<>"']+$/i.test(text)) {
    return "";
  }

  return Security_sanitizeText_(text);
}

function ReportService_normalizeReporter_(reporter, isAnonymous, contactMethod) {
  if (isAnonymous) {
    return {
      isAnonymous: true,
      name: "",
      phone: "",
      email: "",
      contactMethod: "none"
    };
  }

  return {
    isAnonymous: false,
    name: Security_sanitizeUserText_(reporter.name, 120),
    phone: Utils_normalizeString_(reporter.phone).replace(/[\s-]/g, ""),
    email: Security_sanitizeUserText_(reporter.email, 120),
    contactMethod: contactMethod
  };
}

function ReportService_buildReportRecord_(context, ids) {
  const createdAt = ids.createdAt;
  const location = context.location;
  const reporter = context.reporter;
  const yearMonth = createdAt.slice(0, 7);

  return {
    report_id: ids.reportId,
    tracking_code: ids.trackingCode,
    request_id: ids.requestId,
    category_id: context.category.category_id,
    title: context.title,
    description: context.description,
    incident_date: context.incidentDate,
    location_name: location.name,
    village_no: location.villageNo,
    landmark: location.landmark,
    latitude: location.latitude,
    longitude: location.longitude,
    map_url: location.mapUrl,
    is_anonymous: reporter.isAnonymous,
    reporter_name: reporter.name,
    reporter_phone: reporter.phone,
    reporter_email: reporter.email,
    contact_method: reporter.contactMethod,
    reporter_consent: true,
    truth_confirmation: true,
    privacy_version: context.consent.privacyVersion,
    priority_reported: context.priorityReported,
    priority: context.priorityReported,
    status: "new",
    assigned_to: "",
    target_due_at: ReportService_calculateTargetDueAt_(createdAt, context.category.target_days),
    source: "web",
    public_result: "",
    internal_summary: "",
    resolved_at: "",
    closed_at: "",
    rejected_at: "",
    rejection_reason: "",
    duplicate_of_report_id: "",
    created_at: createdAt,
    updated_at: createdAt,
    created_by: "public",
    updated_by: "public",
    is_deleted: false,
    deleted_at: "",
    deleted_by: "",
    version: 1,
    search_text: ReportService_buildSearchText_(context),
    year_month: yearMonth,
    village_key: Utils_normalizeString_(location.villageNo).toLowerCase()
  };
}

function ReportService_createInitialTimeline_(report, updateId, attachmentCount, createdAt) {
  return SheetRepository_append_("report_updates", {
    update_id: updateId,
    report_id: report.report_id,
    update_type: "system",
    old_status: "",
    new_status: "new",
    public_message: "ระบบรับเรื่องแจ้งเรียบร้อยแล้ว",
    internal_note: "สร้างเรื่องจากแบบฟอร์มประชาชน แนบรูปภาพ " + attachmentCount + " รูป",
    is_public: true,
    updated_by: "public",
    updated_by_name_snapshot: "",
    updated_by_role_snapshot: "public",
    created_at: createdAt,
    is_deleted: false,
    version: 1
  }, {
    keyColumnName: "update_id",
    userId: "public"
  });
}

function ReportService_createAdditionalInfoTimeline_(report, updateId, attachmentCount, createdAt) {
  const attachmentText = attachmentCount > 0 ? " พร้อมแนบรูปภาพ " + attachmentCount + " รูป" : "";

  return SheetRepository_append_("report_updates", {
    update_id: updateId,
    report_id: report.report_id,
    update_type: "info_received",
    old_status: report.status || "",
    new_status: report.status || "",
    public_message: "ระบบได้รับข้อมูลเพิ่มเติมจากผู้แจ้งแล้ว" + attachmentText,
    internal_note: "ข้อมูลเพิ่มเติมรอตรวจสอบโดยเจ้าหน้าที่",
    is_public: true,
    updated_by: "public",
    updated_by_name_snapshot: "",
    updated_by_role_snapshot: "public",
    created_at: createdAt,
    is_deleted: false,
    version: 1
  }, {
    keyColumnName: "update_id",
    userId: "public"
  });
}

function ReportService_createAssignmentTimeline_(oldReport, updatedReport, officer, actor, note, createdAt) {
  const officerName = Security_sanitizeText_(officer && (officer.display_name || officer.username) ? officer.display_name || officer.username : "");
  const actorName = Security_sanitizeText_(actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "");
  const internalNoteParts = [
    "มอบหมายงานให้ " + (officerName || updatedReport.assigned_to || ""),
    note ? "หมายเหตุ: " + Security_sanitizeText_(note) : ""
  ].filter(Boolean);

  return SheetRepository_append_("report_updates", {
    update_id: Utils_createUuid_(),
    report_id: updatedReport.report_id,
    update_type: "assignment",
    old_status: oldReport.status || "",
    new_status: updatedReport.status || "",
    public_message: "มอบหมายเจ้าหน้าที่รับผิดชอบแล้ว",
    internal_note: internalNoteParts.join(" | "),
    is_public: true,
    updated_by: actor && actor.user_id ? actor.user_id : "",
    updated_by_name_snapshot: actorName,
    updated_by_role_snapshot: actor && actor.role ? actor.role : "",
    created_at: createdAt,
    is_deleted: false,
    version: 1
  }, {
    keyColumnName: "update_id",
    userId: actor && actor.user_id ? actor.user_id : "system"
  });
}

function ReportService_createStatusTimeline_(oldReport, updatedReport, payload, actor, createdAt) {
  const actorName = Security_sanitizeText_(actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "");

  return SheetRepository_append_("report_updates", {
    update_id: Utils_createUuid_(),
    report_id: updatedReport.report_id,
    update_type: ReportService_resolveStatusUpdateType_(payload.newStatus),
    old_status: oldReport.status || "",
    new_status: updatedReport.status || "",
    public_message: ReportService_buildStatusPublicMessage_(oldReport, updatedReport, payload),
    internal_note: ReportService_buildStatusInternalNote_(payload),
    is_public: true,
    updated_by: actor && actor.user_id ? actor.user_id : "",
    updated_by_name_snapshot: actorName,
    updated_by_role_snapshot: actor && actor.role ? actor.role : "",
    created_at: createdAt,
    is_deleted: false,
    version: 1
  }, {
    keyColumnName: "update_id",
    userId: actor && actor.user_id ? actor.user_id : "system"
  });
}

function ReportService_createAdminUpdateTimeline_(report, updateId, payload, actor, createdAt) {
  const actorName = Security_sanitizeText_(actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "");
  const updateRecord = {
    update_id: updateId,
    report_id: report.report_id,
    update_type: "note",
    old_status: report.status || "",
    new_status: report.status || "",
    public_message: payload.isPublic ? payload.publicMessage : "",
    internal_note: payload.internalNote,
    is_public: payload.isPublic,
    updated_by: actor && actor.user_id ? actor.user_id : "",
    updated_by_name_snapshot: actorName,
    updated_by_role_snapshot: actor && actor.role ? actor.role : "",
    created_at: createdAt,
    is_deleted: false,
    version: 1
  };

  SheetRepository_append_("report_updates", updateRecord, {
    keyColumnName: "update_id",
    userId: actor && actor.user_id ? actor.user_id : "system"
  });

  return updateRecord;
}

function ReportService_createPriorityTimeline_(oldReport, updatedReport, payload, actor, createdAt) {
  const actorName = Security_sanitizeText_(actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "");
  const oldPriority = Utils_normalizeString_(oldReport && oldReport.priority).toLowerCase() || "normal";
  const newPriority = Utils_normalizeString_(updatedReport && updatedReport.priority).toLowerCase() || payload.priority;
  const internalNote = [
    "ปรับความสำคัญจาก " + oldPriority + " เป็น " + newPriority,
    payload.note ? "หมายเหตุ: " + payload.note : ""
  ].filter(Boolean).join("\n");

  return SheetRepository_append_("report_updates", {
    update_id: Utils_createUuid_(),
    report_id: updatedReport.report_id,
    update_type: "note",
    old_status: updatedReport.status || oldReport.status || "",
    new_status: updatedReport.status || oldReport.status || "",
    public_message: "",
    internal_note: internalNote,
    is_public: false,
    updated_by: actor && actor.user_id ? actor.user_id : "",
    updated_by_name_snapshot: actorName,
    updated_by_role_snapshot: actor && actor.role ? actor.role : "",
    created_at: createdAt,
    is_deleted: false,
    version: 1
  }, {
    keyColumnName: "update_id",
    userId: actor && actor.user_id ? actor.user_id : "system"
  });
}

function ReportService_resolveStatusUpdateType_(newStatus) {
  if (newStatus === "resolved") {
    return "result";
  }

  if (newStatus === "waiting") {
    return "request_info";
  }

  return "status";
}

function ReportService_buildStatusPublicMessage_(oldReport, updatedReport, payload) {
  const newStatus = Utils_normalizeString_(updatedReport && updatedReport.status).toLowerCase();

  if (newStatus === "waiting") {
    return payload.publicMessage;
  }

  if (newStatus === "resolved") {
    return payload.publicMessage || payload.result;
  }

  if (newStatus === "closed") {
    return payload.publicMessage || "ปิดเรื่องเรียบร้อยแล้ว";
  }

  if (newStatus === "rejected") {
    return payload.publicMessage || payload.rejectionReason;
  }

  if (newStatus === "duplicate") {
    return payload.publicMessage || "เรื่องนี้ถูกจัดเป็นเรื่องซ้ำ";
  }

  if (ReportService_isReopenTransition_(oldReport && oldReport.status, newStatus)) {
    return payload.publicMessage || "เปิดเรื่องกลับมาดำเนินการต่อ";
  }

  return payload.publicMessage || "อัปเดตสถานะเป็น " + newStatus;
}

function ReportService_buildStatusInternalNote_(payload) {
  return [
    payload.internalNote ? "หมายเหตุ: " + payload.internalNote : "",
    payload.result ? "ผลการดำเนินการ: " + payload.result : "",
    payload.rejectionReason ? "เหตุผลปฏิเสธ: " + payload.rejectionReason : "",
    payload.duplicateOfReportId ? "เรื่องอ้างอิง: " + payload.duplicateOfReportId : "",
    payload.duplicateReason ? "เหตุผลเรื่องซ้ำ: " + payload.duplicateReason : "",
    payload.reason ? "เหตุผลเปิดกลับ: " + payload.reason : ""
  ].filter(Boolean).join(" | ");
}

function ReportService_compensateAdminUpdateFailure_(updateId, attachmentIds, fileIds) {
  if (fileIds && fileIds.length > 0) {
    AttachmentService_compensateUploads_(fileIds);
  }

  (attachmentIds || []).forEach(function (attachmentId) {
    try {
      SheetRepository_softDeleteById_("attachments", "attachment_id", attachmentId, {
        userId: "system"
      });
    } catch (error) {
      Security_safeLog_("ADMIN_UPDATE_ATTACHMENT_COMPENSATION_FAILED", {
        attachmentId: attachmentId,
        code: error && error.code ? error.code : "INTERNAL_ERROR"
      });
    }
  });

  if (updateId) {
    try {
      SheetRepository_softDeleteById_("report_updates", "update_id", updateId, {
        userId: "system"
      });
    } catch (error) {
      Security_safeLog_("ADMIN_UPDATE_TIMELINE_COMPENSATION_FAILED", {
        updateId: updateId,
        code: error && error.code ? error.code : "INTERNAL_ERROR"
      });
    }
  }
}

function ReportService_assertNotDuplicateRequest_(requestId) {
  const existingReport = SheetRepository_findOne_("reports", {
    request_id: requestId
  }, {
    keyColumnName: "report_id",
    includeDeleted: true
  });

  if (existingReport) {
    throw ApiError_("DUPLICATE_REQUEST", "คำขอนี้ถูกดำเนินการไปแล้ว");
  }
}

function ReportService_assertAddInfoNotDuplicateRequest_(requestId) {
  const existing = SheetRepository_findOne_("report_additional_info", {
    request_id: requestId
  }, {
    keyColumnName: "additional_info_id",
    includeDeleted: true
  });

  if (existing) {
    throw ApiError_("DUPLICATE_REQUEST", "คำขอนี้ถูกดำเนินการไปแล้ว");
  }
}

function ReportService_normalizeTrackingCode_(value) {
  return Utils_normalizeString_(value)
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function ReportService_isTrackingCodeFormatValid_(trackingCode) {
  return /^KPR-\d{6}-[A-Z0-9]{4}$/.test(String(trackingCode || ""));
}

function ReportService_throwTrackNotFound_() {
  throw ApiError_("NOT_FOUND", "ไม่พบรหัสติดตามนี้");
}

function ReportService_listPublicTimeline_(reportId, attachments) {
  const attachmentsByUpdateId = {};

  (attachments || []).forEach(function (attachment) {
    const updateId = String(attachment.updateId || "");
    if (!updateId) {
      return;
    }

    if (!attachmentsByUpdateId[updateId]) {
      attachmentsByUpdateId[updateId] = [];
    }

    attachmentsByUpdateId[updateId].push(attachment);
  });

  return SheetRepository_list_("report_updates", {
    keyColumnName: "update_id",
    page: 1,
    pageSize: 100
  }).items.filter(function (update) {
    return String(update.report_id || "") === String(reportId || "") &&
      Utils_toBoolean_(update.is_public) &&
      !Utils_toBoolean_(update.is_deleted);
  }).sort(function (left, right) {
    return String(left.created_at || "").localeCompare(String(right.created_at || ""));
  }).map(function (update) {
    const updateId = String(update.update_id || "");

    return {
      updateId: updateId,
      type: Security_sanitizeText_(update.update_type || ""),
      status: Security_sanitizeText_(update.new_status || update.old_status || ""),
      message: Security_sanitizeText_(update.public_message || ""),
      createdAt: String(update.created_at || ""),
      attachments: attachmentsByUpdateId[updateId] || []
    };
  });
}

function ReportService_projectPublicTrack_(report, category, timeline, attachments) {
  const publicAttachments = (attachments || []).map(ReportService_projectTrackAttachment_);
  const attachmentsByUpdateId = {};

  publicAttachments.forEach(function (attachment) {
    if (!attachment.updateId) {
      return;
    }

    if (!attachmentsByUpdateId[attachment.updateId]) {
      attachmentsByUpdateId[attachment.updateId] = [];
    }

    attachmentsByUpdateId[attachment.updateId].push(attachment);
  });

  const publicTimeline = (timeline || []).map(function (update) {
    const updateId = String(update.updateId || update.update_id || "");
    const updateAttachments = update.attachments && update.attachments.length > 0 ?
      update.attachments.map(ReportService_projectTrackAttachment_) :
      attachmentsByUpdateId[updateId] || [];

    return {
      updateId: updateId,
      type: Security_sanitizeText_(update.type || update.update_type || ""),
      status: Security_sanitizeText_(update.status || update.new_status || update.old_status || ""),
      message: Security_sanitizeText_(update.message || update.public_message || ""),
      createdAt: String(update.createdAt || update.created_at || ""),
      attachments: updateAttachments
    };
  });

  return {
    trackingCode: String(report.tracking_code || ""),
    category: {
      categoryId: String(category && category.categoryId ? category.categoryId : ""),
      name: Security_sanitizeText_(category && category.name ? category.name : ""),
      icon: Security_sanitizeText_(category && category.icon ? category.icon : "circle"),
      color: CategoryService_normalizeColor_(category && category.color ? category.color : "#287444")
    },
    title: Security_sanitizeText_(report.title || ""),
    incidentDate: String(report.incident_date || ""),
    createdAt: String(report.created_at || ""),
    status: Security_sanitizeText_(report.status || ""),
    priority: Security_sanitizeText_(report.priority || ""),
    publicAssigneeName: "",
    publicResult: Security_sanitizeText_(report.public_result || ""),
    timeline: publicTimeline,
    attachments: publicAttachments
  };
}

function ReportService_projectTrackAttachment_(attachment) {
  return {
    attachmentId: String(attachment.attachmentId || attachment.attachment_id || ""),
    updateId: String(attachment.updateId || attachment.update_id || ""),
    fileName: Security_sanitizeText_(attachment.fileName || attachment.file_name || ""),
    mimeType: Security_sanitizeText_(attachment.mimeType || attachment.mime_type || ""),
    fileSize: Number(attachment.fileSize || attachment.file_size || 0),
    width: Number(attachment.width || 0),
    height: Number(attachment.height || 0),
    fileRole: Security_sanitizeText_(attachment.fileRole || attachment.file_role || ""),
    createdAt: String(attachment.createdAt || attachment.created_at || "")
  };
}

function ReportService_checkRateLimit_(request) {
  const now = new Date();
  const action = "report.create";
  const rateKey = ReportService_buildRateLimitKey_(request);
  const existing = SheetRepository_findById_("rate_limits", "rate_key", rateKey, {
    keyColumnName: "rate_key",
    includeDeleted: true
  });

  if (!existing) {
    SheetRepository_append_("rate_limits", {
      rate_key: rateKey,
      action: action,
      window_start: now.toISOString(),
      count: 1,
      blocked_until: "",
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REPORT_CREATE_RATE_LIMIT_.windowSeconds * 1000).toISOString()
    }, {
      keyColumnName: "rate_key",
      userId: "system"
    });
    return;
  }

  const windowStart = new Date(existing.window_start || now.toISOString());
  const blockedUntil = existing.blocked_until ? new Date(existing.blocked_until) : null;

  if (blockedUntil && blockedUntil.getTime() > now.getTime()) {
    throw ApiError_("RATE_LIMITED", "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      retryAfterSeconds: Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000)
    });
  }

  if (now.getTime() - windowStart.getTime() > REPORT_CREATE_RATE_LIMIT_.windowSeconds * 1000) {
    SheetRepository_updateById_("rate_limits", "rate_key", rateKey, {
      window_start: now.toISOString(),
      count: 1,
      blocked_until: "",
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REPORT_CREATE_RATE_LIMIT_.windowSeconds * 1000).toISOString()
    }, {
      userId: "system"
    });
    return;
  }

  const nextCount = Number(existing.count || 0) + 1;
  const updates = {
    count: nextCount,
    updated_at: now.toISOString(),
    expires_at: new Date(windowStart.getTime() + REPORT_CREATE_RATE_LIMIT_.windowSeconds * 1000).toISOString()
  };

  if (nextCount > REPORT_CREATE_RATE_LIMIT_.limit) {
    updates.blocked_until = new Date(windowStart.getTime() + REPORT_CREATE_RATE_LIMIT_.windowSeconds * 1000).toISOString();
  }

  SheetRepository_updateById_("rate_limits", "rate_key", rateKey, updates, {
    userId: "system"
  });

  if (nextCount > REPORT_CREATE_RATE_LIMIT_.limit) {
    throw ApiError_("RATE_LIMITED", "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      retryAfterSeconds: Math.ceil((new Date(updates.blocked_until).getTime() - now.getTime()) / 1000)
    });
  }
}

function ReportService_buildRateLimitKey_(request) {
  const data = request && request.data ? request.data : {};
  const reporter = data.reporter || {};
  const location = data.location || {};
  const source = [
    "report.create",
    reporter.phone || "",
    reporter.email || "",
    data.categoryId || "",
    data.title || "",
    location.name || "",
    location.landmark || ""
  ].join("|");

  return "rl_" + Security_hashSha256_(source, "rate-limit").slice(0, 48);
}

function ReportService_checkTrackRateLimit_(trackingCode) {
  const now = new Date();
  const action = "report.track";
  const rateKey = ReportService_buildTrackRateLimitKey_(trackingCode);
  const existing = SheetRepository_findById_("rate_limits", "rate_key", rateKey, {
    keyColumnName: "rate_key",
    includeDeleted: true
  });

  if (!existing) {
    SheetRepository_append_("rate_limits", {
      rate_key: rateKey,
      action: action,
      window_start: now.toISOString(),
      count: 1,
      blocked_until: "",
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REPORT_TRACK_RATE_LIMIT_.windowSeconds * 1000).toISOString()
    }, {
      keyColumnName: "rate_key",
      userId: "system"
    });
    return;
  }

  const windowStart = new Date(existing.window_start || now.toISOString());
  const blockedUntil = existing.blocked_until ? new Date(existing.blocked_until) : null;

  if (blockedUntil && blockedUntil.getTime() > now.getTime()) {
    throw ApiError_("RATE_LIMITED", "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      retryAfterSeconds: Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000)
    });
  }

  if (now.getTime() - windowStart.getTime() > REPORT_TRACK_RATE_LIMIT_.windowSeconds * 1000) {
    SheetRepository_updateById_("rate_limits", "rate_key", rateKey, {
      window_start: now.toISOString(),
      count: 1,
      blocked_until: "",
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REPORT_TRACK_RATE_LIMIT_.windowSeconds * 1000).toISOString()
    }, {
      userId: "system"
    });
    return;
  }

  const nextCount = Number(existing.count || 0) + 1;
  const updates = {
    count: nextCount,
    updated_at: now.toISOString(),
    expires_at: new Date(windowStart.getTime() + REPORT_TRACK_RATE_LIMIT_.windowSeconds * 1000).toISOString()
  };

  if (nextCount > REPORT_TRACK_RATE_LIMIT_.limit) {
    updates.blocked_until = new Date(windowStart.getTime() + REPORT_TRACK_RATE_LIMIT_.windowSeconds * 1000).toISOString();
  }

  SheetRepository_updateById_("rate_limits", "rate_key", rateKey, updates, {
    userId: "system"
  });

  if (nextCount > REPORT_TRACK_RATE_LIMIT_.limit) {
    throw ApiError_("RATE_LIMITED", "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      retryAfterSeconds: Math.ceil((new Date(updates.blocked_until).getTime() - now.getTime()) / 1000)
    });
  }
}

function ReportService_buildTrackRateLimitKey_(trackingCode) {
  const source = [
    "report.track",
    ReportService_normalizeTrackingCode_(trackingCode)
  ].join("|");

  return "rl_track_" + Security_hashSha256_(source, "rate-limit").slice(0, 48);
}

function ReportService_checkAddInfoRateLimit_(request) {
  const now = new Date();
  const action = "report.addInfo";
  const rateKey = ReportService_buildAddInfoRateLimitKey_(request);
  const existing = SheetRepository_findById_("rate_limits", "rate_key", rateKey, {
    keyColumnName: "rate_key",
    includeDeleted: true
  });

  if (!existing) {
    SheetRepository_append_("rate_limits", {
      rate_key: rateKey,
      action: action,
      window_start: now.toISOString(),
      count: 1,
      blocked_until: "",
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REPORT_ADD_INFO_RATE_LIMIT_.windowSeconds * 1000).toISOString()
    }, {
      keyColumnName: "rate_key",
      userId: "system"
    });
    return;
  }

  const windowStart = new Date(existing.window_start || now.toISOString());
  const blockedUntil = existing.blocked_until ? new Date(existing.blocked_until) : null;

  if (blockedUntil && blockedUntil.getTime() > now.getTime()) {
    throw ApiError_("RATE_LIMITED", "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      retryAfterSeconds: Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000)
    });
  }

  if (now.getTime() - windowStart.getTime() > REPORT_ADD_INFO_RATE_LIMIT_.windowSeconds * 1000) {
    SheetRepository_updateById_("rate_limits", "rate_key", rateKey, {
      window_start: now.toISOString(),
      count: 1,
      blocked_until: "",
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REPORT_ADD_INFO_RATE_LIMIT_.windowSeconds * 1000).toISOString()
    }, {
      userId: "system"
    });
    return;
  }

  const nextCount = Number(existing.count || 0) + 1;
  const updates = {
    count: nextCount,
    updated_at: now.toISOString(),
    expires_at: new Date(windowStart.getTime() + REPORT_ADD_INFO_RATE_LIMIT_.windowSeconds * 1000).toISOString()
  };

  if (nextCount > REPORT_ADD_INFO_RATE_LIMIT_.limit) {
    updates.blocked_until = new Date(windowStart.getTime() + REPORT_ADD_INFO_RATE_LIMIT_.windowSeconds * 1000).toISOString();
  }

  SheetRepository_updateById_("rate_limits", "rate_key", rateKey, updates, {
    userId: "system"
  });

  if (nextCount > REPORT_ADD_INFO_RATE_LIMIT_.limit) {
    throw ApiError_("RATE_LIMITED", "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      retryAfterSeconds: Math.ceil((new Date(updates.blocked_until).getTime() - now.getTime()) / 1000)
    });
  }
}

function ReportService_buildAddInfoRateLimitKey_(request) {
  const data = request && request.data ? request.data : {};
  const contact = data.contact || {};
  const source = [
    "report.addInfo",
    data.trackingCode || "",
    data.message || "",
    contact.phone || ""
  ].join("|");

  return "rl_add_info_" + Security_hashSha256_(source, "rate-limit").slice(0, 48);
}

function ReportService_clearDashboardCacheSafe_(action, requestId) {
  try {
    if (typeof DashboardService_clearCache_ === "function") {
      DashboardService_clearCache_();
    }
  } catch (error) {
    Security_safeLog_("DASHBOARD_CACHE_CLEAR_FAILED", {
      action: action || "",
      requestId: requestId || "",
      code: error && error.code ? error.code : "INTERNAL_ERROR"
    });
  }
}

function ReportService_generateUniqueTrackingCode_(createdAt) {
  const date = new Date(createdAt);
  const datePart = Utilities.formatDate(date, "UTC", "yyMMdd");

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Utils_createUuid_().replace(/-/g, "").slice(0, 4).toUpperCase();
    const trackingCode = "KPR-" + datePart + "-" + suffix;
    const existing = SheetRepository_findOne_("reports", {
      tracking_code: trackingCode
    }, {
      keyColumnName: "report_id",
      includeDeleted: true
    });

    if (!existing) {
      return trackingCode;
    }
  }

  throw ApiError_("INTERNAL_ERROR", "ไม่สามารถสร้างรหัสติดตามได้");
}

function ReportService_calculateTargetDueAt_(createdAt, targetDays) {
  const days = Number(targetDays || 0);

  if (!isFinite(days) || days <= 0) {
    return "";
  }

  return new Date(new Date(createdAt).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function ReportService_buildSearchText_(context) {
  return [
    context.title,
    context.description,
    context.location.name,
    context.location.villageNo,
    context.location.landmark,
    context.category.name,
    context.category.code
  ].map(function (value) {
    return Utils_normalizeString_(value).toLowerCase();
  }).filter(Boolean).join(" ");
}

function ReportService_compensateCreateFailure_(reportId, updateId, attachmentIds, fileIds, requestId, error) {
  if (fileIds && fileIds.length > 0) {
    AttachmentService_compensateUploads_(fileIds);
  }

  (attachmentIds || []).forEach(function (attachmentId) {
    try {
      SheetRepository_softDeleteById_("attachments", "attachment_id", attachmentId, {
        userId: "system"
      });
    } catch (compensationError) {
      Security_safeLog_("ATTACHMENT_COMPENSATION_FAILED", {
        attachmentId: attachmentId,
        code: compensationError && compensationError.code ? compensationError.code : "INTERNAL_ERROR"
      });
    }
  });

  if (updateId) {
    try {
      SheetRepository_softDeleteById_("report_updates", "update_id", updateId, {
        userId: "system"
      });
    } catch (compensationError) {
      Security_safeLog_("TIMELINE_COMPENSATION_FAILED", {
        updateId: updateId,
        code: compensationError && compensationError.code ? compensationError.code : "INTERNAL_ERROR"
      });
    }
  }

  if (reportId) {
    try {
      SheetRepository_softDeleteById_("reports", "report_id", reportId, {
        userId: "system"
      });
    } catch (compensationError) {
      Security_safeLog_("REPORT_CREATE_COMPENSATION_FAILED", {
        reportId: reportId,
        code: compensationError && compensationError.code ? compensationError.code : "INTERNAL_ERROR"
      });
    }
  }

  try {
    AuditService_logReportCreateFailed_(requestId, error && error.code ? error.code : "INTERNAL_ERROR");
  } catch (auditError) {
    Security_safeLog_("REPORT_CREATE_AUDIT_FAILED", {
      requestId: requestId,
      code: auditError && auditError.code ? auditError.code : "INTERNAL_ERROR"
    });
  }
}

function ReportService_compensateAddInfoFailure_(additionalInfoId, updateId, attachmentIds, fileIds, requestId, error) {
  if (fileIds && fileIds.length > 0) {
    AttachmentService_compensateUploads_(fileIds);
  }

  (attachmentIds || []).forEach(function (attachmentId) {
    try {
      SheetRepository_softDeleteById_("attachments", "attachment_id", attachmentId, {
        userId: "system"
      });
    } catch (compensationError) {
      Security_safeLog_("ADD_INFO_ATTACHMENT_COMPENSATION_FAILED", {
        attachmentId: attachmentId,
        code: compensationError && compensationError.code ? compensationError.code : "INTERNAL_ERROR"
      });
    }
  });

  if (updateId) {
    try {
      SheetRepository_softDeleteById_("report_updates", "update_id", updateId, {
        userId: "system"
      });
    } catch (compensationError) {
      Security_safeLog_("ADD_INFO_TIMELINE_COMPENSATION_FAILED", {
        updateId: updateId,
        code: compensationError && compensationError.code ? compensationError.code : "INTERNAL_ERROR"
      });
    }
  }

  if (additionalInfoId) {
    try {
      SheetRepository_softDeleteById_("report_additional_info", "additional_info_id", additionalInfoId, {
        userId: "system"
      });
    } catch (compensationError) {
      Security_safeLog_("ADD_INFO_COMPENSATION_FAILED", {
        additionalInfoId: additionalInfoId,
        code: compensationError && compensationError.code ? compensationError.code : "INTERNAL_ERROR"
      });
    }
  }

  try {
    AuditService_logAdditionalInfoFailed_(requestId, error && error.code ? error.code : "INTERNAL_ERROR");
  } catch (auditError) {
    Security_safeLog_("ADD_INFO_AUDIT_FAILED", {
      requestId: requestId,
      code: auditError && auditError.code ? auditError.code : "INTERNAL_ERROR"
    });
  }
}
