var SettingsService = (function () {
  var PUBLIC_SETTING_KEYS = Object.freeze({
    app_name: 'appName',
    app_name_th: 'appNameTh',
    site_url: 'siteUrl',
    contact_email: 'contactEmail',
    contact_phone: 'contactPhone',
    office_hours: 'officeHours',
    max_images: 'maxImages',
    max_image_size_mb: 'maxImageSizeMb',
    max_image_dimension: 'maxImageDimension',
    privacy_version: 'privacyVersion',
    maintenance_mode: 'maintenanceMode',
    emergency_contacts: 'emergencyContacts'
  });

  function getPublicConfig(request) {
    var cached = getCachedJson_(APP_CACHE_KEYS.PUBLIC_CONFIG);

    if (cached) {
      return createSuccessResponse_(cached, 'โหลดค่าระบบสำเร็จ', request.requestId);
    }

    var data = buildDefaultPublicConfig_();
    var settings = SheetRepository.list('settings', {
      paginate: false,
      predicate: function (setting) {
        return isPublicBoolean_(setting.is_public);
      }
    }).items;

    settings.forEach(function (setting) {
      var apiKey = PUBLIC_SETTING_KEYS[setting.key];

      if (apiKey) {
        data[apiKey] = parseSettingValue_(setting.value, setting.type);
      }
    });

    data = normalizePublicConfig_(data);
    putCachedJson_(APP_CACHE_KEYS.PUBLIC_CONFIG, data, APP_CACHE_TTL_SECONDS.PUBLIC_CONFIG);

    return createSuccessResponse_(data, 'โหลดค่าระบบสำเร็จ', request.requestId);
  }

  function buildDefaultPublicConfig_() {
    return {
      appName: APP_PUBLIC_CONFIG.APP_NAME,
      appNameTh: APP_PUBLIC_CONFIG.APP_NAME_TH,
      siteUrl: APP_PUBLIC_CONFIG.SITE_URL,
      contactEmail: APP_PUBLIC_CONFIG.CONTACT_EMAIL,
      contactPhone: '',
      officeHours: '',
      maxImages: 3,
      maxImageSizeMb: 1,
      maxImageDimension: 1600,
      privacyVersion: '1.0',
      maintenanceMode: false,
      emergencyContacts: []
    };
  }

  function parseSettingValue_(value, type) {
    if (type === 'number') {
      var numberValue = Number(value);
      return isNaN(numberValue) ? 0 : numberValue;
    }

    if (type === 'boolean') {
      return value === true || String(value).toLowerCase() === 'true';
    }

    if (type === 'json') {
      return safeJsonParse_(value, null);
    }

    return normalizeString_(value);
  }

  function normalizePublicConfig_(data) {
    data.appName = normalizeString_(data.appName) || APP_PUBLIC_CONFIG.APP_NAME;
    data.appNameTh = normalizeString_(data.appNameTh) || APP_PUBLIC_CONFIG.APP_NAME_TH;
    data.siteUrl = normalizeString_(data.siteUrl);
    data.contactEmail = normalizeString_(data.contactEmail);
    data.contactPhone = normalizeString_(data.contactPhone);
    data.officeHours = normalizeString_(data.officeHours);
    data.maxImages = Number(data.maxImages) || 3;
    data.maxImageSizeMb = Number(data.maxImageSizeMb) || 1;
    data.maxImageDimension = Number(data.maxImageDimension) || 1600;
    data.privacyVersion = normalizeString_(data.privacyVersion) || '1.0';
    data.maintenanceMode = data.maintenanceMode === true;
    data.emergencyContacts = Array.isArray(data.emergencyContacts) ? data.emergencyContacts : [];

    return data;
  }

  function isPublicBoolean_(value) {
    return value === true || String(value).toLowerCase() === 'true';
  }

  function clearPublicCache() {
    removeCachedJson_(APP_CACHE_KEYS.PUBLIC_CONFIG);
  }

  return {
    clearPublicCache: clearPublicCache,
    getPublicConfig: getPublicConfig
  };
})();
