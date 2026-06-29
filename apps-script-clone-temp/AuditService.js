function AuditService_log_(entry) {
  const safeEntry = entry || {};
  const detail = Security_redactSensitive_(safeEntry.detail || {});
  const record = {
    log_id: Utils_createUuid_(),
    user_id: safeEntry.userId || "public",
    user_name_snapshot: safeEntry.userNameSnapshot || "",
    role_snapshot: safeEntry.roleSnapshot || "public",
    action: safeEntry.action || "",
    entity_type: safeEntry.entityType || "",
    entity_id: safeEntry.entityId || "",
    detail: JSON.stringify(detail),
    request_id: safeEntry.requestId || "",
    ip_hint: safeEntry.ipHint || "",
    user_agent_hint: safeEntry.userAgentHint || "",
    created_at: safeEntry.createdAt || Utils_nowIso_(),
    severity: safeEntry.severity || "info",
    success: safeEntry.success !== false
  };

  return SheetRepository_append_("activity_logs", record, {
    keyColumnName: "log_id",
    userId: safeEntry.userId || "public"
  });
}

function AuditService_listAdmin(request) {
  const context = AuditService_requireActivityReadContext_(request);
  const query = AuditService_normalizeAdminListQuery_(request && request.data);
  const logs = SheetRepository_batchRead_("activity_logs", {
    keyColumnName: "log_id",
    includeDeleted: false
  }).objects;
  const filtered = AuditService_filterAdminLogs_(logs, query);
  const sorted = AuditService_sortAdminLogs_(filtered);
  const page = SheetRepository_paginate_(sorted, query.page, query.pageSize);

  return {
    data: {
      items: page.items.map(AuditService_projectAdminLog_),
      pagination: page.pagination,
      filters: query,
      actions: AuditService_buildUniqueOptions_(logs, "action"),
      entityTypes: AuditService_buildUniqueOptions_(logs, "entity_type"),
      permissions: AuditService_buildAdminListPermissions_(context.permissions)
    },
    message: "Loaded activity logs"
  };
}

function AuditService_requireActivityReadContext_(request) {
  const context = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const permissions = UserService_getPermissions_(context.user.role);

  UserService_assertPermission_(permissions, "settings.manage", "No permission to view activity logs");

  return {
    session: context.session,
    user: context.user,
    permissions: permissions,
    requestId: request && request.requestId ? String(request.requestId) : ""
  };
}

function AuditService_buildAdminListPermissions_(permissions) {
  return {
    canRead: UserService_hasPermission_(permissions, "settings.manage")
  };
}

function AuditService_normalizeAdminListQuery_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};

  return {
    page: Utils_clampInteger_(input.page, 1, 1, 1000000),
    pageSize: Utils_clampInteger_(input.pageSize, 20, 1, 100),
    userId: Utils_normalizeString_(input.userId),
    actionName: Utils_normalizeString_(input.actionName || input.action),
    entityType: Utils_normalizeString_(input.entityType),
    entity: Utils_normalizeString_(input.entity || input.entityId),
    dateFrom: AuditService_normalizeDateFilter_(input.dateFrom, false),
    dateTo: AuditService_normalizeDateFilter_(input.dateTo, true),
    keyword: Utils_normalizeString_(input.keyword).toLowerCase()
  };
}

function AuditService_normalizeDateFilter_(value, endOfDay) {
  const normalizedValue = Utils_normalizeString_(value);

  if (!normalizedValue) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue + (endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z");
  }

  const date = new Date(normalizedValue);

  return isNaN(date.getTime()) ? "" : date.toISOString();
}

function AuditService_filterAdminLogs_(logs, query) {
  const safeQuery = query || {};
  const fromTime = safeQuery.dateFrom ? new Date(safeQuery.dateFrom).getTime() : null;
  const toTime = safeQuery.dateTo ? new Date(safeQuery.dateTo).getTime() : null;

  return (logs || []).filter(function (log) {
    const actionName = Utils_normalizeString_(log.action);
    const entityType = Utils_normalizeString_(log.entity_type);
    const entityId = Utils_normalizeString_(log.entity_id);
    const userSearch = [
      log.user_id,
      log.user_name_snapshot,
      log.role_snapshot
    ].join(" ").toLowerCase();
    const createdTime = log.created_at ? new Date(log.created_at).getTime() : null;

    if (safeQuery.userId && userSearch.indexOf(safeQuery.userId.toLowerCase()) === -1) {
      return false;
    }

    if (safeQuery.actionName && actionName !== safeQuery.actionName) {
      return false;
    }

    if (safeQuery.entityType && entityType !== safeQuery.entityType) {
      return false;
    }

    if (safeQuery.entity) {
      const entitySearch = [entityType, entityId].join(" ").toLowerCase();

      if (entitySearch.indexOf(safeQuery.entity.toLowerCase()) === -1) {
        return false;
      }
    }

    if (fromTime !== null && (!createdTime || createdTime < fromTime)) {
      return false;
    }

    if (toTime !== null && (!createdTime || createdTime > toTime)) {
      return false;
    }

    if (safeQuery.keyword) {
      const safeDetail = AuditService_buildDetailSummary_(AuditService_parseSafeDetail_(log.detail || ""));
      const searchText = [
        log.log_id,
        log.user_id,
        log.user_name_snapshot,
        log.role_snapshot,
        log.action,
        log.entity_type,
        log.entity_id,
        log.request_id,
        log.severity,
        safeDetail
      ].join(" ").toLowerCase();

      return searchText.indexOf(safeQuery.keyword) !== -1;
    }

    return true;
  });
}

function AuditService_sortAdminLogs_(logs) {
  return (logs || []).slice().sort(function (a, b) {
    const aTime = a && a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b && b.created_at ? new Date(b.created_at).getTime() : 0;

    if (aTime !== bTime) {
      return bTime - aTime;
    }

    return String(b && b.log_id ? b.log_id : "").localeCompare(String(a && a.log_id ? a.log_id : ""));
  });
}

function AuditService_projectAdminLog_(log) {
  const detail = AuditService_parseSafeDetail_(log && log.detail ? log.detail : "");

  return {
    logId: String(log && log.log_id ? log.log_id : ""),
    userId: Security_sanitizeText_(log && log.user_id ? log.user_id : ""),
    userNameSnapshot: Security_sanitizeText_(log && log.user_name_snapshot ? log.user_name_snapshot : ""),
    roleSnapshot: Security_sanitizeText_(log && log.role_snapshot ? log.role_snapshot : ""),
    action: Security_sanitizeText_(log && log.action ? log.action : ""),
    entityType: Security_sanitizeText_(log && log.entity_type ? log.entity_type : ""),
    entityId: Security_sanitizeText_(log && log.entity_id ? log.entity_id : ""),
    requestId: Security_sanitizeText_(log && log.request_id ? log.request_id : ""),
    createdAt: String(log && log.created_at ? log.created_at : ""),
    severity: Security_sanitizeText_(log && log.severity ? log.severity : "info"),
    success: Utils_toBoolean_(log && log.success !== undefined ? log.success : true),
    detail: detail,
    detailSummary: AuditService_buildDetailSummary_(detail)
  };
}

function AuditService_parseSafeDetail_(detailText) {
  const rawText = String(detailText || "");

  if (!rawText) {
    return {};
  }

  const parsed = Utils_safeJsonParse_(rawText);

  if (!parsed.ok) {
    return {
      text: AuditService_redactSensitiveText_(rawText)
    };
  }

  return AuditService_redactLogDetail_(Security_redactSensitive_(parsed.data));
}

function AuditService_redactLogDetail_(value) {
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return AuditService_redactLogDetail_(item);
    });
  }

  if (Utils_isPlainObject_(value)) {
    const output = {};

    Object.keys(value).forEach(function (key) {
      if (Security_isSensitiveKey_(key)) {
        output[Security_sanitizeText_(key)] = SECURITY_REDACTED_TEXT_;
        return;
      }

      output[Security_sanitizeText_(key)] = AuditService_redactLogDetail_(value[key]);
    });

    return output;
  }

  if (typeof value === "string") {
    return AuditService_redactSensitiveText_(value);
  }

  return value;
}

function AuditService_redactSensitiveText_(value) {
  const text = Security_sanitizeText_(value);

  if (/password|token|secret|salt|base64/i.test(text)) {
    return SECURITY_REDACTED_TEXT_;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[0-9a-f-]{20,}/i.test(text)) {
    return SECURITY_REDACTED_TEXT_;
  }

  if (/^[A-Za-z0-9+/._-]{80,}={0,2}$/.test(text)) {
    return SECURITY_REDACTED_TEXT_;
  }

  return text;
}

function AuditService_buildDetailSummary_(detail) {
  const parts = [];

  AuditService_collectDetailSummaryParts_(detail, "", parts);

  return parts.slice(0, 6).join(", ");
}

function AuditService_collectDetailSummaryParts_(value, prefix, parts) {
  if (parts.length >= 6 || value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    parts.push((prefix || "items") + ": " + value.length + " items");
    return;
  }

  if (Utils_isPlainObject_(value)) {
    Object.keys(value).forEach(function (key) {
      if (parts.length >= 6) {
        return;
      }

      AuditService_collectDetailSummaryParts_(value[key], prefix ? prefix + "." + key : key, parts);
    });
    return;
  }

  parts.push((prefix || "value") + ": " + String(value));
}

function AuditService_buildUniqueOptions_(logs, columnName) {
  const seen = {};

  return (logs || []).map(function (log) {
    return Security_sanitizeText_(log && log[columnName] ? log[columnName] : "");
  }).filter(function (value) {
    if (!value || seen[value]) {
      return false;
    }

    seen[value] = true;
    return true;
  }).sort();
}

function AuditService_logReportCreated_(report, attachmentCount, requestId) {
  return AuditService_log_({
    userId: "public",
    roleSnapshot: "public",
    action: "report.create",
    entityType: "report",
    entityId: report.report_id,
    requestId: requestId,
    success: true,
    detail: {
      trackingCode: report.tracking_code,
      status: report.status,
      categoryId: report.category_id,
      isAnonymous: report.is_anonymous === true,
      attachmentCount: attachmentCount || 0
    }
  });
}

function AuditService_logReportCreateFailed_(requestId, code) {
  return AuditService_log_({
    userId: "public",
    roleSnapshot: "public",
    action: "report.create",
    entityType: "report",
    entityId: "",
    requestId: requestId,
    severity: "warning",
    success: false,
    detail: {
      code: code || "INTERNAL_ERROR"
    }
  });
}

function AuditService_logAdditionalInfoCreated_(report, additionalInfo, attachmentCount, requestId) {
  return AuditService_log_({
    userId: "public",
    roleSnapshot: "public",
    action: "report.addInfo",
    entityType: "report_additional_info",
    entityId: additionalInfo.additional_info_id,
    requestId: requestId,
    success: true,
    detail: {
      reportId: report.report_id,
      trackingCode: report.tracking_code,
      reviewStatus: additionalInfo.review_status,
      attachmentCount: attachmentCount || 0
    }
  });
}

function AuditService_logAdditionalInfoFailed_(requestId, code) {
  return AuditService_log_({
    userId: "public",
    roleSnapshot: "public",
    action: "report.addInfo",
    entityType: "report_additional_info",
    entityId: "",
    requestId: requestId,
    severity: "warning",
    success: false,
    detail: {
      code: code || "INTERNAL_ERROR"
    }
  });
}

function AuditService_logAuthLoginSuccess_(user, sessionId, requestId) {
  return AuditService_log_({
    userId: user.user_id,
    userNameSnapshot: user.display_name || user.username || "",
    roleSnapshot: user.role || "",
    action: "auth.login.success",
    entityType: "session",
    entityId: sessionId || "",
    requestId: requestId || "",
    success: true,
    detail: {
      userId: user.user_id,
      role: user.role || ""
    }
  });
}

function AuditService_logAuthLoginFailed_(user, username, requestId, reason) {
  return AuditService_log_({
    userId: user && user.user_id ? user.user_id : "anonymous",
    userNameSnapshot: user && user.display_name ? user.display_name : "",
    roleSnapshot: user && user.role ? user.role : "",
    action: "auth.login.failed",
    entityType: "user",
    entityId: user && user.user_id ? user.user_id : "",
    requestId: requestId || "",
    severity: "warning",
    success: false,
    detail: {
      usernameHash: Security_hashSha256_(UserService_normalizeUsername_(username), "auth-log"),
      reason: reason || "unknown"
    }
  });
}

function AuditService_logAuthLogout_(user, sessionId, requestId) {
  return AuditService_log_({
    userId: user.user_id,
    userNameSnapshot: user.display_name || user.username || "",
    roleSnapshot: user.role || "",
    action: "auth.logout",
    entityType: "session",
    entityId: sessionId || "",
    requestId: requestId || "",
    success: true,
    detail: {
      reason: "user_logout"
    }
  });
}

function AuditService_logAuthPasswordChanged_(user, requestId) {
  return AuditService_log_({
    userId: user.user_id,
    userNameSnapshot: user.display_name || user.username || "",
    roleSnapshot: user.role || "",
    action: "auth.changePassword",
    entityType: "user",
    entityId: user.user_id,
    requestId: requestId || "",
    success: true,
    detail: {
      sessionsRevoked: true,
      passwordVersion: user.password_version
    }
  });
}

function AuditService_logAuthPasswordChangeFailed_(user, requestId, reason) {
  return AuditService_log_({
    userId: user && user.user_id ? user.user_id : "anonymous",
    userNameSnapshot: user && user.display_name ? user.display_name : "",
    roleSnapshot: user && user.role ? user.role : "",
    action: "auth.changePassword.failed",
    entityType: "user",
    entityId: user && user.user_id ? user.user_id : "",
    requestId: requestId || "",
    severity: "warning",
    success: false,
    detail: {
      reason: reason || "unknown"
    }
  });
}

function AuditService_logFirstAdminCreated_(user, requestId) {
  return AuditService_log_({
    userId: user.user_id,
    userNameSnapshot: user.display_name || user.username || "",
    roleSnapshot: user.role || "",
    action: "auth.firstAdmin.created",
    entityType: "user",
    entityId: user.user_id,
    requestId: requestId || "",
    success: true,
    detail: {
      role: user.role,
      mustChangePassword: Utils_toBoolean_(user.must_change_password)
    }
  });
}

function AuditService_logAdminUserSaved_(oldUser, updatedUser, actor, requestId, isCreated) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.user.save",
    entityType: "user",
    entityId: updatedUser && updatedUser.user_id ? updatedUser.user_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      operation: isCreated ? "create" : "update",
      usernameHash: Security_hashSha256_(UserService_normalizeUsername_(updatedUser && updatedUser.username), "user-log"),
      oldRole: oldUser && oldUser.role ? oldUser.role : "",
      newRole: updatedUser && updatedUser.role ? updatedUser.role : "",
      oldStatus: oldUser && oldUser.status ? oldUser.status : "",
      newStatus: updatedUser && updatedUser.status ? updatedUser.status : "",
      mustChangePassword: Utils_toBoolean_(updatedUser && updatedUser.must_change_password),
      version: updatedUser && updatedUser.version ? Number(updatedUser.version) : 0
    }
  });
}

function AuditService_logAdminUserPasswordReset_(user, actor, requestId, revokedCount) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.user.resetPassword",
    entityType: "user",
    entityId: user && user.user_id ? user.user_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      usernameHash: Security_hashSha256_(UserService_normalizeUsername_(user && user.username), "user-log"),
      role: user && user.role ? user.role : "",
      status: user && user.status ? user.status : "",
      mustChangePassword: Utils_toBoolean_(user && user.must_change_password),
      passwordVersion: user && user.password_version ? Number(user.password_version) : 0,
      revokedSessions: Number(revokedCount || 0)
    }
  });
}

function AuditService_logAdminUserSessionsRevoked_(user, actor, requestId, revokedCount, reason) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.user.revokeSessions",
    entityType: "user",
    entityId: user && user.user_id ? user.user_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      usernameHash: Security_hashSha256_(UserService_normalizeUsername_(user && user.username), "user-log"),
      role: user && user.role ? user.role : "",
      status: user && user.status ? user.status : "",
      revokedSessions: Number(revokedCount || 0),
      reason: Utils_normalizeString_(reason || "admin_revoked")
    }
  });
}

function AuditService_logAdminCategorySaved_(oldCategory, updatedCategory, actor, requestId, isCreated) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.category.save",
    entityType: "category",
    entityId: updatedCategory && updatedCategory.category_id ? updatedCategory.category_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      operation: isCreated ? "create" : "update",
      code: updatedCategory && updatedCategory.code ? updatedCategory.code : "",
      oldIsActive: oldCategory ? Utils_toBoolean_(oldCategory.is_active) : "",
      newIsActive: updatedCategory ? Utils_toBoolean_(updatedCategory.is_active) : "",
      oldSortOrder: oldCategory && oldCategory.sort_order !== undefined ? Number(oldCategory.sort_order || 0) : "",
      newSortOrder: updatedCategory && updatedCategory.sort_order !== undefined ? Number(updatedCategory.sort_order || 0) : "",
      targetDays: updatedCategory && updatedCategory.target_days !== undefined ? Number(updatedCategory.target_days || 0) : 0,
      hasDefaultAssignee: !!(updatedCategory && updatedCategory.default_assignee),
      version: updatedCategory && updatedCategory.version ? Number(updatedCategory.version) : 0
    }
  });
}

function AuditService_logAdminAnnouncementSaved_(oldAnnouncement, updatedAnnouncement, actor, requestId, isCreated) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.announcement.save",
    entityType: "announcement",
    entityId: updatedAnnouncement && updatedAnnouncement.announcement_id ? updatedAnnouncement.announcement_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      operation: isCreated ? "create" : "update",
      type: updatedAnnouncement && updatedAnnouncement.type ? updatedAnnouncement.type : "",
      oldIsActive: oldAnnouncement ? Utils_toBoolean_(oldAnnouncement.is_active) : "",
      newIsActive: updatedAnnouncement ? Utils_toBoolean_(updatedAnnouncement.is_active) : "",
      oldSortOrder: oldAnnouncement && oldAnnouncement.sort_order !== undefined ? Number(oldAnnouncement.sort_order || 0) : "",
      newSortOrder: updatedAnnouncement && updatedAnnouncement.sort_order !== undefined ? Number(updatedAnnouncement.sort_order || 0) : "",
      hasContent: !!(updatedAnnouncement && updatedAnnouncement.content),
      hasEndAt: !!(updatedAnnouncement && updatedAnnouncement.end_at),
      version: updatedAnnouncement && updatedAnnouncement.version ? Number(updatedAnnouncement.version) : 0
    }
  });
}

function AuditService_logAdminSettingsUpdated_(changes, actor, requestId) {
  const safeChanges = Array.isArray(changes) ? changes : [];
  const changedKeys = safeChanges.map(function (change) {
    return change && change.key ? String(change.key) : "";
  }).filter(function (key) {
    return key;
  });

  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.settings.update",
    entityType: "settings",
    entityId: "settings",
    requestId: requestId || "",
    success: true,
    detail: {
      changedKeys: changedKeys,
      changedCount: changedKeys.length,
      publicKeys: safeChanges.filter(function (change) {
        return change && change.isPublic;
      }).map(function (change) {
        return change.key;
      }),
      privateKeys: safeChanges.filter(function (change) {
        return change && !change.isPublic;
      }).map(function (change) {
        return change.key;
      }),
      riskyKeys: safeChanges.filter(function (change) {
        return change && change.isRisky;
      }).map(function (change) {
        return change.key;
      })
    }
  });
}

function AuditService_logExportCsvCreated_(exportLog, actor, requestId, options) {
  const safeOptions = options || {};

  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.export.csv",
    entityType: "export",
    entityId: exportLog && exportLog.export_id ? exportLog.export_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      exportType: exportLog && exportLog.export_type ? exportLog.export_type : "",
      includedPersonalData: Utils_toBoolean_(exportLog && exportLog.included_personal_data),
      rowCount: exportLog && exportLog.row_count !== undefined ? Number(exportLog.row_count || 0) : 0,
      truncated: !!safeOptions.truncated,
      hasDateFrom: !!safeOptions.dateFrom,
      hasDateTo: !!safeOptions.dateTo
    }
  });
}

function AuditService_logReportAssigned_(oldReport, updatedReport, assignment, officer, actor, requestId, oldAssigneeId) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.report.assign",
    entityType: "report",
    entityId: updatedReport && updatedReport.report_id ? updatedReport.report_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      assignmentId: assignment && assignment.assignment_id ? assignment.assignment_id : "",
      oldAssigneeId: oldAssigneeId || "",
      newAssigneeId: officer && officer.user_id ? officer.user_id : "",
      oldStatus: oldReport && oldReport.status ? oldReport.status : "",
      newStatus: updatedReport && updatedReport.status ? updatedReport.status : "",
      targetDueAt: updatedReport && updatedReport.target_due_at ? updatedReport.target_due_at : ""
    }
  });
}

function AuditService_logReportStatusUpdated_(oldReport, updatedReport, payload, actor, requestId) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.report.updateStatus",
    entityType: "report",
    entityId: updatedReport && updatedReport.report_id ? updatedReport.report_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      oldStatus: oldReport && oldReport.status ? oldReport.status : "",
      newStatus: updatedReport && updatedReport.status ? updatedReport.status : "",
      version: updatedReport && updatedReport.version ? Number(updatedReport.version) : 0,
      duplicateOfReportId: payload && payload.duplicateOfReportId ? payload.duplicateOfReportId : "",
      hasPublicMessage: !!(payload && payload.publicMessage),
      hasInternalNote: !!(payload && payload.internalNote),
      hasResult: !!(payload && payload.result),
      confirmed: !!(payload && payload.confirmed)
    }
  });
}

function AuditService_logReportPriorityUpdated_(oldReport, updatedReport, payload, actor, requestId) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.report.updatePriority",
    entityType: "report",
    entityId: updatedReport && updatedReport.report_id ? updatedReport.report_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      oldPriority: oldReport && oldReport.priority ? oldReport.priority : "",
      newPriority: updatedReport && updatedReport.priority ? updatedReport.priority : "",
      version: updatedReport && updatedReport.version ? Number(updatedReport.version) : 0,
      hasNote: !!(payload && payload.note)
    }
  });
}

function AuditService_logReportUpdateAdded_(report, update, attachmentCount, actor, requestId) {
  return AuditService_log_({
    userId: actor && actor.user_id ? actor.user_id : "system",
    userNameSnapshot: actor && (actor.display_name || actor.username) ? actor.display_name || actor.username : "",
    roleSnapshot: actor && actor.role ? actor.role : "",
    action: "admin.report.addUpdate",
    entityType: "report",
    entityId: report && report.report_id ? report.report_id : "",
    requestId: requestId || "",
    success: true,
    detail: {
      updateId: update && update.update_id ? update.update_id : "",
      status: report && report.status ? report.status : "",
      isPublic: !!(update && update.is_public),
      hasPublicMessage: !!(update && update.public_message),
      hasInternalNote: !!(update && update.internal_note),
      attachmentCount: attachmentCount || 0
    }
  });
}
