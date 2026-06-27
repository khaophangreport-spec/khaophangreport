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
    type: String(announcement.type || "info"),
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
