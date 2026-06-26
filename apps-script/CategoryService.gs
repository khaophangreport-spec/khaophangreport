var CategoryService = (function () {
  function listPublic(request) {
    var cached = getCachedJson_(APP_CACHE_KEYS.CATEGORY_LIST);

    if (cached) {
      return createSuccessResponse_(cached, 'โหลดหมวดปัญหาสำเร็จ', request.requestId);
    }

    var categories = SheetRepository.list('categories', {
      paginate: false,
      predicate: function (category) {
        return isActiveBoolean_(category.is_active);
      }
    }).items.sort(function (left, right) {
      return Number(left.sort_order || 0) - Number(right.sort_order || 0);
    });

    var data = {
      items: categories.map(toPublicCategory_)
    };

    putCachedJson_(APP_CACHE_KEYS.CATEGORY_LIST, data, APP_CACHE_TTL_SECONDS.CATEGORY_LIST);

    return createSuccessResponse_(data, 'โหลดหมวดปัญหาสำเร็จ', request.requestId);
  }

  function toPublicCategory_(category) {
    return {
      categoryId: category.category_id,
      code: category.code,
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'circle',
      color: category.color || '#287444',
      targetDays: Number(category.target_days) || 0
    };
  }

  function isActiveBoolean_(value) {
    return value === true || String(value).toLowerCase() === 'true';
  }

  function clearPublicCache() {
    removeCachedJson_(APP_CACHE_KEYS.CATEGORY_LIST);
  }

  return {
    clearPublicCache: clearPublicCache,
    listPublic: listPublic
  };
})();
