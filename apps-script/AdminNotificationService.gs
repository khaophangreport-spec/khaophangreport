const ADMIN_NOTIFICATION_EMAILS_PROPERTY_ = "ADMIN_NOTIFICATION_EMAILS";
const ADMIN_APP_BASE_URL_PROPERTY_ = "ADMIN_APP_BASE_URL";
const ADMIN_NEW_REPORT_NOTIFICATION_CACHE_PREFIX_ = "admin.new_report.email.";
const ADMIN_NEW_REPORT_NOTIFICATION_CACHE_SECONDS_ = 21600;

function AdminNotificationService_notifyNewReportSafe_(report, context) {
  try {
    return AdminNotificationService_notifyNewReport_(report, context);
  } catch (error) {
    AdminNotificationService_logFailed_(report && report.report_id, error);
    return {
      ok: false,
      code: error && error.code ? error.code : "INTERNAL_ERROR"
    };
  }
}

function AdminNotificationService_notifyNewReport_(report, context) {
  const reportId = Utils_normalizeString_(report && report.report_id);
  const recipients = AdminNotificationService_getAdminRecipients_();

  if (!reportId) {
    return AdminNotificationService_skip_("missing_report_id", "", 0);
  }

  if (recipients.length === 0) {
    return AdminNotificationService_skip_("missing_recipients", reportId, 0);
  }

  if (AdminNotificationService_isReportNotificationMarked_(reportId)) {
    return AdminNotificationService_skip_("duplicate_report_id", reportId, recipients.length);
  }

  const quota = AdminNotificationService_getRemainingDailyQuota_();
  if (quota !== null && quota < recipients.length) {
    AdminNotificationService_logFailed_(reportId, {
      name: "QuotaExceeded",
      message: "MailApp daily quota is not enough for recipients"
    });
    return {
      ok: false,
      code: "MAIL_QUOTA_EXCEEDED",
      reportId: reportId,
      recipientCount: recipients.length
    };
  }

  AdminNotificationService_markReportNotification_(reportId);

  const message = AdminNotificationService_buildNewReportEmail_(report, context || {});

  MailApp.sendEmail({
    to: recipients.join(","),
    subject: message.subject,
    body: message.body,
    htmlBody: message.htmlBody,
    name: "Khaophang Report"
  });

  Security_safeLog_("ADMIN_NEW_REPORT_EMAIL_SENT", {
    reportId: reportId,
    recipientCount: recipients.length,
    timestamp: Utils_nowIso_()
  });

  return {
    ok: true,
    reportId: reportId,
    recipientCount: recipients.length
  };
}

function AdminNotificationService_getAdminRecipients_() {
  return AdminNotificationService_parseEmailList_(
    Config_getProperty_(ADMIN_NOTIFICATION_EMAILS_PROPERTY_, "")
  );
}

function AdminNotificationService_parseEmailList_(value) {
  const seen = {};
  const recipients = [];

  String(value || "").split(/[,;]/).forEach(function (entry) {
    const email = Utils_normalizeString_(entry).toLowerCase();

    if (!email || seen[email] || !AdminNotificationService_isValidEmail_(email)) {
      return;
    }

    seen[email] = true;
    recipients.push(email);
  });

  return recipients;
}

function AdminNotificationService_isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Utils_normalizeString_(value));
}

function AdminNotificationService_buildNewReportEmail_(report, context) {
  const safeReport = report || {};
  const safeContext = context || {};
  const trackingCode = Utils_normalizeString_(safeReport.tracking_code || safeReport.report_id || "-");
  const title = Utils_normalizeString_(safeReport.title || "-");
  const category = AdminNotificationService_getCategoryName_(safeReport, safeContext);
  const village = Utils_normalizeString_(safeReport.village_no || safeReport.village_key || "-") || "-";
  const priority = AdminNotificationService_getPriorityLabel_(safeReport.priority || safeReport.priority_reported);
  const status = AdminNotificationService_getStatusLabel_(safeReport.status);
  const createdAt = Utils_normalizeString_(safeReport.created_at || Utils_nowIso_());
  const reporterText = Utils_toBoolean_(safeReport.is_anonymous) ? "ไม่เปิดเผยตัวตน" : "เปิดเผยตัวตนในระบบ";
  const adminUrl = AdminNotificationService_buildAdminReportUrl_();
  const subject = "[Khaophang Report] มีเรื่องแจ้งใหม่ " + trackingCode;
  const lines = [
    "มีเรื่องแจ้งใหม่ในระบบ Khaophang Report",
    "",
    "รหัสเรื่อง: " + trackingCode,
    "หัวข้อ: " + title,
    "หมวดหมู่: " + category,
    "หมู่บ้าน/พื้นที่: " + village,
    "ระดับความเร่งด่วน: " + priority,
    "วันที่และเวลาที่แจ้ง: " + createdAt,
    "สถานะเริ่มต้น: " + status,
    "ผู้แจ้ง: " + reporterText,
    "",
    "เปิดดูในหน้า Admin: " + adminUrl
  ];
  const htmlRows = [
    ["รหัสเรื่อง", trackingCode],
    ["หัวข้อ", title],
    ["หมวดหมู่", category],
    ["หมู่บ้าน/พื้นที่", village],
    ["ระดับความเร่งด่วน", priority],
    ["วันที่และเวลาที่แจ้ง", createdAt],
    ["สถานะเริ่มต้น", status],
    ["ผู้แจ้ง", reporterText]
  ];

  return {
    subject: subject,
    body: lines.join("\n"),
    htmlBody: AdminNotificationService_buildHtmlBody_(htmlRows, adminUrl)
  };
}

function AdminNotificationService_buildHtmlBody_(rows, adminUrl) {
  const rowHtml = (rows || []).map(function (row) {
    return "<tr><th style=\"text-align:left;padding:6px 10px;background:#eef7f0;\">" +
      Security_sanitizeText_(row[0]) +
      "</th><td style=\"padding:6px 10px;\">" +
      Security_sanitizeText_(row[1]) +
      "</td></tr>";
  }).join("");

  return [
    "<div style=\"font-family:Arial,sans-serif;color:#163326;line-height:1.6;\">",
    "<h2 style=\"margin:0 0 12px;\">มีเรื่องแจ้งใหม่ในระบบ Khaophang Report</h2>",
    "<table style=\"border-collapse:collapse;border:1px solid #c9f1d8;\">",
    rowHtml,
    "</table>",
    "<p style=\"margin-top:16px;\"><a href=\"" + Security_sanitizeText_(adminUrl) + "\">เปิดดูในหน้า Admin</a></p>",
    "</div>"
  ].join("");
}

function AdminNotificationService_getCategoryName_(report, context) {
  const category = context && context.category ? context.category : {};

  return Utils_normalizeString_(category.name || category.code || report.category_id || "-") || "-";
}

function AdminNotificationService_getPriorityLabel_(value) {
  const priority = Utils_normalizeString_(value || "normal").toLowerCase();
  const labels = {
    low: "ต่ำ",
    normal: "ปกติ",
    high: "สูง",
    critical: "เร่งด่วน"
  };

  return labels[priority] || priority || "-";
}

function AdminNotificationService_getStatusLabel_(value) {
  const status = Utils_normalizeString_(value || "new").toLowerCase();
  const labels = {
    new: "รับเรื่องแล้ว",
    reviewing: "กำลังตรวจสอบ",
    assigned: "มอบหมายแล้ว",
    in_progress: "กำลังดำเนินการ",
    waiting: "รอข้อมูลเพิ่มเติม",
    resolved: "ดำเนินการแล้ว",
    closed: "ปิดเรื่อง",
    rejected: "ไม่รับดำเนินการ",
    duplicate: "เรื่องซ้ำ"
  };

  return labels[status] || status || "-";
}

function AdminNotificationService_buildAdminReportUrl_() {
  const baseUrl = Utils_normalizeString_(Config_getProperty_(ADMIN_APP_BASE_URL_PROPERTY_, ""));
  const fallbackUrl = Config_getPublicAppConfig_().siteUrl + "/admin/reports.html";
  const safeBaseUrl = baseUrl || fallbackUrl;

  return safeBaseUrl.replace(/\/+$/, "") + (safeBaseUrl.indexOf("reports.html") === -1 ? "/admin/reports.html" : "");
}

function AdminNotificationService_getRemainingDailyQuota_() {
  if (typeof MailApp === "undefined" || typeof MailApp.getRemainingDailyQuota !== "function") {
    return null;
  }

  return Number(MailApp.getRemainingDailyQuota());
}

function AdminNotificationService_isReportNotificationMarked_(reportId) {
  const cache = AdminNotificationService_getCache_();
  const key = ADMIN_NEW_REPORT_NOTIFICATION_CACHE_PREFIX_ + reportId;

  return cache && cache.get(key) === "sent";
}

function AdminNotificationService_markReportNotification_(reportId) {
  const cache = AdminNotificationService_getCache_();
  const key = ADMIN_NEW_REPORT_NOTIFICATION_CACHE_PREFIX_ + reportId;

  if (cache) {
    cache.put(key, "sent", ADMIN_NEW_REPORT_NOTIFICATION_CACHE_SECONDS_);
  }
}

function AdminNotificationService_getCache_() {
  if (typeof CacheService === "undefined" || typeof CacheService.getScriptCache !== "function") {
    return null;
  }

  return CacheService.getScriptCache();
}

function AdminNotificationService_skip_(reason, reportId, recipientCount) {
  Security_safeLog_("ADMIN_NEW_REPORT_EMAIL_SKIPPED", {
    reason: reason,
    reportId: reportId || "",
    recipientCount: recipientCount || 0,
    timestamp: Utils_nowIso_()
  });

  return {
    ok: true,
    skipped: true,
    reason: reason
  };
}

function AdminNotificationService_logFailed_(reportId, error) {
  Security_safeLog_("ADMIN_NEW_REPORT_EMAIL_FAILED", {
    reportId: reportId || "",
    errorName: error && error.name ? error.name : "Error",
    errorMessage: error && error.message ? error.message : String(error || ""),
    timestamp: Utils_nowIso_()
  });
}

function runTestAdminNewReportEmailForDevOnly() {
  if (Config_getEnvironment_() === "production") {
    throw ApiError_("FORBIDDEN", "Manual notification test is available only outside production");
  }

  const result = AdminNotificationService_notifyNewReportSafe_({
    report_id: "REPORT-TEST-NOTIFICATION",
    tracking_code: "TEST-KPR-0001",
    title: "ทดสอบระบบแจ้งเตือนผู้ดูแล",
    category_id: "TEST",
    village_no: "หมู่ 1",
    priority: "normal",
    status: "new",
    is_anonymous: true,
    created_at: Utils_nowIso_()
  }, {
    category: {
      name: "ทดสอบ"
    }
  });

  console.log(JSON.stringify(result));
  return result;
}
