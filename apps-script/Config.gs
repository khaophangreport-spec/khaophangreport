const CONFIG_KEYS_ = Object.freeze({
  SPREADSHEET_ID: "SPREADSHEET_ID",
  ROOT_FOLDER_ID: "ROOT_FOLDER_ID",
  APP_SECRET: "APP_SECRET",
  SESSION_SECRET: "SESSION_SECRET",
  ALLOWED_ORIGIN: "ALLOWED_ORIGIN",
  ADMIN_SETUP_KEY: "ADMIN_SETUP_KEY",
  ENVIRONMENT: "ENVIRONMENT"
});

const APP_PUBLIC_CONFIG_ = Object.freeze({
  appName: "Khaophang Report",
  appNameTh: "ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง",
  apiVersion: "1.0.0",
  siteUrl: "https://khaophangreport.pages.dev",
  contactEmail: "khaophangreport@gmail.com"
});

const CACHE_KEYS_ = Object.freeze({
  PUBLIC_CONFIG: "public.config.v1",
  CATEGORY_LIST: "category.list.v1",
  ANNOUNCEMENT_LIST: "announcement.list.v1"
});

const CACHE_TTL_SECONDS_ = Object.freeze({
  PUBLIC_CONFIG: 300,
  CATEGORY_LIST: 300,
  ANNOUNCEMENT_LIST: 120
});

function Config_getScriptProperties_() {
  return PropertiesService.getScriptProperties();
}

function Config_getProperty_(key, fallbackValue) {
  const value = Config_getScriptProperties_().getProperty(key);
  return value === null || value === undefined || value === "" ? fallbackValue : value;
}

function Config_setProperty_(key, value) {
  Config_getScriptProperties_().setProperty(key, String(value || ""));
}

function Config_getSpreadsheetId_() {
  return Config_getProperty_(CONFIG_KEYS_.SPREADSHEET_ID, "");
}

function Config_setSpreadsheetId_(spreadsheetId) {
  Config_setProperty_(CONFIG_KEYS_.SPREADSHEET_ID, spreadsheetId);
}

function Config_getRootFolderId_() {
  return Config_getProperty_(CONFIG_KEYS_.ROOT_FOLDER_ID, "");
}

function Config_setRootFolderId_(folderId) {
  Config_setProperty_(CONFIG_KEYS_.ROOT_FOLDER_ID, folderId);
}

function Config_getEnvironment_() {
  return Config_getProperty_(CONFIG_KEYS_.ENVIRONMENT, "development");
}

function Config_getAllowedOrigin_() {
  return Config_getProperty_(CONFIG_KEYS_.ALLOWED_ORIGIN, "");
}

function Config_getPublicAppConfig_() {
  return {
    appName: APP_PUBLIC_CONFIG_.appName,
    appNameTh: APP_PUBLIC_CONFIG_.appNameTh,
    apiVersion: APP_PUBLIC_CONFIG_.apiVersion,
    siteUrl: APP_PUBLIC_CONFIG_.siteUrl,
    contactEmail: APP_PUBLIC_CONFIG_.contactEmail,
    environment: Config_getEnvironment_()
  };
}
