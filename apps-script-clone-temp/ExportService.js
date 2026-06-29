const EXPORT_TYPES_ = Object.freeze(["reports", "timeline", "summary"]);
const EXPORT_REPORT_STATUS_VALUES_ = Object.freeze(["new", "reviewing", "assigned", "in_progress", "waiting", "resolved", "closed", "rejected", "duplicate"]);
const EXPORT_MAX_ROWS_ = 5000;
const EXPORT_MAX_RANGE_DAYS_ = 366;
const EXPORT_MIME_TYPE_ = "text/csv;charset=utf-8";

function ExportService_exportCsvAdmin(request) {
  const context = ExportService_requireAdminContext_(request);
  const payload = ExportService_normalizePayload_(request && request.data);

  if (payload.includePersonalData && !ExportService_canIncludePersonalData_(context.permissions)) {
    throw ApiError_("FORBIDDEN", "ไม่มีสิทธิ์ส่งออกข้อมูลส่วนบุคคล");
  }

  const reports = ExportService_readReports_();
  const filteredReports = ExportService_filterReports_(reports, payload.filters);
  const readModel = ExportService_readModel_(payload.exportType, filteredReports, reports);
  const rows = ExportService_buildRows_(payload.exportType, filteredReports, readModel, payload.includePersonalData);
  const limitedRows = rows.slice(0, EXPORT_MAX_ROWS_);
  const truncated = rows.length > EXPORT_MAX_ROWS_;
  const csv = ExportService_buildCsv_(rows.headers || [], limitedRows);
  const fileName = ExportService_buildFileName_(payload);
  const contentBase64 = Utilities.base64Encode(Utilities.newBlob(csv, EXPORT_MIME_TYPE_, fileName).getBytes());
  const exportLog = ExportService_appendExportLog_({
    exportType: payload.exportType,
    filters: payload.filters,
    includePersonalData: payload.includePersonalData,
    rowCount: limitedRows.length,
    actor: context.user
  });

  AuditService_logExportCsvCreated_(exportLog, context.user, request && request.requestId, {
    truncated: truncated,
    dateFrom: payload.filters.dateFrom,
    dateTo: payload.filters.dateTo
  });

  return {
    data: {
      exportId: exportLog.export_id,
      fileName: fileName,
      mimeType: EXPORT_MIME_TYPE_,
      contentBase64: contentBase64,
      rowCount: limitedRows.length,
      totalMatchedRows: rows.length,
      maxRows: EXPORT_MAX_ROWS_,
      truncated: truncated,
      includePersonalData: payload.includePersonalData,
      exportType: payload.exportType,
      permissions: ExportService_buildPermissions_(context.permissions)
    },
    message: "สร้างไฟล์ส่งออกสำเร็จ"
  };
}

function ExportService_requireAdminContext_(request) {
  const sessionContext = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const user = sessionContext.user;
  const role = Utils_normalizeString_(user && user.role).toLowerCase();
  const permissions = UserService_getPermissions_(role);

  if (["super_admin", "admin", "viewer"].indexOf(role) === -1 ||
      !UserService_hasPermission_(permissions, "report.read")) {
    throw ApiError_("FORBIDDEN", "ไม่มีสิทธิ์ส่งออกข้อมูล");
  }

  return {
    session: sessionContext.session,
    user: user,
    permissions: permissions
  };
}

function ExportService_buildPermissions_(permissions) {
  return {
    canExport: UserService_hasPermission_(permissions, "report.read"),
    canIncludePersonalData: ExportService_canIncludePersonalData_(permissions)
  };
}

function ExportService_canIncludePersonalData_(permissions) {
  return UserService_hasPermission_(permissions || [], "export.personal_data");
}

function ExportService_normalizePayload_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const fields = {};
  const filtersInput = Utils_isPlainObject_(input.filters) ? input.filters : {};
  const payload = {
    exportType: Utils_normalizeString_(input.exportType || "reports").toLowerCase(),
    filters: {
      dateFrom: Utils_normalizeString_(filtersInput.dateFrom),
      dateTo: Utils_normalizeString_(filtersInput.dateTo),
      status: Utils_normalizeString_(filtersInput.status).toLowerCase(),
      categoryId: Utils_normalizeString_(filtersInput.categoryId),
      assigneeId: Utils_normalizeString_(filtersInput.assigneeId)
    },
    includePersonalData: Utils_toBoolean_(input.includePersonalData),
    confirmed: Utils_toBoolean_(input.confirmed)
  };

  if (EXPORT_TYPES_.indexOf(payload.exportType) === -1) {
    fields.exportType = "ประเภทส่งออกไม่ถูกต้อง";
  }

  ExportService_validateDateRange_(payload.filters.dateFrom, payload.filters.dateTo, fields);

  if (payload.filters.status && EXPORT_REPORT_STATUS_VALUES_.indexOf(payload.filters.status) === -1) {
    fields["filters.status"] = "สถานะไม่ถูกต้อง";
  }

  if (payload.includePersonalData && !payload.confirmed) {
    fields.confirmed = "กรุณายืนยันก่อนส่งออกข้อมูลส่วนบุคคล";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูลส่งออก", fields);
  }

  return payload;
}

function ExportService_validateDateRange_(dateFrom, dateTo, fields) {
  if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    fields["filters.dateFrom"] = "รูปแบบวันที่เริ่มต้นไม่ถูกต้อง";
  }

  if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    fields["filters.dateTo"] = "รูปแบบวันที่สิ้นสุดไม่ถูกต้อง";
  }

  if (dateFrom && dateTo && !fields["filters.dateFrom"] && !fields["filters.dateTo"]) {
    if (dateFrom > dateTo) {
      fields["filters.dateTo"] = "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น";
      return;
    }

    const fromTime = new Date(dateFrom + "T00:00:00.000Z").getTime();
    const toTime = new Date(dateTo + "T00:00:00.000Z").getTime();
    const days = Math.floor((toTime - fromTime) / (24 * 60 * 60 * 1000)) + 1;

    if (days > EXPORT_MAX_RANGE_DAYS_) {
      fields["filters.dateTo"] = "ช่วงวันที่ส่งออกต้องไม่เกิน " + EXPORT_MAX_RANGE_DAYS_ + " วัน";
    }
  }
}

function ExportService_readReports_() {
  return SheetRepository_batchRead_("reports", {
    keyColumnName: "report_id",
    includeDeleted: false
  }).objects;
}

function ExportService_readModel_(exportType, filteredReports, allReports) {
  const hasReports = (filteredReports || []).length > 0;
  const reports = allReports || ExportService_readReports_();
  const updates = hasReports && exportType === "timeline" ? SheetRepository_batchRead_("report_updates", {
    keyColumnName: "update_id",
    includeDeleted: false
  }).objects : [];
  const categories = hasReports ? SheetRepository_batchRead_("categories", {
    keyColumnName: "category_id",
    includeDeleted: false
  }).objects : [];
  const users = hasReports ? SheetRepository_batchRead_("users", {
    keyColumnName: "user_id",
    includeDeleted: false
  }).objects : [];

  return {
    reports: allReports || reports,
    updates: updates,
    categoryMap: ExportService_buildCategoryMap_(categories),
    userMap: ExportService_buildUserMap_(users),
    reportMap: ExportService_buildReportMap_(allReports || reports)
  };
}

function ExportService_buildCategoryMap_(categories) {
  const map = {};

  (categories || []).forEach(function (category) {
    map[String(category.category_id || "")] = category;
  });

  return map;
}

function ExportService_buildUserMap_(users) {
  const map = {};

  (users || []).forEach(function (user) {
    if (!Utils_toBoolean_(user.is_deleted)) {
      map[String(user.user_id || "")] = user;
    }
  });

  return map;
}

function ExportService_buildReportMap_(reports) {
  const map = {};

  (reports || []).forEach(function (report) {
    map[String(report.report_id || "")] = report;
  });

  return map;
}

function ExportService_filterReports_(reports, filters) {
  const safeFilters = filters || {};

  return (reports || []).filter(function (report) {
    if (Utils_toBoolean_(report.is_deleted)) {
      return false;
    }

    if (safeFilters.status && Utils_normalizeString_(report.status).toLowerCase() !== safeFilters.status) {
      return false;
    }

    if (safeFilters.categoryId && String(report.category_id || "") !== safeFilters.categoryId) {
      return false;
    }

    if (safeFilters.assigneeId && String(report.assigned_to || "") !== safeFilters.assigneeId) {
      return false;
    }

    return ExportService_isDateInRange_(report.created_at, safeFilters.dateFrom, safeFilters.dateTo);
  }).sort(function (left, right) {
    return String(right.created_at || "").localeCompare(String(left.created_at || ""));
  });
}

function ExportService_isDateInRange_(value, dateFrom, dateTo) {
  const date = value ? String(value).slice(0, 10) : "";

  if (dateFrom && (!date || date < dateFrom)) {
    return false;
  }

  if (dateTo && (!date || date > dateTo)) {
    return false;
  }

  return true;
}

function ExportService_buildRows_(exportType, reports, model, includePersonalData) {
  if (exportType === "timeline") {
    return ExportService_buildTimelineRows_(reports, model, includePersonalData);
  }

  if (exportType === "summary") {
    return ExportService_buildSummaryRows_(reports, model);
  }

  return ExportService_buildReportRows_(reports, model, includePersonalData);
}

function ExportService_buildReportRows_(reports, model, includePersonalData) {
  const headers = [
    "tracking_code", "title", "category", "status", "priority", "created_at", "updated_at",
    "incident_date", "village_no", "location_name", "assignee", "target_due_at", "public_result"
  ];

  if (includePersonalData) {
    headers.push("description", "reporter_name", "reporter_phone", "reporter_email", "contact_method");
  }

  const items = (reports || []).map(function (report) {
    const row = {
      tracking_code: report.tracking_code,
      title: report.title,
      category: ExportService_getCategoryLabel_(model.categoryMap, report.category_id),
      status: report.status,
      priority: report.priority,
      created_at: report.created_at,
      updated_at: report.updated_at,
      incident_date: report.incident_date,
      village_no: report.village_no,
      location_name: report.location_name,
      assignee: ExportService_getUserLabel_(model.userMap, report.assigned_to),
      target_due_at: report.target_due_at,
      public_result: report.public_result
    };

    if (includePersonalData) {
      row.description = report.description;
      row.reporter_name = report.reporter_name;
      row.reporter_phone = report.reporter_phone;
      row.reporter_email = report.reporter_email;
      row.contact_method = report.contact_method;
    }

    return row;
  });

  items.headers = headers;
  return items;
}

function ExportService_buildTimelineRows_(reports, model, includePersonalData) {
  const reportIds = {};
  const headers = [
    "tracking_code", "report_title", "update_type", "old_status", "new_status",
    "public_message", "is_public", "updated_by", "created_at"
  ];

  if (includePersonalData) {
    headers.push("internal_note");
  }

  (reports || []).forEach(function (report) {
    reportIds[String(report.report_id || "")] = true;
  });

  const items = (model.updates || []).filter(function (update) {
    return !Utils_toBoolean_(update.is_deleted) && reportIds[String(update.report_id || "")];
  }).sort(function (left, right) {
    return String(right.created_at || "").localeCompare(String(left.created_at || ""));
  }).map(function (update) {
    const report = model.reportMap[String(update.report_id || "")] || {};
    const row = {
      tracking_code: report.tracking_code || "",
      report_title: report.title || "",
      update_type: update.update_type,
      old_status: update.old_status,
      new_status: update.new_status,
      public_message: update.public_message,
      is_public: Utils_toBoolean_(update.is_public) ? "TRUE" : "FALSE",
      updated_by: update.updated_by_name_snapshot || ExportService_getUserLabel_(model.userMap, update.updated_by),
      created_at: update.created_at
    };

    if (includePersonalData) {
      row.internal_note = update.internal_note;
    }

    return row;
  });

  items.headers = headers;
  return items;
}

function ExportService_buildSummaryRows_(reports, model) {
  const headers = ["summary_type", "key", "label", "count"];
  const items = [];

  ExportService_pushSummaryGroup_(items, "status", reports, function (report) {
    return Utils_normalizeString_(report.status) || "unknown";
  }, function (key) {
    return key;
  });
  ExportService_pushSummaryGroup_(items, "category", reports, function (report) {
    return String(report.category_id || "");
  }, function (key) {
    return ExportService_getCategoryLabel_(model.categoryMap, key) || "ไม่ระบุ";
  });
  ExportService_pushSummaryGroup_(items, "assignee", reports, function (report) {
    return String(report.assigned_to || "");
  }, function (key) {
    return key ? ExportService_getUserLabel_(model.userMap, key) : "ยังไม่มอบหมาย";
  });
  ExportService_pushSummaryGroup_(items, "village", reports, function (report) {
    return Utils_normalizeString_(report.village_no) || "unknown";
  }, function (key) {
    return key === "unknown" ? "ไม่ระบุ" : "หมู่ " + key;
  });
  ExportService_pushSummaryGroup_(items, "month", reports, function (report) {
    return Utils_normalizeString_(report.year_month || String(report.created_at || "").slice(0, 7)) || "unknown";
  }, function (key) {
    return key;
  });

  items.headers = headers;
  return items;
}

function ExportService_pushSummaryGroup_(items, type, reports, keyGetter, labelGetter) {
  const counts = {};

  (reports || []).forEach(function (report) {
    const key = keyGetter(report);
    counts[key] = (counts[key] || 0) + 1;
  });

  Object.keys(counts).sort().forEach(function (key) {
    items.push({
      summary_type: type,
      key: key,
      label: labelGetter(key),
      count: counts[key]
    });
  });
}

function ExportService_getCategoryLabel_(categoryMap, categoryId) {
  const category = categoryMap && categoryMap[String(categoryId || "")] ? categoryMap[String(categoryId || "")] : null;

  if (!category) {
    return String(categoryId || "");
  }

  return [category.code, category.name].filter(function (value) {
    return value;
  }).join(" - ");
}

function ExportService_getUserLabel_(userMap, userId) {
  const user = userMap && userMap[String(userId || "")] ? userMap[String(userId || "")] : null;

  if (!user) {
    return String(userId || "");
  }

  return user.display_name || user.username || String(userId || "");
}

function ExportService_buildCsv_(headers, rows) {
  const safeHeaders = headers || [];
  const lines = [];

  lines.push(safeHeaders.map(ExportService_escapeCsvCell_).join(","));
  (rows || []).forEach(function (row) {
    lines.push(safeHeaders.map(function (header) {
      return ExportService_escapeCsvCell_(row && row[header]);
    }).join(","));
  });

  return "\uFEFF" + lines.join("\r\n");
}

function ExportService_escapeCsvCell_(value) {
  let text = value === null || value === undefined ? "" : String(value);

  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  if (/[",\n]/.test(text)) {
    return "\"" + text.replace(/"/g, "\"\"") + "\"";
  }

  return text;
}

function ExportService_buildFileName_(payload) {
  const filters = payload && payload.filters ? payload.filters : {};
  const from = filters.dateFrom || "all";
  const to = filters.dateTo || "all";

  return Utils_sanitizeFileName_(["khaophang", payload.exportType || "reports", from, to].join("_")) + ".csv";
}

function ExportService_appendExportLog_(data) {
  const now = Utils_nowIso_();
  const record = {
    export_id: Utils_createUuid_(),
    user_id: data.actor && data.actor.user_id ? data.actor.user_id : "system",
    export_type: data.exportType,
    filters_json: JSON.stringify(ExportService_projectSafeFilters_(data.filters || {})),
    included_personal_data: !!data.includePersonalData,
    row_count: Number(data.rowCount || 0),
    file_id: "",
    created_at: now,
    expires_at: "",
    status: "success"
  };

  return SheetRepository_append_("export_logs", record, {
    keyColumnName: "export_id",
    userId: record.user_id
  });
}

function ExportService_projectSafeFilters_(filters) {
  return {
    dateFrom: filters.dateFrom || "",
    dateTo: filters.dateTo || "",
    status: filters.status || "",
    hasCategoryFilter: !!filters.categoryId,
    hasAssigneeFilter: !!filters.assigneeId
  };
}
