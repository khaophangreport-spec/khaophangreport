const SESSION_TTL_SECONDS_ = 8 * 60 * 60;
const SESSION_CLEANUP_CACHE_KEY_ = "SESSION_CLEANUP_RECENT";
const SESSION_CLEANUP_INTERVAL_SECONDS_ = 6 * 60 * 60;
const SESSION_CLEANUP_MAX_ROWS_ = 50;

function SessionService_create_(user, options) {
  SessionService_cleanupExpiredSafe_();

  const safeOptions = options || {};
  const now = new Date();
  const sessionToken = Security_generateSessionToken_();
  const sessionId = Utils_createUuid_();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS_ * 1000).toISOString();
  const deviceKey = Utils_normalizeString_(safeOptions.deviceKey);
  const record = {
    session_id: sessionId,
    user_id: user.user_id,
    token_hash: Security_hashSessionToken_(sessionToken),
    expires_at: expiresAt,
    revoked_at: "",
    revoke_reason: "",
    created_at: now.toISOString(),
    last_used_at: now.toISOString(),
    user_agent_hint: "",
    device_key_hash: deviceKey ? Security_hashSha256_(deviceKey, "device-key") : "",
    is_active: true,
    version: 1
  };

  SheetRepository_append_("sessions", record, {
    keyColumnName: "session_id",
    userId: user.user_id
  });

  return {
    sessionId: sessionId,
    sessionToken: sessionToken,
    expiresAt: expiresAt
  };
}

function SessionService_require_(sessionToken, options) {
  const safeOptions = options || {};
  const token = Utils_normalizeString_(sessionToken);

  if (!token) {
    throw ApiError_("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ");
  }

  const session = SessionService_findByToken_(token);

  if (!session || !SessionService_isUsable_(session)) {
    throw ApiError_("SESSION_EXPIRED", "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }

  const user = SheetRepository_findById_("users", "user_id", session.user_id, {
    keyColumnName: "user_id"
  });

  if (!user || !UserService_isActive_(user)) {
    SessionService_revokeById_(session.session_id, "user_inactive", {
      userId: session.user_id
    });
    throw ApiError_("SESSION_EXPIRED", "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }

  const updatedSession = SessionService_touch_(session.session_id, user.user_id);

  return {
    session: updatedSession || session,
    user: user,
    requestId: safeOptions.requestId || ""
  };
}

function SessionService_findByToken_(sessionToken) {
  const tokenHash = Security_hashSessionToken_(sessionToken);

  return SheetRepository_findOne_("sessions", {
    token_hash: tokenHash
  }, {
    keyColumnName: "session_id",
    includeDeleted: true
  });
}

function SessionService_isUsable_(session) {
  if (!session || !Utils_toBoolean_(session.is_active) || session.revoked_at) {
    return false;
  }

  const expiresAt = new Date(session.expires_at || "");

  return !isNaN(expiresAt.getTime()) && expiresAt.getTime() > new Date().getTime();
}

function SessionService_touch_(sessionId, userId) {
  try {
    return SheetRepository_updateById_("sessions", "session_id", sessionId, {
      last_used_at: Utils_nowIso_()
    }, {
      userId: userId || "system"
    });
  } catch (error) {
    Security_safeLog_("SESSION_TOUCH_FAILED", {
      sessionId: sessionId,
      code: error && error.code ? error.code : "INTERNAL_ERROR"
    });
    return null;
  }
}

function SessionService_revokeByToken_(sessionToken, reason, options) {
  const session = SessionService_findByToken_(sessionToken);

  if (!session) {
    return null;
  }

  return SessionService_revokeById_(session.session_id, reason, options || {
    userId: session.user_id
  });
}

function SessionService_revokeById_(sessionId, reason, options) {
  const safeOptions = options || {};
  const session = SheetRepository_findById_("sessions", "session_id", sessionId, {
    keyColumnName: "session_id",
    includeDeleted: true
  });

  if (!session || session.revoked_at) {
    return session || null;
  }

  return SheetRepository_updateById_("sessions", "session_id", sessionId, {
    revoked_at: Utils_nowIso_(),
    revoke_reason: Utils_normalizeString_(reason || "revoked"),
    is_active: false
  }, {
    userId: safeOptions.userId || session.user_id || "system"
  });
}

function SessionService_revokeAllForUser_(userId, reason, options) {
  const safeOptions = options || {};
  const sessions = SheetRepository_batchRead_("sessions", {
    keyColumnName: "session_id",
    includeDeleted: true
  }).objects.filter(function (session) {
    return String(session.user_id || "") === String(userId || "") &&
      Utils_toBoolean_(session.is_active) &&
      !session.revoked_at;
  });
  const revokedIds = [];

  sessions.forEach(function (session) {
    SessionService_revokeById_(session.session_id, reason || "revoked", {
      userId: safeOptions.userId || userId || "system"
    });
    revokedIds.push(session.session_id);
  });

  return {
    revokedCount: revokedIds.length,
    revokedSessionIds: revokedIds
  };
}

function SessionService_projectSafe_(session) {
  return {
    sessionId: String(session && session.session_id ? session.session_id : ""),
    userId: String(session && session.user_id ? session.user_id : ""),
    expiresAt: String(session && session.expires_at ? session.expires_at : ""),
    isActive: Utils_toBoolean_(session && session.is_active),
    createdAt: String(session && session.created_at ? session.created_at : ""),
    lastUsedAt: String(session && session.last_used_at ? session.last_used_at : "")
  };
}

function SessionService_cleanupExpiredSafe_() {
  try {
    const cache = CacheService.getScriptCache();

    if (cache.get(SESSION_CLEANUP_CACHE_KEY_)) {
      return {
        ok: true,
        skipped: true
      };
    }

    cache.put(SESSION_CLEANUP_CACHE_KEY_, "1", SESSION_CLEANUP_INTERVAL_SECONDS_);
    return SessionService_cleanupExpired_(new Date(), SESSION_CLEANUP_MAX_ROWS_);
  } catch (error) {
    Security_safeLog_("SESSION_CLEANUP_FAILED", {
      code: error && error.code ? error.code : "INTERNAL_ERROR"
    });
    return {
      ok: false,
      clearedCount: 0
    };
  }
}

function SessionService_cleanupExpired_(now, maxRows) {
  const currentTime = now && now.getTime ? now.getTime() : new Date().getTime();
  const limit = Utils_clampInteger_(maxRows, SESSION_CLEANUP_MAX_ROWS_, 1, 500);
  const readResult = SheetRepository_readRows_("sessions", {
    keyColumnName: "session_id",
    includeDeleted: true
  });
  const headers = readResult.headers;
  const clearedRows = [];

  for (let index = 0; index < readResult.rows.length && clearedRows.length < limit; index += 1) {
    const entry = readResult.rows[index];
    const session = entry.object || {};
    const expiresAt = new Date(session.expires_at || "");
    const isExpired = !isNaN(expiresAt.getTime()) && expiresAt.getTime() <= currentTime;

    if (!isExpired) {
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
