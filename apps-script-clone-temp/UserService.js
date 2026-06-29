const USER_PASSWORD_VERSION_ = 1;
const USER_PASSWORD_MIN_LENGTH_ = 8;
const USER_FAILED_LOGIN_LIMIT_ = 5;
const USER_LOCK_SECONDS_ = 15 * 60;
const USER_ROLE_VALUES_ = Object.freeze(["super_admin", "admin", "officer", "viewer"]);
const USER_STATUS_VALUES_ = Object.freeze(["active", "inactive"]);

const USER_ROLE_PERMISSIONS_ = Object.freeze({
  super_admin: Object.freeze([
    "admin.full",
    "report.read",
    "report.update",
    "report.assign",
    "user.manage",
    "settings.manage"
  ]),
  admin: Object.freeze([
    "report.read",
    "report.update",
    "report.assign",
    "announcement.manage"
  ]),
  officer: Object.freeze([
    "report.read",
    "report.update"
  ]),
  viewer: Object.freeze([
    "report.read"
  ])
});

function UserService_normalizeUsername_(value) {
  return Utils_normalizeString_(value).toLowerCase();
}

function UserService_findByUsername_(username) {
  const normalizedUsername = UserService_normalizeUsername_(username);
  const users = SheetRepository_batchRead_("users", {
    keyColumnName: "user_id",
    includeDeleted: true
  }).objects;

  return users.filter(function (user) {
    return UserService_normalizeUsername_(user.username) === normalizedUsername;
  })[0] || null;
}

function UserService_isActive_(user) {
  return !!user &&
    Utils_normalizeString_(user.status).toLowerCase() === "active" &&
    !Utils_toBoolean_(user.is_deleted);
}

function UserService_isLocked_(user) {
  if (!user || !user.locked_until) {
    return false;
  }

  const lockedUntil = new Date(user.locked_until);

  return !isNaN(lockedUntil.getTime()) && lockedUntil.getTime() > new Date().getTime();
}

function UserService_getLockUntilIso_() {
  return new Date(new Date().getTime() + USER_LOCK_SECONDS_ * 1000).toISOString();
}

function UserService_verifyPassword_(user, password) {
  if (!user || !user.password_hash || !user.password_salt) {
    return false;
  }

  const candidateHash = Security_hashPassword_(password, user.password_salt);

  return Security_constantTimeEquals_(candidateHash, user.password_hash);
}

function UserService_recordLoginFailure_(user, lockUntilIso) {
  const failedCount = Number(user.failed_login_count || 0) + 1;
  const updates = {
    failed_login_count: failedCount
  };

  if (failedCount >= USER_FAILED_LOGIN_LIMIT_) {
    updates.locked_until = lockUntilIso || UserService_getLockUntilIso_();
  }

  return SheetRepository_updateById_("users", "user_id", user.user_id, updates, {
    userId: "system",
    includeDeleted: true
  });
}

function UserService_recordLoginSuccess_(user, nowIso) {
  return SheetRepository_updateById_("users", "user_id", user.user_id, {
    failed_login_count: 0,
    locked_until: "",
    last_login_at: nowIso || Utils_nowIso_()
  }, {
    userId: user.user_id,
    includeDeleted: true
  });
}

function UserService_updatePassword_(user, newPassword, options) {
  const safeOptions = options || {};
  const salt = Security_generateSalt_();
  const now = Utils_nowIso_();

  return SheetRepository_updateById_("users", "user_id", user.user_id, {
    password_hash: Security_hashPassword_(newPassword, salt),
    password_salt: salt,
    password_version: Number(user.password_version || 0) + 1,
    last_password_changed_at: now,
    must_change_password: false,
    failed_login_count: 0,
    locked_until: ""
  }, {
    userId: safeOptions.userId || user.user_id,
    includeDeleted: true
  });
}

function UserService_validatePassword_(password, fieldName, fields) {
  const value = String(password || "");
  const targetField = fieldName || "password";

  if (!value) {
    fields[targetField] = "กรุณากรอกรหัสผ่าน";
    return;
  }

  if (value.length < USER_PASSWORD_MIN_LENGTH_) {
    fields[targetField] = "รหัสผ่านต้องมีอย่างน้อย " + USER_PASSWORD_MIN_LENGTH_ + " ตัวอักษร";
    return;
  }

  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    fields[targetField] = "รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข";
    return;
  }

  if (/^(.)\1+$/.test(value) || /password|12345678|admin/i.test(value)) {
    fields[targetField] = "รหัสผ่านอ่อนเกินไป";
  }
}

function UserService_projectAuthUser_(user) {
  return {
    userId: String(user.user_id || ""),
    displayName: Security_sanitizeText_(user.display_name || ""),
    role: Security_sanitizeText_(user.role || ""),
    mustChangePassword: Utils_toBoolean_(user.must_change_password)
  };
}

function UserService_projectMe_(user) {
  return {
    userId: String(user.user_id || ""),
    displayName: Security_sanitizeText_(user.display_name || ""),
    email: Security_sanitizeText_(user.email || ""),
    phone: Security_sanitizeText_(user.phone || ""),
    role: Security_sanitizeText_(user.role || ""),
    permissions: UserService_getPermissions_(user.role),
    mustChangePassword: Utils_toBoolean_(user.must_change_password)
  };
}

function UserService_getPermissions_(role) {
  const normalizedRole = Utils_normalizeString_(role).toLowerCase();

  return (USER_ROLE_PERMISSIONS_[normalizedRole] || Object.freeze([])).slice();
}

function UserService_hasPermission_(permissions, permission) {
  const safePermissions = Array.isArray(permissions) ? permissions : [];

  return safePermissions.indexOf("admin.full") !== -1 || safePermissions.indexOf(permission) !== -1;
}

function UserService_assertPermission_(permissions, permission, message) {
  if (!UserService_hasPermission_(permissions, permission)) {
    throw ApiError_("FORBIDDEN", message || "Permission denied");
  }
}

function UserService_requireUserManageContext_(request) {
  const context = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const permissions = UserService_getPermissions_(context.user.role);

  UserService_assertPermission_(permissions, "user.manage", "No permission to manage users");

  return {
    session: context.session,
    user: context.user,
    permissions: permissions,
    requestId: request && request.requestId ? String(request.requestId) : ""
  };
}

function UserService_listAdmin(request) {
  const context = UserService_requireUserManageContext_(request);
  const query = UserService_normalizeAdminListQuery_(request && request.data);
  const users = SheetRepository_batchRead_("users", {
    keyColumnName: "user_id",
    includeDeleted: false
  }).objects;
  const filtered = UserService_filterAdminUsers_(users, query);
  const sorted = UserService_sortAdminUsers_(filtered);
  const page = SheetRepository_paginate_(sorted, query.page, query.pageSize);

  return {
    data: {
      items: page.items.map(UserService_projectAdminUser_),
      pagination: page.pagination,
      filters: {
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        role: query.role,
        status: query.status
      },
      roles: USER_ROLE_VALUES_.slice(),
      statuses: USER_STATUS_VALUES_.slice(),
      permissions: UserService_buildAdminUserPermissions_(context.permissions)
    },
    message: "Loaded users"
  };
}

function UserService_saveAdmin(request) {
  const lock = LockService.getScriptLock();
  const context = UserService_requireUserManageContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  lock.waitLock(30000);

  try {
    const payload = UserService_normalizeAdminSavePayload_(request && request.data);

    if (payload.userId) {
      return UserService_updateAdminUser_(payload, context, requestId);
    }

    return UserService_createAdminUser_(payload, context, requestId);
  } finally {
    lock.releaseLock();
  }
}

function UserService_resetPasswordAdmin(request) {
  const lock = LockService.getScriptLock();
  const context = UserService_requireUserManageContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  lock.waitLock(30000);

  try {
    const payload = UserService_normalizeResetPasswordPayload_(request && request.data);
    const user = UserService_findAdminUserById_(payload.userId);
    const temporaryPassword = payload.temporaryPassword || UserService_generateTemporaryPassword_();
    const fields = {};

    UserService_validatePassword_(temporaryPassword, "temporaryPassword", fields);

    if (Object.keys(fields).length > 0) {
      throw ApiError_("VALIDATION_ERROR", "Invalid temporary password", fields);
    }

    const updatedUser = UserService_updatePasswordForReset_(user, temporaryPassword, {
      userId: context.user.user_id,
      expectedVersion: payload.version
    });
    let revokeResult = {
      revokedCount: 0
    };

    if (payload.revokeSessions !== false) {
      revokeResult = SessionService_revokeAllForUser_(updatedUser.user_id, "password_reset", {
        userId: context.user.user_id
      });
    }

    AuditService_logAdminUserPasswordReset_(updatedUser, context.user, requestId, revokeResult.revokedCount);

    return {
      data: {
        user: UserService_projectAdminUser_(updatedUser),
        temporaryPassword: temporaryPassword,
        revokedSessions: revokeResult.revokedCount || 0
      },
      message: "Password reset"
    };
  } finally {
    lock.releaseLock();
  }
}

function UserService_revokeSessionsAdmin(request) {
  const lock = LockService.getScriptLock();
  const context = UserService_requireUserManageContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  lock.waitLock(30000);

  try {
    const payload = UserService_normalizeRevokeSessionsPayload_(request && request.data);
    const user = UserService_findAdminUserById_(payload.userId);

    SheetRepository_assertVersion_(user.version, payload.version);

    const revokeResult = SessionService_revokeAllForUser_(user.user_id, payload.reason || "admin_revoked", {
      userId: context.user.user_id
    });

    AuditService_logAdminUserSessionsRevoked_(user, context.user, requestId, revokeResult.revokedCount, payload.reason);

    return {
      data: {
        userId: String(user.user_id || ""),
        revokedSessions: revokeResult.revokedCount || 0
      },
      message: "Sessions revoked"
    };
  } finally {
    lock.releaseLock();
  }
}

function UserService_createUser_(userInput, options) {
  const safeOptions = options || {};
  const input = userInput || {};
  const fields = {};
  const username = UserService_normalizeUsername_(input.username);
  const password = String(input.password || input.temporaryPassword || "");
  const role = Utils_normalizeString_(input.role || "viewer").toLowerCase();
  const now = Utils_nowIso_();

  if (!username) {
    fields.username = "กรุณากรอกชื่อผู้ใช้";
  }

  if (UserService_findByUsername_(username)) {
    fields.username = "ชื่อผู้ใช้นี้มีอยู่แล้ว";
  }

  UserService_validatePassword_(password, "password", fields);

  if (!USER_ROLE_PERMISSIONS_[role]) {
    fields.role = "Role ไม่ถูกต้อง";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูล", fields);
  }

  const salt = Security_generateSalt_();
  const userId = Utils_createUuid_();
  const record = {
    user_id: userId,
    username: username,
    password_hash: Security_hashPassword_(password, salt),
    password_salt: salt,
    password_version: USER_PASSWORD_VERSION_,
    display_name: Security_sanitizeUserText_(input.displayName || username, 120),
    email: Security_sanitizeUserText_(input.email || "", 120),
    phone: Security_sanitizeUserText_(input.phone || "", 30),
    role: role,
    status: "active",
    failed_login_count: 0,
    locked_until: "",
    last_login_at: "",
    last_password_changed_at: now,
    must_change_password: input.mustChangePassword === false ? false : true,
    created_at: now,
    updated_at: now,
    created_by: safeOptions.createdBy || "setup",
    updated_by: safeOptions.createdBy || "setup",
    is_deleted: false,
    version: 1
  };

  return SheetRepository_append_("users", record, {
    keyColumnName: "user_id",
    userId: safeOptions.createdBy || "setup"
  });
}

function UserService_hasAnyUser_() {
  return SheetRepository_batchRead_("users", {
    keyColumnName: "user_id",
    includeDeleted: false
  }).objects.length > 0;
}

function UserService_normalizeAdminListQuery_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const role = Utils_normalizeString_(input.role).toLowerCase();
  const status = Utils_normalizeString_(input.status).toLowerCase();

  return {
    page: Utils_clampInteger_(input.page, 1, 1, 1000000),
    pageSize: Utils_clampInteger_(input.pageSize, 20, 1, 100),
    keyword: Utils_normalizeString_(input.keyword).toLowerCase(),
    role: USER_ROLE_VALUES_.indexOf(role) !== -1 ? role : "",
    status: USER_STATUS_VALUES_.indexOf(status) !== -1 ? status : ""
  };
}

function UserService_filterAdminUsers_(users, query) {
  return (users || []).filter(function (user) {
    const role = Utils_normalizeString_(user.role).toLowerCase();
    const status = Utils_normalizeString_(user.status).toLowerCase();

    if (query.role && role !== query.role) {
      return false;
    }

    if (query.status && status !== query.status) {
      return false;
    }

    if (query.keyword) {
      const searchText = [
        user.username,
        user.display_name,
        user.email,
        user.phone,
        user.role,
        user.status
      ].join(" ").toLowerCase();

      return searchText.indexOf(query.keyword) !== -1;
    }

    return true;
  });
}

function UserService_sortAdminUsers_(users) {
  return (users || []).slice().sort(function (a, b) {
    const aName = UserService_normalizeUsername_(a.username || a.display_name || "");
    const bName = UserService_normalizeUsername_(b.username || b.display_name || "");

    if (aName < bName) {
      return -1;
    }

    if (aName > bName) {
      return 1;
    }

    return 0;
  });
}

function UserService_projectAdminUser_(user) {
  return {
    userId: String(user && user.user_id ? user.user_id : ""),
    username: Security_sanitizeText_(user && user.username ? user.username : ""),
    displayName: Security_sanitizeText_(user && user.display_name ? user.display_name : ""),
    email: Security_sanitizeText_(user && user.email ? user.email : ""),
    phone: Security_sanitizeText_(user && user.phone ? user.phone : ""),
    role: Security_sanitizeText_(user && user.role ? user.role : ""),
    status: Security_sanitizeText_(user && user.status ? user.status : ""),
    failedLoginCount: Number(user && user.failed_login_count ? user.failed_login_count : 0),
    isLocked: UserService_isLocked_(user),
    lockedUntil: String(user && user.locked_until ? user.locked_until : ""),
    lastLoginAt: String(user && user.last_login_at ? user.last_login_at : ""),
    lastPasswordChangedAt: String(user && user.last_password_changed_at ? user.last_password_changed_at : ""),
    mustChangePassword: Utils_toBoolean_(user && user.must_change_password),
    createdAt: String(user && user.created_at ? user.created_at : ""),
    updatedAt: String(user && user.updated_at ? user.updated_at : ""),
    version: Number(user && user.version ? user.version : 0)
  };
}

function UserService_buildAdminUserPermissions_(permissions) {
  return {
    canRead: UserService_hasPermission_(permissions, "user.manage"),
    canSave: UserService_hasPermission_(permissions, "user.manage"),
    canResetPassword: UserService_hasPermission_(permissions, "user.manage"),
    canRevokeSessions: UserService_hasPermission_(permissions, "user.manage")
  };
}

function UserService_normalizeAdminSavePayload_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const payload = {
    userId: Utils_normalizeString_(input.userId),
    username: UserService_normalizeUsername_(input.username),
    displayName: Security_sanitizeUserText_(input.displayName || "", 120),
    email: Security_sanitizeUserText_(input.email || "", 120),
    phone: Security_sanitizeUserText_(input.phone || "", 30),
    role: Utils_normalizeString_(input.role || "viewer").toLowerCase(),
    status: Utils_normalizeString_(input.status || "active").toLowerCase(),
    temporaryPassword: String(input.temporaryPassword || ""),
    mustChangePassword: input.mustChangePassword === false ? false : true,
    version: input.version
  };
  const fields = {};

  UserService_validateAdminUserBasics_(payload, fields);

  if (!payload.userId) {
    if (!payload.temporaryPassword) {
      payload.temporaryPassword = UserService_generateTemporaryPassword_();
    }
    UserService_validatePassword_(payload.temporaryPassword, "temporaryPassword", fields);
  } else if (payload.version === undefined || payload.version === null || payload.version === "") {
    fields.version = "Version is required";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "Invalid user data", fields);
  }

  return payload;
}

function UserService_validateAdminUserBasics_(payload, fields) {
  if (!payload.username) {
    fields.username = "Username is required";
  } else if (!/^[a-z0-9._-]{3,40}$/.test(payload.username)) {
    fields.username = "Username must be 3-40 characters using letters, numbers, dot, dash or underscore";
  }

  if (!payload.displayName) {
    fields.displayName = "Display name is required";
  }

  if (USER_ROLE_VALUES_.indexOf(payload.role) === -1) {
    fields.role = "Invalid role";
  }

  if (USER_STATUS_VALUES_.indexOf(payload.status) === -1) {
    fields.status = "Invalid status";
  }
}

function UserService_createAdminUser_(payload, context, requestId) {
  UserService_assertUsernameUnique_(payload.username, "");

  const now = Utils_nowIso_();
  const salt = Security_generateSalt_();
  const record = {
    user_id: Utils_createUuid_(),
    username: payload.username,
    password_hash: Security_hashPassword_(payload.temporaryPassword, salt),
    password_salt: salt,
    password_version: USER_PASSWORD_VERSION_,
    display_name: payload.displayName || payload.username,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    status: payload.status,
    failed_login_count: 0,
    locked_until: "",
    last_login_at: "",
    last_password_changed_at: now,
    must_change_password: true,
    created_at: now,
    updated_at: now,
    created_by: context.user.user_id,
    updated_by: context.user.user_id,
    is_deleted: false,
    version: 1
  };
  const createdUser = SheetRepository_append_("users", record, {
    keyColumnName: "user_id",
    userId: context.user.user_id
  });

  AuditService_logAdminUserSaved_(null, createdUser, context.user, requestId, true);

  return {
    data: {
      user: UserService_projectAdminUser_(createdUser),
      temporaryPassword: payload.temporaryPassword
    },
    message: "User created"
  };
}

function UserService_updateAdminUser_(payload, context, requestId) {
  const user = UserService_findAdminUserById_(payload.userId);

  UserService_assertUsernameUnique_(payload.username, user.user_id);
  UserService_assertCanChangeSuperAdminState_(user, payload, UserService_countActiveSuperAdmins_());

  const updatedUser = SheetRepository_updateById_("users", "user_id", user.user_id, {
    username: payload.username,
    display_name: payload.displayName || payload.username,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    status: payload.status,
    must_change_password: payload.mustChangePassword
  }, {
    userId: context.user.user_id,
    expectedVersion: payload.version
  });

  AuditService_logAdminUserSaved_(user, updatedUser, context.user, requestId, false);

  return {
    data: {
      user: UserService_projectAdminUser_(updatedUser)
    },
    message: "User saved"
  };
}

function UserService_findAdminUserById_(userId) {
  const normalizedUserId = Utils_normalizeString_(userId);

  if (!normalizedUserId) {
    throw ApiError_("VALIDATION_ERROR", "User is required", {
      userId: "User is required"
    });
  }

  const user = SheetRepository_findById_("users", "user_id", normalizedUserId, {
    keyColumnName: "user_id",
    includeDeleted: false
  });

  if (!user || Utils_toBoolean_(user.is_deleted)) {
    throw ApiError_("NOT_FOUND", "User not found");
  }

  return user;
}

function UserService_assertUsernameUnique_(username, exceptUserId) {
  const existing = UserService_findByUsername_(username);

  if (existing && String(existing.user_id || "") !== String(exceptUserId || "")) {
    throw ApiError_("VALIDATION_ERROR", "Invalid user data", {
      username: "Username already exists"
    });
  }
}

function UserService_countActiveSuperAdmins_() {
  return SheetRepository_batchRead_("users", {
    keyColumnName: "user_id",
    includeDeleted: false
  }).objects.filter(function (user) {
    return UserService_isActiveSuperAdmin_(user);
  }).length;
}

function UserService_isActiveSuperAdmin_(user) {
  return !!user &&
    Utils_normalizeString_(user.role).toLowerCase() === "super_admin" &&
    UserService_isActive_(user);
}

function UserService_willBeActiveSuperAdmin_(payload) {
  return !!payload &&
    Utils_normalizeString_(payload.role).toLowerCase() === "super_admin" &&
    Utils_normalizeString_(payload.status).toLowerCase() === "active";
}

function UserService_isClosingLastActiveSuperAdmin_(currentUser, payload, activeSuperAdminCount) {
  return UserService_isActiveSuperAdmin_(currentUser) &&
    !UserService_willBeActiveSuperAdmin_(payload) &&
    Number(activeSuperAdminCount || 0) <= 1;
}

function UserService_assertCanChangeSuperAdminState_(currentUser, payload, activeSuperAdminCount) {
  if (UserService_isClosingLastActiveSuperAdmin_(currentUser, payload, activeSuperAdminCount)) {
    throw ApiError_("FORBIDDEN", "Cannot disable the last active super admin");
  }
}

function UserService_normalizeResetPasswordPayload_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const payload = {
    userId: Utils_normalizeString_(input.userId),
    temporaryPassword: String(input.temporaryPassword || ""),
    revokeSessions: input.revokeSessions !== false,
    version: input.version
  };
  const fields = {};

  if (!payload.userId) {
    fields.userId = "User is required";
  }

  if (payload.version === undefined || payload.version === null || payload.version === "") {
    fields.version = "Version is required";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "Invalid password reset request", fields);
  }

  return payload;
}

function UserService_normalizeRevokeSessionsPayload_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const payload = {
    userId: Utils_normalizeString_(input.userId),
    reason: Utils_normalizeString_(input.reason || "admin_revoked"),
    version: input.version
  };
  const fields = {};

  if (!payload.userId) {
    fields.userId = "User is required";
  }

  if (payload.version === undefined || payload.version === null || payload.version === "") {
    fields.version = "Version is required";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "Invalid revoke session request", fields);
  }

  return payload;
}

function UserService_generateTemporaryPassword_() {
  return "Kpr" + Utilities.getUuid().replace(/-/g, "").substring(0, 10) + "7";
}

function UserService_buildPasswordResetUpdates_(user, temporaryPassword, nowIso) {
  const salt = Security_generateSalt_();

  return {
    password_hash: Security_hashPassword_(temporaryPassword, salt),
    password_salt: salt,
    password_version: Number(user && user.password_version ? user.password_version : 0) + 1,
    last_password_changed_at: nowIso || Utils_nowIso_(),
    must_change_password: true,
    failed_login_count: 0,
    locked_until: ""
  };
}

function UserService_updatePasswordForReset_(user, temporaryPassword, options) {
  const safeOptions = options || {};
  const updates = UserService_buildPasswordResetUpdates_(user, temporaryPassword, Utils_nowIso_());

  return SheetRepository_updateById_("users", "user_id", user.user_id, updates, {
    userId: safeOptions.userId || "system",
    expectedVersion: safeOptions.expectedVersion,
    includeDeleted: false
  });
}
