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
