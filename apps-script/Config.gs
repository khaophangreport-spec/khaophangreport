var APP_CONFIG_KEYS = Object.freeze({
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  ROOT_FOLDER_ID: 'ROOT_FOLDER_ID',
  APP_SECRET: 'APP_SECRET',
  SESSION_SECRET: 'SESSION_SECRET',
  ALLOWED_ORIGIN: 'ALLOWED_ORIGIN',
  ADMIN_SETUP_KEY: 'ADMIN_SETUP_KEY',
  ENVIRONMENT: 'ENVIRONMENT'
});

var APP_PUBLIC_CONFIG = Object.freeze({
  APP_NAME: 'Khaophang Report',
  APP_NAME_TH: 'ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง',
  API_VERSION: '1.0.0',
  SITE_URL: 'https://khaophangreport.pages.dev',
  CONTACT_EMAIL: 'khaophangreport@gmail.com',
  SPREADSHEET_NAME: 'Khaophang Report Database',
  ROOT_FOLDER_NAME: 'Khaophang_Report_Files'
});

var APP_CACHE_KEYS = Object.freeze({
  PUBLIC_CONFIG: 'public.config.v1',
  CATEGORY_LIST: 'category.list.v1',
  ANNOUNCEMENT_LIST_PREFIX: 'announcement.list.v1.'
});

var APP_CACHE_TTL_SECONDS = Object.freeze({
  PUBLIC_CONFIG: 300,
  CATEGORY_LIST: 300,
  ANNOUNCEMENT_LIST: 120
});

function getScriptProperties_() {
  return PropertiesService.getScriptProperties();
}

function getConfigValue_(key, defaultValue) {
  var value = getScriptProperties_().getProperty(key);

  if (value === null || value === undefined || value === '') {
    return defaultValue || '';
  }

  return value;
}

function setConfigValue_(key, value) {
  getScriptProperties_().setProperty(key, value);
}

function getSpreadsheetId_() {
  return getConfigValue_(APP_CONFIG_KEYS.SPREADSHEET_ID, '');
}

function setSpreadsheetId_(spreadsheetId) {
  setConfigValue_(APP_CONFIG_KEYS.SPREADSHEET_ID, spreadsheetId);
}

function getRootFolderId_() {
  return getConfigValue_(APP_CONFIG_KEYS.ROOT_FOLDER_ID, '');
}

function setRootFolderId_(folderId) {
  setConfigValue_(APP_CONFIG_KEYS.ROOT_FOLDER_ID, folderId);
}

function getEnvironment_() {
  return getConfigValue_(APP_CONFIG_KEYS.ENVIRONMENT, 'development');
}

function getAllowedOrigin_() {
  return getConfigValue_(APP_CONFIG_KEYS.ALLOWED_ORIGIN, '');
}

function getPublicHealthConfig_() {
  return {
    apiVersion: APP_PUBLIC_CONFIG.API_VERSION,
    environment: getEnvironment_()
  };
}

function getPublicCache_() {
  return CacheService.getScriptCache();
}

function getCachedJson_(cacheKey) {
  var cachedValue = getPublicCache_().get(cacheKey);

  return cachedValue ? safeJsonParse_(cachedValue, null) : null;
}

function putCachedJson_(cacheKey, value, ttlSeconds) {
  getPublicCache_().put(cacheKey, JSON.stringify(value), ttlSeconds);
}

function removeCachedJson_(cacheKey) {
  getPublicCache_().remove(cacheKey);
}
