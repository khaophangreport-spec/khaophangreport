const ANNOUNCEMENT_TYPE_VALUES_ = Object.freeze(["info", "warning", "emergency", "maintenance"]);

function AnnouncementService_listPublic(request) {
  const data = request && request.data ? request.data : {};
  const limit = Utils_clampInteger_(data.limit, 5, 1, 20);
  const cacheKey = CACHE_KEYS_.ANNOUNCEMENT_LIST + "." + limit;
  const cachedData = SettingsService_getCachedJson_(cacheKey);

  if (cachedData) {
    return {
      data: cachedData,
      message: "โหลดประกาศสำเร็จ"
    };
  }

  const now = new Date();
  const announcements = SheetRepository_list_("announcements", {
    keyColumnName: "announcement_id",
    page: 1,
    pageSize: 100
  }).items.filter(function (announcement) {
    return AnnouncementService_isPublicVisible_(announcement, now);
  }).sort(function (left, right) {
    return Number(left.sort_order || 0) - Number(right.sort_order || 0);
  }).slice(0, limit).map(AnnouncementService_projectPublic_);
  const responseData = {
    items: announcements
  };

  SettingsService_putCachedJson_(cacheKey, responseData, CACHE_TTL_SECONDS_.ANNOUNCEMENT_LIST);

  return {
    data: responseData,
    message: "โหลดประกาศสำเร็จ"
  };
}

function AnnouncementService_isPublicVisible_(announcement, now) {
  if (!Utils_toBoolean_(announcement.is_active)) {
    return false;
  }

  if (Utils_toBoolean_(announcement.is_deleted)) {
    return false;
  }

  const startAt = AnnouncementService_parseOptionalDate_(announcement.start_at);
  const endAt = AnnouncementService_parseOptionalDate_(announcement.end_at);

  if (startAt && startAt.getTime() > now.getTime()) {
    return false;
  }

  if (endAt && endAt.getTime() < now.getTime()) {
    return false;
  }

  return true;
}

function AnnouncementService_parseOptionalDate_(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(value);

  return isNaN(date.getTime()) ? null : date;
}

function AnnouncementService_projectPublic_(announcement) {
  return {
    announcementId: String(announcement.announcement_id || ""),
    title: Security_sanitizeText_(announcement.title),
    content: Security_sanitizeText_(announcement.content),
    type: AnnouncementService_normalizeType_(announcement.type),
    startAt: AnnouncementService_formatDateValue_(announcement.start_at),
    endAt: AnnouncementService_formatDateValue_(announcement.end_at)
  };
}

function AnnouncementService_formatDateValue_(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  return String(value);
}

function AnnouncementService_clearPublicCache_() {
  const cacheKeys = [];

  for (let limit = 1; limit <= 20; limit += 1) {
    cacheKeys.push(CACHE_KEYS_.ANNOUNCEMENT_LIST + "." + limit);
  }

  CacheService.getScriptCache().removeAll(cacheKeys);
}

function AnnouncementService_requireManageContext_(request) {
  const context = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const permissions = UserService_getPermissions_(context.user.role);

  UserService_assertPermission_(permissions, "announcement.manage", "No permission to manage announcements");

  return {
    session: context.session,
    user: context.user,
    permissions: permissions,
    requestId: request && request.requestId ? String(request.requestId) : ""
  };
}

function AnnouncementService_listAdmin(request) {
  const context = AnnouncementService_requireManageContext_(request);
  const query = AnnouncementService_normalizeAdminListQuery_(request && request.data);
  const announcements = SheetRepository_batchRead_("announcements", {
    keyColumnName: "announcement_id",
    includeDeleted: false
  }).objects;
  const filtered = AnnouncementService_filterAdminAnnouncements_(announcements, query);
  const sorted = AnnouncementService_sortAdminAnnouncements_(filtered);
  const page = SheetRepository_paginate_(sorted, query.page, query.pageSize);

  return {
    data: {
      items: page.items.map(AnnouncementService_projectAdmin_),
      pagination: page.pagination,
      filters: {
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        type: query.type,
        status: query.status,
        includeInactive: query.includeInactive
      },
      types: ANNOUNCEMENT_TYPE_VALUES_.slice(),
      permissions: AnnouncementService_buildAdminPermissions_(context.permissions)
    },
    message: "Loaded announcements"
  };
}

function AnnouncementService_saveAdmin(request) {
  const lock = LockService.getScriptLock();
  const context = AnnouncementService_requireManageContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  lock.waitLock(30000);

  try {
    const payload = AnnouncementService_normalizeAdminSavePayload_(request && request.data);

    if (payload.announcementId) {
      return AnnouncementService_updateAdminAnnouncement_(payload, context, requestId);
    }

    return AnnouncementService_createAdminAnnouncement_(payload, context, requestId);
  } finally {
    lock.releaseLock();
  }
}

function AnnouncementService_normalizeAdminListQuery_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const type = Utils_normalizeString_(input.type).toLowerCase();
  const status = Utils_normalizeString_(input.status).toLowerCase();

  return {
    page: Utils_clampInteger_(input.page, 1, 1, 1000000),
    pageSize: Utils_clampInteger_(input.pageSize, 20, 1, 100),
    keyword: Utils_normalizeString_(input.keyword).toLowerCase(),
    type: ANNOUNCEMENT_TYPE_VALUES_.indexOf(type) !== -1 ? type : "",
    status: status === "active" || status === "inactive" ? status : "",
    includeInactive: Utils_toBoolean_(input.includeInactive)
  };
}

function AnnouncementService_filterAdminAnnouncements_(announcements, query) {
  return (announcements || []).filter(function (announcement) {
    const isActive = Utils_toBoolean_(announcement.is_active);

    if (query.status === "active" && !isActive) {
      return false;
    }

    if (query.status === "inactive" && isActive) {
      return false;
    }

    if (!query.status && !query.includeInactive && !isActive) {
      return false;
    }

    if (query.type && AnnouncementService_normalizeType_(announcement.type) !== query.type) {
      return false;
    }

    if (query.keyword) {
      const searchText = [
        announcement.title,
        announcement.content,
        announcement.type
      ].join(" ").toLowerCase();

      return searchText.indexOf(query.keyword) !== -1;
    }

    return true;
  });
}

function AnnouncementService_sortAdminAnnouncements_(announcements) {
  return (announcements || []).slice().sort(function (left, right) {
    const leftOrder = Number(left.sort_order || 0);
    const rightOrder = Number(right.sort_order || 0);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const leftStart = AnnouncementService_parseOptionalDate_(left.start_at);
    const rightStart = AnnouncementService_parseOptionalDate_(right.start_at);

    if (leftStart && rightStart && leftStart.getTime() !== rightStart.getTime()) {
      return rightStart.getTime() - leftStart.getTime();
    }

    return String(left.title || "").localeCompare(String(right.title || ""));
  });
}

function AnnouncementService_projectAdmin_(announcement) {
  return {
    announcementId: String(announcement && announcement.announcement_id ? announcement.announcement_id : ""),
    title: Security_sanitizeText_(announcement && announcement.title ? announcement.title : ""),
    content: Security_sanitizeText_(announcement && announcement.content ? announcement.content : ""),
    type: AnnouncementService_normalizeType_(announcement && announcement.type ? announcement.type : ""),
    startAt: AnnouncementService_formatDateValue_(announcement && announcement.start_at ? announcement.start_at : ""),
    endAt: AnnouncementService_formatDateValue_(announcement && announcement.end_at ? announcement.end_at : ""),
    isActive: Utils_toBoolean_(announcement && announcement.is_active),
    sortOrder: Number(announcement && announcement.sort_order ? announcement.sort_order : 0),
    createdAt: String(announcement && announcement.created_at ? announcement.created_at : ""),
    updatedAt: String(announcement && announcement.updated_at ? announcement.updated_at : ""),
    version: Number(announcement && announcement.version ? announcement.version : 0)
  };
}

function AnnouncementService_buildAdminPermissions_(permissions) {
  return {
    canRead: UserService_hasPermission_(permissions, "announcement.manage"),
    canSave: UserService_hasPermission_(permissions, "announcement.manage")
  };
}

function AnnouncementService_normalizeAdminSavePayload_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const nowIso = Utils_nowIso_();
  const payload = {
    announcementId: Utils_normalizeString_(input.announcementId),
    title: Security_sanitizeUserText_(input.title || "", 160),
    content: Security_sanitizeUserText_(input.content || "", 3000),
    type: Utils_normalizeString_(input.type || "info").toLowerCase(),
    startAt: AnnouncementService_normalizeDateInput_(input.startAt, nowIso),
    endAt: AnnouncementService_normalizeDateInput_(input.endAt, ""),
    isActive: input.isActive === undefined || input.isActive === null || input.isActive === "" ? true : Utils_toBoolean_(input.isActive),
    sortOrder: parseInt(input.sortOrder || 0, 10),
    version: input.version
  };
  const fields = {};

  AnnouncementService_validateAdminSavePayload_(payload, fields);

  if (payload.announcementId && (payload.version === undefined || payload.version === null || payload.version === "")) {
    fields.version = "Version is required";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "Invalid announcement data", fields);
  }

  return payload;
}

function AnnouncementService_validateAdminSavePayload_(payload, fields) {
  if (!payload.title) {
    fields.title = "Title is required";
  }

  if (!payload.content) {
    fields.content = "Content is required";
  }

  if (ANNOUNCEMENT_TYPE_VALUES_.indexOf(payload.type) === -1) {
    fields.type = "Invalid announcement type";
  }

  if (!payload.startAt) {
    fields.startAt = "Start date is required";
  }

  if (!AnnouncementService_parseOptionalDate_(payload.startAt)) {
    fields.startAt = "Start date is invalid";
  }

  if (payload.endAt && !AnnouncementService_parseOptionalDate_(payload.endAt)) {
    fields.endAt = "End date is invalid";
  }

  if (payload.startAt && payload.endAt) {
    const startAt = AnnouncementService_parseOptionalDate_(payload.startAt);
    const endAt = AnnouncementService_parseOptionalDate_(payload.endAt);

    if (startAt && endAt && endAt.getTime() < startAt.getTime()) {
      fields.endAt = "End date must not be before start date";
    }
  }

  if (!isFinite(payload.sortOrder) || payload.sortOrder < 0 || payload.sortOrder > 100000) {
    fields.sortOrder = "Sort order must be between 0 and 100000";
  }
}

function AnnouncementService_createAdminAnnouncement_(payload, context, requestId) {
  const now = Utils_nowIso_();
  const record = {
    announcement_id: Utils_createUuid_(),
    title: payload.title,
    content: payload.content,
    type: payload.type,
    start_at: payload.startAt || now,
    end_at: payload.endAt,
    is_active: payload.isActive,
    sort_order: payload.sortOrder,
    created_by: context.user.user_id,
    updated_by: context.user.user_id,
    created_at: now,
    updated_at: now,
    is_deleted: false,
    version: 1
  };
  const createdAnnouncement = SheetRepository_append_("announcements", record, {
    keyColumnName: "announcement_id",
    userId: context.user.user_id
  });

  AnnouncementService_clearPublicCache_();
  AuditService_logAdminAnnouncementSaved_(null, createdAnnouncement, context.user, requestId, true);

  return {
    data: {
      announcement: AnnouncementService_projectAdmin_(createdAnnouncement)
    },
    message: "Announcement created"
  };
}

function AnnouncementService_updateAdminAnnouncement_(payload, context, requestId) {
  const announcement = AnnouncementService_findAdminById_(payload.announcementId);
  const updatedAnnouncement = SheetRepository_updateById_("announcements", "announcement_id", announcement.announcement_id, {
    title: payload.title,
    content: payload.content,
    type: payload.type,
    start_at: payload.startAt,
    end_at: payload.endAt,
    is_active: payload.isActive,
    sort_order: payload.sortOrder
  }, {
    userId: context.user.user_id,
    expectedVersion: payload.version
  });

  AnnouncementService_clearPublicCache_();
  AuditService_logAdminAnnouncementSaved_(announcement, updatedAnnouncement, context.user, requestId, false);

  return {
    data: {
      announcement: AnnouncementService_projectAdmin_(updatedAnnouncement)
    },
    message: "Announcement saved"
  };
}

function AnnouncementService_findAdminById_(announcementId) {
  const normalizedAnnouncementId = Utils_normalizeString_(announcementId);

  if (!normalizedAnnouncementId) {
    throw ApiError_("VALIDATION_ERROR", "Announcement is required", {
      announcementId: "Announcement is required"
    });
  }

  const announcement = SheetRepository_findById_("announcements", "announcement_id", normalizedAnnouncementId, {
    keyColumnName: "announcement_id",
    includeDeleted: false
  });

  if (!announcement) {
    throw ApiError_("NOT_FOUND", "Announcement not found");
  }

  return announcement;
}

function AnnouncementService_normalizeType_(value) {
  const type = Utils_normalizeString_(value || "info").toLowerCase();

  return ANNOUNCEMENT_TYPE_VALUES_.indexOf(type) === -1 ? "info" : type;
}

function AnnouncementService_normalizeDateInput_(value, fallbackValue) {
  if (value === null || value === undefined || value === "") {
    return fallbackValue || "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  const normalized = Utils_normalizeString_(value);
  const parsed = new Date(normalized);

  if (isNaN(parsed.getTime())) {
    return normalized;
  }

  return parsed.toISOString();
}
