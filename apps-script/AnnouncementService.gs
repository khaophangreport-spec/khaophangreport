var AnnouncementService = (function () {
  function listPublic(request) {
    var data = request.data || {};
    var limit = normalizeAnnouncementLimit_(data.limit);
    var cacheKey = APP_CACHE_KEYS.ANNOUNCEMENT_LIST_PREFIX + limit;
    var cached = getCachedJson_(cacheKey);

    if (cached) {
      return createSuccessResponse_(cached, 'โหลดประกาศสำเร็จ', request.requestId);
    }

    var now = new Date();
    var announcements = SheetRepository.list('announcements', {
      paginate: false,
      predicate: function (announcement) {
        return isActiveBoolean_(announcement.is_active);
      }
    }).items.sort(function (left, right) {
      return Number(left.sort_order || 0) - Number(right.sort_order || 0);
    }).filter(function (announcement) {
      return isAnnouncementVisible_(announcement, now);
    }).slice(0, limit);

    var responseData = {
      items: announcements.map(toPublicAnnouncement_)
    };

    putCachedJson_(cacheKey, responseData, APP_CACHE_TTL_SECONDS.ANNOUNCEMENT_LIST);

    return createSuccessResponse_(responseData, 'โหลดประกาศสำเร็จ', request.requestId);
  }

  function normalizeAnnouncementLimit_(limit) {
    var numberValue = Number(limit);

    if (!numberValue || numberValue < 1) {
      return 5;
    }

    return Math.min(Math.floor(numberValue), 20);
  }

  function isAnnouncementVisible_(announcement, now) {
    var startAt = parseOptionalDate_(announcement.start_at);
    var endAt = parseOptionalDate_(announcement.end_at);

    if (startAt && startAt.getTime() > now.getTime()) {
      return false;
    }

    if (endAt && endAt.getTime() < now.getTime()) {
      return false;
    }

    return true;
  }

  function isActiveBoolean_(value) {
    return value === true || String(value).toLowerCase() === 'true';
  }

  function parseOptionalDate_(value) {
    if (!value) {
      return null;
    }

    var date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  function toPublicAnnouncement_(announcement) {
    return {
      announcementId: announcement.announcement_id,
      title: sanitizeString_(announcement.title || ''),
      content: sanitizeString_(announcement.content || ''),
      type: announcement.type || 'info',
      startAt: announcement.start_at || '',
      endAt: announcement.end_at || ''
    };
  }

  function clearPublicCache() {
    removeCachedJson_(APP_CACHE_KEYS.ANNOUNCEMENT_LIST_PREFIX + '5');
  }

  return {
    clearPublicCache: clearPublicCache,
    listPublic: listPublic
  };
})();
