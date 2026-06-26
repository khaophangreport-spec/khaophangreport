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
