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

function CategoryService_getPublicById_(categoryId) {
  const category = SheetRepository_findById_("categories", "category_id", categoryId, {
    keyColumnName: "category_id"
  });

  if (!category || !Utils_toBoolean_(category.is_active)) {
    return {
      categoryId: "",
      code: "",
      name: "",
      description: "",
      icon: "circle",
      color: "#287444",
      targetDays: 0
    };
  }

  return CategoryService_projectPublic_(category);
}

function CategoryService_normalizeColor_(value) {
  const color = String(value || "#287444").trim();

  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#287444";
}

function CategoryService_clearPublicCache_() {
  CacheService.getScriptCache().remove(CACHE_KEYS_.CATEGORY_LIST);
}

function CategoryService_requireManageContext_(request) {
  const context = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const permissions = UserService_getPermissions_(context.user.role);

  UserService_assertPermission_(permissions, "settings.manage", "No permission to manage categories");

  return {
    session: context.session,
    user: context.user,
    permissions: permissions,
    requestId: request && request.requestId ? String(request.requestId) : ""
  };
}

function CategoryService_listAdmin(request) {
  const context = CategoryService_requireManageContext_(request);
  const query = CategoryService_normalizeAdminListQuery_(request && request.data);
  const categories = SheetRepository_batchRead_("categories", {
    keyColumnName: "category_id",
    includeDeleted: false
  }).objects;
  const filtered = CategoryService_filterAdminCategories_(categories, query);
  const sorted = CategoryService_sortAdminCategories_(filtered);
  const page = SheetRepository_paginate_(sorted, query.page, query.pageSize);

  return {
    data: {
      items: page.items.map(CategoryService_projectAdmin_),
      pagination: page.pagination,
      filters: {
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        includeInactive: query.includeInactive
      },
      permissions: CategoryService_buildAdminPermissions_(context.permissions)
    },
    message: "Loaded categories"
  };
}

function CategoryService_saveAdmin(request) {
  const lock = LockService.getScriptLock();
  const context = CategoryService_requireManageContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  lock.waitLock(30000);

  try {
    const payload = CategoryService_normalizeAdminSavePayload_(request && request.data);

    if (payload.categoryId) {
      return CategoryService_updateAdminCategory_(payload, context, requestId);
    }

    return CategoryService_createAdminCategory_(payload, context, requestId);
  } finally {
    lock.releaseLock();
  }
}

function CategoryService_normalizeAdminListQuery_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};

  return {
    page: Utils_clampInteger_(input.page, 1, 1, 1000000),
    pageSize: Utils_clampInteger_(input.pageSize, 20, 1, 100),
    keyword: Utils_normalizeString_(input.keyword).toLowerCase(),
    includeInactive: Utils_toBoolean_(input.includeInactive)
  };
}

function CategoryService_filterAdminCategories_(categories, query) {
  return (categories || []).filter(function (category) {
    if (!query.includeInactive && !Utils_toBoolean_(category.is_active)) {
      return false;
    }

    if (query.keyword) {
      const searchText = [
        category.code,
        category.name,
        category.description,
        category.icon,
        category.default_assignee
      ].join(" ").toLowerCase();

      return searchText.indexOf(query.keyword) !== -1;
    }

    return true;
  });
}

function CategoryService_sortAdminCategories_(categories) {
  return (categories || []).slice().sort(function (left, right) {
    const leftOrder = Number(left.sort_order || 0);
    const rightOrder = Number(right.sort_order || 0);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return String(left.code || left.name || "").localeCompare(String(right.code || right.name || ""));
  });
}

function CategoryService_projectAdmin_(category) {
  return {
    categoryId: String(category && category.category_id ? category.category_id : ""),
    code: String(category && category.code ? category.code : ""),
    name: Security_sanitizeText_(category && category.name ? category.name : ""),
    description: Security_sanitizeText_(category && category.description ? category.description : ""),
    icon: Security_sanitizeText_(category && category.icon ? category.icon : "circle"),
    color: CategoryService_normalizeColor_(category && category.color ? category.color : ""),
    defaultAssignee: String(category && category.default_assignee ? category.default_assignee : ""),
    targetDays: Number(category && category.target_days ? category.target_days : 0),
    sortOrder: Number(category && category.sort_order ? category.sort_order : 0),
    isActive: Utils_toBoolean_(category && category.is_active),
    createdAt: String(category && category.created_at ? category.created_at : ""),
    updatedAt: String(category && category.updated_at ? category.updated_at : ""),
    version: Number(category && category.version ? category.version : 0)
  };
}

function CategoryService_buildAdminPermissions_(permissions) {
  return {
    canRead: UserService_hasPermission_(permissions, "settings.manage"),
    canSave: UserService_hasPermission_(permissions, "settings.manage")
  };
}

function CategoryService_normalizeAdminSavePayload_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const payload = {
    categoryId: Utils_normalizeString_(input.categoryId),
    code: Utils_normalizeString_(input.code).toUpperCase(),
    name: Security_sanitizeUserText_(input.name || "", 120),
    description: Security_sanitizeUserText_(input.description || "", 500),
    icon: Utils_normalizeString_(input.icon || "circle").toLowerCase(),
    color: Utils_normalizeString_(input.color || "#287444"),
    defaultAssignee: Utils_normalizeString_(input.defaultAssignee),
    targetDays: parseInt(input.targetDays || 0, 10),
    sortOrder: parseInt(input.sortOrder || 0, 10),
    isActive: input.isActive === undefined || input.isActive === null || input.isActive === "" ? true : Utils_toBoolean_(input.isActive),
    version: input.version
  };
  const fields = {};

  CategoryService_validateAdminCategoryPayload_(payload, fields);

  if (payload.categoryId && (payload.version === undefined || payload.version === null || payload.version === "")) {
    fields.version = "Version is required";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "Invalid category data", fields);
  }

  payload.color = CategoryService_normalizeColor_(payload.color);

  return payload;
}

function CategoryService_validateAdminCategoryPayload_(payload, fields) {
  if (!payload.code) {
    fields.code = "Code is required";
  } else if (!/^[A-Z0-9_-]{2,40}$/.test(payload.code)) {
    fields.code = "Code must be 2-40 characters using A-Z, numbers, dash or underscore";
  }

  if (!payload.name) {
    fields.name = "Name is required";
  }

  if (!/^[a-z0-9-]{1,40}$/.test(payload.icon)) {
    fields.icon = "Icon must use lowercase letters, numbers or dash";
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(payload.color)) {
    fields.color = "Color must be a hex value";
  }

  if (!isFinite(payload.targetDays) || payload.targetDays < 0 || payload.targetDays > 365) {
    fields.targetDays = "Target days must be between 0 and 365";
  }

  if (!isFinite(payload.sortOrder) || payload.sortOrder < 0 || payload.sortOrder > 100000) {
    fields.sortOrder = "Sort order must be between 0 and 100000";
  }
}

function CategoryService_createAdminCategory_(payload, context, requestId) {
  CategoryService_assertCodeUnique_(payload.code, "");
  CategoryService_assertDefaultAssigneeValid_(payload.defaultAssignee);

  const now = Utils_nowIso_();
  const record = {
    category_id: Utils_createUuid_(),
    code: payload.code,
    name: payload.name,
    description: payload.description,
    icon: payload.icon,
    color: payload.color,
    default_assignee: payload.defaultAssignee,
    target_days: payload.targetDays,
    sort_order: payload.sortOrder,
    is_active: payload.isActive,
    created_at: now,
    updated_at: now,
    created_by: context.user.user_id,
    updated_by: context.user.user_id,
    version: 1
  };
  const createdCategory = SheetRepository_append_("categories", record, {
    keyColumnName: "category_id",
    userId: context.user.user_id
  });

  CategoryService_clearPublicCache_();
  AuditService_logAdminCategorySaved_(null, createdCategory, context.user, requestId, true);

  return {
    data: {
      category: CategoryService_projectAdmin_(createdCategory)
    },
    message: "Category created"
  };
}

function CategoryService_updateAdminCategory_(payload, context, requestId) {
  const category = CategoryService_findAdminById_(payload.categoryId);

  CategoryService_assertCodeUnique_(payload.code, category.category_id);
  CategoryService_assertDefaultAssigneeValid_(payload.defaultAssignee);

  const updatedCategory = SheetRepository_updateById_("categories", "category_id", category.category_id, {
    code: payload.code,
    name: payload.name,
    description: payload.description,
    icon: payload.icon,
    color: payload.color,
    default_assignee: payload.defaultAssignee,
    target_days: payload.targetDays,
    sort_order: payload.sortOrder,
    is_active: payload.isActive
  }, {
    userId: context.user.user_id,
    expectedVersion: payload.version
  });

  CategoryService_clearPublicCache_();
  AuditService_logAdminCategorySaved_(category, updatedCategory, context.user, requestId, false);

  return {
    data: {
      category: CategoryService_projectAdmin_(updatedCategory)
    },
    message: "Category saved"
  };
}

function CategoryService_findAdminById_(categoryId) {
  const normalizedCategoryId = Utils_normalizeString_(categoryId);

  if (!normalizedCategoryId) {
    throw ApiError_("VALIDATION_ERROR", "Category is required", {
      categoryId: "Category is required"
    });
  }

  const category = SheetRepository_findById_("categories", "category_id", normalizedCategoryId, {
    keyColumnName: "category_id",
    includeDeleted: false
  });

  if (!category) {
    throw ApiError_("NOT_FOUND", "Category not found");
  }

  return category;
}

function CategoryService_assertCodeUnique_(code, exceptCategoryId) {
  const duplicate = CategoryService_findDuplicateCode_(SheetRepository_batchRead_("categories", {
    keyColumnName: "category_id",
    includeDeleted: true
  }).objects, code, exceptCategoryId);

  if (duplicate) {
    throw ApiError_("VALIDATION_ERROR", "Invalid category data", {
      code: "Code already exists"
    });
  }
}

function CategoryService_findDuplicateCode_(categories, code, exceptCategoryId) {
  const normalizedCode = Utils_normalizeString_(code).toUpperCase();
  const normalizedExceptId = String(exceptCategoryId || "");

  return (categories || []).filter(function (category) {
    return Utils_normalizeString_(category.code).toUpperCase() === normalizedCode &&
      String(category.category_id || "") !== normalizedExceptId;
  })[0] || null;
}

function CategoryService_assertDefaultAssigneeValid_(defaultAssignee) {
  if (!defaultAssignee) {
    return;
  }

  const user = SheetRepository_findById_("users", "user_id", defaultAssignee, {
    keyColumnName: "user_id",
    includeDeleted: false
  });

  if (!UserService_isActive_(user)) {
    throw ApiError_("VALIDATION_ERROR", "Invalid category data", {
      defaultAssignee: "Default assignee must be an active user"
    });
  }
}
