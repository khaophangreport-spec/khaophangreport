const USER_PASSWORD_VERSION_ = 1;
const USER_PASSWORD_MIN_LENGTH_ = 8;
const USER_FAILED_LOGIN_LIMIT_ = 5;
const USER_LOCK_SECONDS_ = 15 * 60;

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
