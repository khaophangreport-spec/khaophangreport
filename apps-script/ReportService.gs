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
    mapUrl: Security_sanitizeUserText_(location.mapUrl, 500)
  };
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
