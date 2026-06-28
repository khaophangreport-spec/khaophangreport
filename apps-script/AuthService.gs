const AUTH_LOGIN_RATE_LIMIT_ = Object.freeze({
  limit: 5,
  windowSeconds: 15 * 60
});
const AUTH_GENERIC_LOGIN_MESSAGE_ = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
const RATE_LIMIT_CLEANUP_CACHE_KEY_ = "RATE_LIMIT_CLEANUP_RECENT";
const RATE_LIMIT_CLEANUP_INTERVAL_SECONDS_ = 6 * 60 * 60;
const RATE_LIMIT_CLEANUP_MAX_ROWS_ = 100;

function AuthService_login(request) {
  const data = request && Utils_isPlainObject_(request.data) ? request.data : {};
  const requestId = Utils_normalizeString_(request && request.requestId);
  const username = UserService_normalizeUsername_(data.username);
  const password = String(data.password || "");
  const deviceKey = Utils_normalizeString_(data.deviceKey);
  const fields = {};

  if (!requestId) {
    fields.requestId = "กรุณาระบุ Request ID";
  }

  if (!username) {
    fields.username = "กรุณากรอกชื่อผู้ใช้";
  }

  if (!password) {
    fields.password = "กรุณากรอกรหัสผ่าน";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูล", fields);
  }

  AuthService_checkLoginRateLimit_(username, deviceKey);

  const user = UserService_findByUsername_(username);
  const failureDetail = {
    username: username,
    reason: ""
  };

  if (!user || Utils_toBoolean_(user.is_deleted)) {
    failureDetail.reason = "not_found";
    AuditService_logAuthLoginFailed_(null, username, requestId, failureDetail.reason);
    AuthService_throwInvalidCredentials_();
  }

  if (!UserService_isActive_(user)) {
    failureDetail.reason = "inactive";
    UserService_recordLoginFailure_(user, UserService_getLockUntilIso_());
    AuditService_logAuthLoginFailed_(user, username, requestId, failureDetail.reason);
    AuthService_throwInvalidCredentials_();
  }

  if (UserService_isLocked_(user)) {
    failureDetail.reason = "locked";
    AuditService_logAuthLoginFailed_(user, username, requestId, failureDetail.reason);
    AuthService_throwInvalidCredentials_();
  }

  if (!UserService_verifyPassword_(user, password)) {
    failureDetail.reason = "password_mismatch";
    const updatedUser = UserService_recordLoginFailure_(user, UserService_getLockUntilIso_());
    AuditService_logAuthLoginFailed_(updatedUser, username, requestId, failureDetail.reason);
    AuthService_throwInvalidCredentials_();
  }

  const now = Utils_nowIso_();
  const updatedUser = UserService_recordLoginSuccess_(user, now);
  const session = SessionService_create_(updatedUser, {
    requestId: requestId,
    deviceKey: deviceKey
  });

  AuditService_logAuthLoginSuccess_(updatedUser, session.sessionId, requestId);

  return {
    data: {
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      user: UserService_projectAuthUser_(updatedUser)
    },
    message: "เข้าสู่ระบบสำเร็จ"
  };
}

function AuthService_me(request) {
  const context = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });

  return {
    data: UserService_projectMe_(context.user),
    message: "โหลดข้อมูลผู้ใช้สำเร็จ"
  };
}

function AuthService_logout(request) {
  const context = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });

  SessionService_revokeByToken_(request.sessionToken, "logout", {
    userId: context.user.user_id
  });
  AuditService_logAuthLogout_(context.user, context.session.session_id, request && request.requestId);

  return {
    data: {},
    message: "ออกจากระบบแล้ว"
  };
}

function AuthService_changePassword(request) {
  const context = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const data = request && Utils_isPlainObject_(request.data) ? request.data : {};
  const currentPassword = String(data.currentPassword || "");
  const newPassword = String(data.newPassword || "");
  const fields = {};

  if (!currentPassword) {
    fields.currentPassword = "กรุณากรอกรหัสผ่านปัจจุบัน";
  }

  UserService_validatePassword_(newPassword, "newPassword", fields);

  if (currentPassword && newPassword && currentPassword === newPassword) {
    fields.newPassword = "รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม";
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูล", fields);
  }

  if (!UserService_verifyPassword_(context.user, currentPassword)) {
    AuditService_logAuthPasswordChangeFailed_(context.user, request && request.requestId, "invalid_current_password");
    throw ApiError_("INVALID_CREDENTIALS", "รหัสผ่านปัจจุบันไม่ถูกต้อง");
  }

  const updatedUser = UserService_updatePassword_(context.user, newPassword, {
    userId: context.user.user_id
  });

  SessionService_revokeAllForUser_(context.user.user_id, "password_changed", {
    userId: context.user.user_id
  });
  AuditService_logAuthPasswordChanged_(updatedUser, request && request.requestId);

  return {
    data: {
      sessionsRevoked: true
    },
    message: "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่"
  };
}

function AuthService_checkLoginRateLimit_(username, deviceKey) {
  RateLimitService_cleanupExpiredSafe_();

  const now = new Date();
  const rateKey = AuthService_buildLoginRateLimitKey_(username, deviceKey);
  const existing = SheetRepository_findById_("rate_limits", "rate_key", rateKey, {
    keyColumnName: "rate_key",
    includeDeleted: true
  });

  if (!existing) {
    SheetRepository_append_("rate_limits", {
      rate_key: rateKey,
      action: "auth.login",
      window_start: now.toISOString(),
      count: 1,
      blocked_until: "",
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + AUTH_LOGIN_RATE_LIMIT_.windowSeconds * 1000).toISOString()
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

  if (now.getTime() - windowStart.getTime() > AUTH_LOGIN_RATE_LIMIT_.windowSeconds * 1000) {
    SheetRepository_updateById_("rate_limits", "rate_key", rateKey, {
      window_start: now.toISOString(),
      count: 1,
      blocked_until: "",
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + AUTH_LOGIN_RATE_LIMIT_.windowSeconds * 1000).toISOString()
    }, {
      userId: "system"
    });
    return;
  }

  const nextCount = Number(existing.count || 0) + 1;
  const updates = {
    count: nextCount,
    updated_at: now.toISOString(),
    expires_at: new Date(windowStart.getTime() + AUTH_LOGIN_RATE_LIMIT_.windowSeconds * 1000).toISOString()
  };

  if (nextCount > AUTH_LOGIN_RATE_LIMIT_.limit) {
    updates.blocked_until = new Date(windowStart.getTime() + AUTH_LOGIN_RATE_LIMIT_.windowSeconds * 1000).toISOString();
  }

  SheetRepository_updateById_("rate_limits", "rate_key", rateKey, updates, {
    userId: "system"
  });

  if (nextCount > AUTH_LOGIN_RATE_LIMIT_.limit) {
    throw ApiError_("RATE_LIMITED", "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง", {
      retryAfterSeconds: Math.ceil((new Date(updates.blocked_until).getTime() - now.getTime()) / 1000)
    });
  }
}

function AuthService_buildLoginRateLimitKey_(username, deviceKey) {
  const source = [
    "auth.login",
    UserService_normalizeUsername_(username),
    Utils_normalizeString_(deviceKey)
  ].join("|");

  return "rl_auth_login_" + Security_hashSha256_(source, "rate-limit").slice(0, 48);
}

function AuthService_throwInvalidCredentials_() {
  throw ApiError_("INVALID_CREDENTIALS", AUTH_GENERIC_LOGIN_MESSAGE_);
}

function RateLimitService_cleanupExpiredSafe_() {
  try {
    const cache = CacheService.getScriptCache();

    if (cache.get(RATE_LIMIT_CLEANUP_CACHE_KEY_)) {
      return {
        ok: true,
        skipped: true
      };
    }

    cache.put(RATE_LIMIT_CLEANUP_CACHE_KEY_, "1", RATE_LIMIT_CLEANUP_INTERVAL_SECONDS_);
    return RateLimitService_cleanupExpired_(new Date(), RATE_LIMIT_CLEANUP_MAX_ROWS_);
  } catch (error) {
    Security_safeLog_("RATE_LIMIT_CLEANUP_FAILED", {
      code: error && error.code ? error.code : "INTERNAL_ERROR"
    });
    return {
      ok: false,
      clearedCount: 0
    };
  }
}

function RateLimitService_cleanupExpired_(now, maxRows) {
  const currentTime = now && now.getTime ? now.getTime() : new Date().getTime();
  const limit = Utils_clampInteger_(maxRows, RATE_LIMIT_CLEANUP_MAX_ROWS_, 1, 500);
  const readResult = SheetRepository_readRows_("rate_limits", {
    keyColumnName: "rate_key",
    includeDeleted: true
  });
  const headers = readResult.headers;
  const clearedRows = [];

  for (let index = 0; index < readResult.rows.length && clearedRows.length < limit; index += 1) {
    const entry = readResult.rows[index];
    const record = entry.object || {};
    const expiresAt = new Date(record.expires_at || "");

    if (isNaN(expiresAt.getTime()) || expiresAt.getTime() > currentTime) {
      continue;
    }

    readResult.sheet.getRange(entry.rowNumber, 1, 1, headers.length).clearContent();
    clearedRows.push(entry.rowNumber);
  }

  return {
    ok: true,
    clearedCount: clearedRows.length,
    clearedRows: clearedRows
  };
}
