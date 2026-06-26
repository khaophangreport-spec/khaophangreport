function CategoryService_listPublic(request) {
  const cachedData = SettingsService_getCachedJson_(CACHE_KEYS_.CATEGORY_LIST);

  if (cachedData) {
    return {
      data: cachedData,
      message: "โหลดหมวดปัญหาสำเร็จ"
    };
  }

  const categories = SheetRepository_list_("categories", {
    keyColumnName: "code",
    page: 1,
    pageSize: 100
  }).items.filter(function (category) {
    return Utils_toBoolean_(category.is_active);
  }).sort(function (left, right) {
    return Number(left.sort_order || 0) - Number(right.sort_order || 0);
  }).map(CategoryService_projectPublic_);

  const data = {
    items: categories
  };

  SettingsService_putCachedJson_(CACHE_KEYS_.CATEGORY_LIST, data, CACHE_TTL_SECONDS_.CATEGORY_LIST);

  return {
    data: data,
    message: "โหลดหมวดปัญหาสำเร็จ"
  };
}

function CategoryService_projectPublic_(category) {
  return {
    categoryId: String(category.category_id || ""),
    code: String(category.code || ""),
    name: Security_sanitizeText_(category.name),
    description: Security_sanitizeText_(category.description),
    icon: Security_sanitizeText_(category.icon || "circle"),
    color: CategoryService_normalizeColor_(category.color),
    targetDays: Number(category.target_days || 0)
  };
}

function CategoryService_normalizeColor_(value) {
  const color = String(value || "#287444").trim();

  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#287444";
}

function CategoryService_clearPublicCache_() {
  CacheService.getScriptCache().remove(CACHE_KEYS_.CATEGORY_LIST);
}
