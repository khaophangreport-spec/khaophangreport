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
