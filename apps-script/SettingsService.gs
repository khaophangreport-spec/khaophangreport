const SETTINGS_ADMIN_GROUPS_ = Object.freeze([
  "general",
  "contact",
  "upload",
  "privacy",
  "system"
]);
const SETTINGS_ADMIN_DEFINITIONS_ = Object.freeze({
  app_name: Object.freeze({
    type: "string",
    groupName: "general",
    isPublic: true,
    label: "ชื่อระบบภาษาอังกฤษ",
    maxLength: 80
  }),
  app_name_th: Object.freeze({
    type: "string",
    groupName: "general",
    isPublic: true,
    label: "ชื่อระบบภาษาไทย",
    maxLength: 160
  }),
  site_url: Object.freeze({
    type: "string",
    groupName: "general",
    isPublic: true,
    label: "URL เว็บไซต์",
    maxLength: 240
  }),
  contact_email: Object.freeze({
    type: "string",
    groupName: "contact",
    isPublic: true,
    label: "อีเมลติดต่อ",
    maxLength: 120,
    pattern: "email"
  }),
  contact_phone: Object.freeze({
    type: "string",
    groupName: "contact",
    isPublic: true,
    label: "เบอร์โทรติดต่อ",
    maxLength: 40
  }),
  office_hours: Object.freeze({
    type: "string",
    groupName: "contact",
    isPublic: true,
    label: "เวลาทำการ",
    maxLength: 160
  }),
  emergency_contacts: Object.freeze({
    type: "json",
    groupName: "contact",
    isPublic: true,
    label: "ช่องทางฉุกเฉิน",
    risky: true
  }),
  max_images: Object.freeze({
    type: "number",
    groupName: "upload",
    isPublic: true,
    label: "จำนวนรูปสูงสุด",
    min: 1,
    max: 10,
    integer: true,
    risky: true
  }),
  max_image_size_mb: Object.freeze({
    type: "number",
    groupName: "upload",
    isPublic: true,
    label: "ขนาดรูปสูงสุดต่อรูป (MB)",
    min: 1,
    max: 10,
    integer: true,
    risky: true
  }),
  max_image_dimension: Object.freeze({
    type: "number",
    groupName: "upload",
    isPublic: true,
    label: "ด้านยาวสูงสุดของรูป",
    min: 400,
    max: 4096,
    integer: true,
    risky: true
  }),
  default_page_size: Object.freeze({
    type: "number",
    groupName: "system",
    isPublic: true,
    label: "จำนวนรายการต่อหน้า",
    min: 5,
    max: 100,
    integer: true
  }),
  privacy_version: Object.freeze({
    type: "string",
    groupName: "privacy",
    isPublic: true,
    label: "เวอร์ชันนโยบายความเป็นส่วนตัว",
    maxLength: 30,
    risky: true
  }),
  terms_version: Object.freeze({
    type: "string",
    groupName: "privacy",
    isPublic: true,
    label: "เวอร์ชันเงื่อนไขการใช้งาน",
    maxLength: 30,
    risky: true
  }),
  maintenance_mode: Object.freeze({
    type: "boolean",
    groupName: "system",
    isPublic: true,
    label: "โหมดปิดปรับปรุง",
    risky: true
  }),
  schema_version: Object.freeze({
    type: "string",
    groupName: "system",
    isPublic: false,
    label: "เวอร์ชันโครงสร้างข้อมูล",
    maxLength: 30,
    readOnly: true
  })
});
const SETTINGS_ADMIN_SECRET_KEY_PATTERN_ = /secret|token|password|salt|credential|spreadsheet|folder/i;

function SettingsService_getPublicConfig(request) {
  const cachedData = SettingsService_getCachedJson_(CACHE_KEYS_.PUBLIC_CONFIG);

  if (cachedData) {
    return {
      data: cachedData,
      message: "โหลดค่าระบบสำเร็จ"
    };
  }

  const publicSettings = SettingsService_getPublicSettingsMap_();
  const fallbackConfig = Config_getPublicAppConfig_();
  const data = {
    appName: SettingsService_getSettingValue_(publicSettings, "app_name", fallbackConfig.appName),
    appNameTh: SettingsService_getSettingValue_(publicSettings, "app_name_th", fallbackConfig.appNameTh),
    siteUrl: SettingsService_getSettingValue_(publicSettings, "site_url", fallbackConfig.siteUrl),
    contactEmail: SettingsService_getSettingValue_(publicSettings, "contact_email", fallbackConfig.contactEmail),
    contactPhone: SettingsService_getSettingValue_(publicSettings, "contact_phone", ""),
    officeHours: SettingsService_getSettingValue_(publicSettings, "office_hours", ""),
    maxImages: Number(SettingsService_getSettingValue_(publicSettings, "max_images", 3)),
    maxImageSizeMb: Number(SettingsService_getSettingValue_(publicSettings, "max_image_size_mb", 1)),
    maxImageDimension: Number(SettingsService_getSettingValue_(publicSettings, "max_image_dimension", 1600)),
    privacyVersion: String(SettingsService_getSettingValue_(publicSettings, "privacy_version", "1.0")),
    maintenanceMode: Utils_toBoolean_(SettingsService_getSettingValue_(publicSettings, "maintenance_mode", false)),
    emergencyContacts: SettingsService_getEmergencyContacts_(publicSettings),
    apiVersion: fallbackConfig.apiVersion
  };

  SettingsService_putCachedJson_(CACHE_KEYS_.PUBLIC_CONFIG, data, CACHE_TTL_SECONDS_.PUBLIC_CONFIG);

  return {
    data: data,
    message: "โหลดค่าระบบสำเร็จ"
  };
}

function SettingsService_getPublicSettingsMap_() {
  const result = SheetRepository_list_("settings", {
    keyColumnName: "key",
    page: 1,
    pageSize: 100
  });
  const settingsMap = {};

  result.items.forEach(function (item) {
    if (!Utils_toBoolean_(item.is_public)) {
      return;
    }

    settingsMap[item.key] = SettingsService_parseSettingValue_(item.value, item.type);
  });

  return settingsMap;
}

function SettingsService_parseSettingValue_(value, type) {
  const normalizedType = Utils_normalizeString_(type).toLowerCase();

  if (normalizedType === "number") {
    const numberValue = Number(value);
    return isFinite(numberValue) ? numberValue : 0;
  }

  if (normalizedType === "boolean") {
    return Utils_toBoolean_(value);
  }

  if (normalizedType === "json") {
    const parsed = Utils_safeJsonParse_(value || "[]");
    return parsed.ok ? parsed.data : [];
  }

  return value === null || value === undefined ? "" : String(value);
}

function SettingsService_getSettingValue_(settingsMap, key, fallbackValue) {
  return settingsMap[key] === undefined || settingsMap[key] === null || settingsMap[key] === "" ?
    fallbackValue :
    settingsMap[key];
}

function SettingsService_getEmergencyContacts_(settingsMap) {
  const contacts = SettingsService_getSettingValue_(settingsMap, "emergency_contacts", []);

  return Array.isArray(contacts) ? contacts : [];
}

function SettingsService_getCachedJson_(cacheKey) {
  const cachedText = CacheService.getScriptCache().get(cacheKey);

  if (!cachedText) {
    return null;
  }

  const parsed = Utils_safeJsonParse_(cachedText);

  return parsed.ok ? parsed.data : null;
}

function SettingsService_putCachedJson_(cacheKey, data, ttlSeconds) {
  CacheService.getScriptCache().put(cacheKey, JSON.stringify(data), ttlSeconds);
}

function SettingsService_clearPublicCache_() {
  CacheService.getScriptCache().remove(CACHE_KEYS_.PUBLIC_CONFIG);
}

function SettingsService_getAdmin(request) {
  const context = SettingsService_requireManageContext_(request);
  const records = SettingsService_getSettingsByKey_();
  const items = SettingsService_getAdminSettingKeys_().map(function (key) {
    return SettingsService_projectAdmin_(records[key], key);
  });

  return {
    data: {
      items: items,
      groups: SettingsService_buildAdminGroups_(items),
      permissions: SettingsService_buildAdminPermissions_(context.permissions),
      riskyKeys: SettingsService_getRiskyKeys_()
    },
    message: "Loaded settings"
  };
}

function SettingsService_updateAdmin(request) {
  const lock = LockService.getScriptLock();
  const context = SettingsService_requireManageContext_(request);
  const requestId = Utils_normalizeString_(request && request.requestId);

  lock.waitLock(30000);

  try {
    const payload = SettingsService_normalizeAdminUpdatePayload_(request && request.data);
    const records = SettingsService_getSettingsByKey_();
    const changes = SettingsService_buildAdminSettingChanges_(payload, records);

    SettingsService_assertRiskyChangesConfirmed_(changes, payload.confirmedRisky);

    const updatedRecords = changes.map(function (change) {
      const definition = SETTINGS_ADMIN_DEFINITIONS_[change.key];

      if (!change.record) {
        return SettingsService_createMissingSetting_(change, definition, context.user.user_id);
      }

      return SheetRepository_updateById_("settings", "key", change.key, {
        value: change.serializedValue,
        type: definition.type,
        description: change.record.description || definition.label,
        is_public: definition.isPublic,
        group_name: definition.groupName
      }, {
        userId: context.user.user_id,
        expectedVersion: change.version
      });
    });

    SettingsService_clearPublicCache_();
    AuditService_logAdminSettingsUpdated_(changes, context.user, requestId);

    return {
      data: {
        items: updatedRecords.map(function (record) {
          return SettingsService_projectAdmin_(record, record.key);
        }),
        cacheCleared: true
      },
      message: "Settings updated"
    };
  } finally {
    lock.releaseLock();
  }
}

function SettingsService_requireManageContext_(request) {
  const context = SessionService_require_(request && request.sessionToken, {
    requestId: request && request.requestId
  });
  const permissions = UserService_getPermissions_(context.user.role);

  UserService_assertPermission_(permissions, "settings.manage", "No permission to manage settings");

  return {
    session: context.session,
    user: context.user,
    permissions: permissions,
    requestId: request && request.requestId ? String(request.requestId) : ""
  };
}

function SettingsService_buildAdminPermissions_(permissions) {
  return {
    canRead: UserService_hasPermission_(permissions, "settings.manage"),
    canUpdate: UserService_hasPermission_(permissions, "settings.manage")
  };
}

function SettingsService_getAdminSettingKeys_() {
  return Object.keys(SETTINGS_ADMIN_DEFINITIONS_).filter(function (key) {
    return !SettingsService_isSecretKey_(key);
  });
}

function SettingsService_getRiskyKeys_() {
  return SettingsService_getAdminSettingKeys_().filter(function (key) {
    return !!SETTINGS_ADMIN_DEFINITIONS_[key].risky;
  });
}

function SettingsService_getSettingsByKey_() {
  const records = SheetRepository_batchRead_("settings", {
    keyColumnName: "key",
    includeDeleted: false
  }).objects;
  const byKey = {};

  records.forEach(function (record) {
    const key = Utils_normalizeString_(record.key);

    if (key) {
      byKey[key] = record;
    }
  });

  return byKey;
}

function SettingsService_projectAdmin_(record, key) {
  const safeKey = Utils_normalizeString_(key || record && record.key);
  const definition = SETTINGS_ADMIN_DEFINITIONS_[safeKey] || {};
  const source = record || {};

  if (SettingsService_isSecretKey_(safeKey)) {
    return null;
  }

  return {
    key: safeKey,
    value: SettingsService_parseSettingValue_(source.value, definition.type || source.type),
    type: definition.type || Security_sanitizeText_(source.type || "string"),
    label: definition.label || safeKey,
    description: Security_sanitizeText_(source.description || definition.label || ""),
    groupName: definition.groupName || Security_sanitizeText_(source.group_name || "general"),
    isPublic: definition.isPublic === true,
    isPrivate: definition.isPublic !== true,
    isRisky: definition.risky === true,
    isReadOnly: definition.readOnly === true,
    isMissing: !record,
    updatedAt: String(source.updated_at || ""),
    version: Number(source.version || 0)
  };
}

function SettingsService_buildAdminGroups_(items) {
  return SETTINGS_ADMIN_GROUPS_.map(function (groupName) {
    return {
      groupName: groupName,
      title: SettingsService_getGroupTitle_(groupName),
      items: (items || []).filter(function (item) {
        return item && item.groupName === groupName;
      })
    };
  }).filter(function (group) {
    return group.items.length > 0;
  });
}

function SettingsService_getGroupTitle_(groupName) {
  const titles = {
    general: "ข้อมูลระบบ",
    contact: "ข้อมูลติดต่อและฉุกเฉิน",
    upload: "ข้อจำกัดการอัปโหลด",
    privacy: "นโยบายและข้อตกลง",
    system: "ระบบและการดูแล"
  };

  return titles[groupName] || groupName;
}

function SettingsService_normalizeAdminUpdatePayload_(data) {
  const input = Utils_isPlainObject_(data) ? data : {};
  const rawItems = Array.isArray(input.items) ? input.items : SettingsService_itemsFromSettingsObject_(input);
  const fields = {};
  const items = [];

  if (rawItems.length === 0) {
    fields.items = "กรุณาระบุค่าที่ต้องการบันทึก";
  }

  rawItems.forEach(function (rawItem, index) {
    const item = Utils_isPlainObject_(rawItem) ? rawItem : {};
    const key = Utils_normalizeString_(item.key);
    const definition = SETTINGS_ADMIN_DEFINITIONS_[key];
    const fieldPrefix = "items." + index;

    if (!key || !definition || SettingsService_isSecretKey_(key)) {
      fields[fieldPrefix + ".key"] = "Key is not allowed";
      return;
    }

    if (definition.readOnly) {
      fields[fieldPrefix + ".key"] = "Setting is read only";
      return;
    }

    if (item.version === undefined || item.version === null || item.version === "") {
      fields[fieldPrefix + ".version"] = "Version is required";
    }

    items.push({
      key: key,
      value: item.value,
      version: item.version
    });
  });

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "Invalid settings update", fields);
  }

  return {
    items: items,
    confirmedRisky: input.confirmedRisky === true
  };
}

function SettingsService_itemsFromSettingsObject_(input) {
  const settings = Utils_isPlainObject_(input.settings) ? input.settings : {};
  const versions = Utils_isPlainObject_(input.versions) ? input.versions : {};

  return Object.keys(settings).map(function (key) {
    return {
      key: key,
      value: settings[key],
      version: versions[key]
    };
  });
}

function SettingsService_buildAdminSettingChanges_(payload, records) {
  const fields = {};
  const seenKeys = {};
  const changes = [];

  payload.items.forEach(function (item, index) {
    const definition = SETTINGS_ADMIN_DEFINITIONS_[item.key];
    const record = records[item.key] || null;
    const fieldPrefix = "items." + index;

    if (seenKeys[item.key]) {
      fields[fieldPrefix + ".key"] = "Duplicate key";
      return;
    }

    seenKeys[item.key] = true;

    if (!record && Number(item.version || 0) !== 0) {
      fields[fieldPrefix + ".version"] = "Version must be 0 when creating missing setting";
    }

    if (record && (item.version === undefined || item.version === null || item.version === "")) {
      fields[fieldPrefix + ".version"] = "Version is required";
      return;
    }

    const normalizedValue = SettingsService_validateAdminSettingValue_(item.key, item.value, fields, fieldPrefix + ".value");

    changes.push({
      key: item.key,
      value: normalizedValue,
      serializedValue: SettingsService_serializeSettingValue_(normalizedValue, definition.type),
      version: item.version,
      record: record,
      isPublic: definition.isPublic === true,
      isRisky: definition.risky === true,
      type: definition.type
    });
  });

  if (Object.keys(fields).length > 0) {
    throw ApiError_("VALIDATION_ERROR", "Invalid settings update", fields);
  }

  return changes;
}

function SettingsService_validateAdminSettingValue_(key, value, fields, fieldName) {
  const definition = SETTINGS_ADMIN_DEFINITIONS_[key];

  if (definition.type === "number") {
    return SettingsService_validateNumberSetting_(definition, value, fields, fieldName);
  }

  if (definition.type === "boolean") {
    return Utils_toBoolean_(value);
  }

  if (definition.type === "json") {
    return SettingsService_validateJsonSetting_(key, value, fields, fieldName);
  }

  return SettingsService_validateStringSetting_(definition, value, fields, fieldName);
}

function SettingsService_validateStringSetting_(definition, value, fields, fieldName) {
  const text = Security_sanitizeUserText_(value || "", definition.maxLength || 240);

  if (definition.pattern === "email" && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    fields[fieldName] = "รูปแบบอีเมลไม่ถูกต้อง";
  }

  if (definition.label && !text && definition.required) {
    fields[fieldName] = "กรุณากรอก" + definition.label;
  }

  return text;
}

function SettingsService_validateNumberSetting_(definition, value, fields, fieldName) {
  const numberValue = Number(value);

  if (!isFinite(numberValue)) {
    fields[fieldName] = "กรุณากรอกตัวเลข";
    return 0;
  }

  if (definition.integer && Math.floor(numberValue) !== numberValue) {
    fields[fieldName] = "กรุณากรอกจำนวนเต็ม";
  }

  if (numberValue < definition.min || numberValue > definition.max) {
    fields[fieldName] = "ค่าต้องอยู่ระหว่าง " + definition.min + " ถึง " + definition.max;
  }

  return definition.integer ? Math.floor(numberValue) : numberValue;
}

function SettingsService_validateJsonSetting_(key, value, fields, fieldName) {
  if (key === "emergency_contacts") {
    return SettingsService_normalizeEmergencyContacts_(value, fields, fieldName);
  }

  if (typeof value === "string") {
    const parsed = Utils_safeJsonParse_(value || "[]");

    if (!parsed.ok) {
      fields[fieldName] = "JSON ไม่ถูกต้อง";
      return [];
    }

    return parsed.data;
  }

  return value;
}

function SettingsService_normalizeEmergencyContacts_(value, fields, fieldName) {
  let contacts = value;

  if (typeof value === "string") {
    const parsed = Utils_safeJsonParse_(value || "[]");

    if (!parsed.ok) {
      fields[fieldName] = "รูปแบบช่องทางฉุกเฉินไม่ถูกต้อง";
      return [];
    }

    contacts = parsed.data;
  }

  if (!Array.isArray(contacts)) {
    fields[fieldName] = "ช่องทางฉุกเฉินต้องเป็นรายการ";
    return [];
  }

  if (contacts.length > 10) {
    fields[fieldName] = "กำหนดช่องทางฉุกเฉินได้ไม่เกิน 10 รายการ";
  }

  return contacts.slice(0, 10).map(function (contact) {
    const safeContact = Utils_isPlainObject_(contact) ? contact : {};

    return {
      label: Security_sanitizeUserText_(safeContact.label || "", 80),
      phone: Security_sanitizeUserText_(safeContact.phone || "", 40),
      note: Security_sanitizeUserText_(safeContact.note || "", 160)
    };
  }).filter(function (contact) {
    return contact.label || contact.phone || contact.note;
  });
}

function SettingsService_serializeSettingValue_(value, type) {
  if (type === "json") {
    return JSON.stringify(value || []);
  }

  if (type === "boolean") {
    return Utils_toBoolean_(value) ? "true" : "false";
  }

  if (type === "number") {
    return String(Number(value || 0));
  }

  return String(value === undefined || value === null ? "" : value);
}

function SettingsService_assertRiskyChangesConfirmed_(changes, confirmedRisky) {
  const riskyKeys = (changes || []).filter(function (change) {
    return change.isRisky;
  }).map(function (change) {
    return change.key;
  });

  if (riskyKeys.length > 0 && confirmedRisky !== true) {
    throw ApiError_("VALIDATION_ERROR", "Confirmation required for risky settings", {
      confirmation: "กรุณายืนยันก่อนบันทึกค่าที่มีผลกระทบสูง",
      riskyKeys: riskyKeys.join(",")
    });
  }
}

function SettingsService_createMissingSetting_(change, definition, userId) {
  return SheetRepository_append_("settings", {
    key: change.key,
    value: change.serializedValue,
    type: definition.type,
    description: definition.label,
    is_public: definition.isPublic,
    group_name: definition.groupName,
    version: 1
  }, {
    keyColumnName: "key",
    userId: userId || "system"
  });
}

function SettingsService_isSecretKey_(key) {
  return SETTINGS_ADMIN_SECRET_KEY_PATTERN_.test(String(key || ""));
}
