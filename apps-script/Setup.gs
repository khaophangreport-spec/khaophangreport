const SETUP_SCHEMA_VERSION_ = "1.0.0";
const SETUP_DRIVE_FOLDERS_ = ["reports", "announcements", "exports", "backups", "temp"];
const SETUP_REQUIRED_SETTING_KEYS_ = Object.freeze([
  "app_name",
  "app_name_th",
  "contact_email",
  "site_url",
  "max_images",
  "max_image_size_mb",
  "max_image_dimension",
  "default_page_size",
  "privacy_version",
  "terms_version",
  "maintenance_mode",
  "schema_version"
]);
const SETUP_PRIMARY_KEY_COLUMNS_ = Object.freeze({
  reports: "report_id",
  report_updates: "update_id",
  attachments: "attachment_id",
  categories: "code",
  users: "user_id",
  sessions: "session_id",
  assignments: "assignment_id",
  announcements: "announcement_id",
  settings: "key",
  activity_logs: "log_id",
  report_additional_info: "additional_info_id",
  rate_limits: "rate_key",
  dashboard_cache: "cache_key",
  schema_migrations: "migration_id",
  system_counters: "counter_key",
  export_logs: "export_id"
});

const SETUP_SHEETS_ = Object.freeze({
  reports: [
    "report_id", "tracking_code", "request_id", "category_id", "title", "description", "incident_date",
    "location_name", "village_no", "landmark", "latitude", "longitude", "map_url", "is_anonymous",
    "reporter_name", "reporter_phone", "reporter_email", "contact_method", "reporter_consent",
    "truth_confirmation", "privacy_version", "priority_reported", "priority", "status", "assigned_to",
    "target_due_at", "source", "public_result", "internal_summary", "resolved_at", "closed_at",
    "rejected_at", "rejection_reason", "duplicate_of_report_id", "created_at", "updated_at", "created_by",
    "updated_by", "is_deleted", "deleted_at", "deleted_by", "version", "search_text", "year_month",
    "village_key"
  ],
  report_updates: [
    "update_id", "report_id", "update_type", "old_status", "new_status", "public_message", "internal_note",
    "is_public", "updated_by", "updated_by_name_snapshot", "updated_by_role_snapshot", "created_at",
    "is_deleted", "version"
  ],
  attachments: [
    "attachment_id", "report_id", "update_id", "additional_info_id", "file_id", "file_name",
    "original_file_name", "mime_type", "file_size", "width", "height", "file_role", "is_public",
    "uploaded_by", "created_at", "drive_folder_id", "checksum", "is_deleted", "deleted_at", "version"
  ],
  categories: [
    "category_id", "code", "name", "description", "icon", "color", "default_assignee", "target_days",
    "sort_order", "is_active", "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "version"
  ],
  users: [
    "user_id", "username", "password_hash", "password_salt", "password_version", "display_name", "email",
    "phone", "role", "status", "failed_login_count", "locked_until", "last_login_at",
    "last_password_changed_at", "must_change_password", "created_at", "updated_at", "created_by",
    "updated_by", "is_deleted", "version"
  ],
  sessions: [
    "session_id", "user_id", "token_hash", "expires_at", "revoked_at", "revoke_reason", "created_at",
    "last_used_at", "user_agent_hint", "device_key_hash", "is_active", "version"
  ],
  assignments: [
    "assignment_id", "report_id", "assigned_to", "assigned_by", "note", "assigned_at", "target_due_at",
    "completed_at", "unassigned_at", "assignment_status", "created_at", "version"
  ],
  announcements: [
    "announcement_id", "title", "content", "type", "start_at", "end_at", "is_active", "sort_order",
    "created_by", "updated_by", "created_at", "updated_at", "is_deleted", "version"
  ],
  settings: [
    "key", "value", "type", "description", "is_public", "group_name", "updated_at", "updated_by", "version"
  ],
  activity_logs: [
    "log_id", "user_id", "user_name_snapshot", "role_snapshot", "action", "entity_type", "entity_id",
    "detail", "request_id", "ip_hint", "user_agent_hint", "created_at", "severity", "success"
  ],
  report_additional_info: [
    "additional_info_id", "report_id", "message", "contact_name", "contact_phone", "is_public",
    "review_status", "reviewed_by", "reviewed_at", "created_at", "request_id", "is_deleted", "version"
  ],
  rate_limits: [
    "rate_key", "action", "window_start", "count", "blocked_until", "updated_at", "expires_at"
  ],
  dashboard_cache: [
    "cache_key", "scope", "payload_json", "generated_at", "expires_at", "source_version", "is_valid"
  ],
  schema_migrations: [
    "migration_id", "name", "from_version", "to_version", "applied_at", "applied_by", "checksum", "status", "detail"
  ],
  system_counters: [
    "counter_key", "current_value", "updated_at", "version"
  ],
  export_logs: [
    "export_id", "user_id", "export_type", "filters_json", "included_personal_data", "row_count", "file_id",
    "created_at", "expires_at", "status"
  ]
});

const SETUP_CHECKBOX_COLUMNS_ = Object.freeze({
  reports: ["is_anonymous", "reporter_consent", "truth_confirmation", "is_deleted"],
  report_updates: ["is_public", "is_deleted"],
  attachments: ["is_public", "is_deleted"],
  categories: ["is_active", "is_deleted"],
  users: ["must_change_password", "is_deleted"],
  sessions: ["is_active"],
  announcements: ["is_active", "is_deleted"],
  settings: ["is_public"],
  activity_logs: ["success"],
  report_additional_info: ["is_public", "is_deleted"],
  dashboard_cache: ["is_valid"],
  export_logs: ["included_personal_data"]
});

const SETUP_LIST_VALIDATIONS_ = Object.freeze({
  reports: {
    contact_method: ["phone", "email", "none"],
    priority_reported: ["low", "normal", "high", "critical"],
    priority: ["low", "normal", "high", "critical"],
    status: ["new", "reviewing", "assigned", "in_progress", "waiting", "resolved", "closed", "rejected", "duplicate"],
    source: ["web", "admin", "phone", "line", "other"]
  },
  report_updates: {
    update_type: ["status", "note", "result", "request_info", "info_received", "assignment", "system"],
    old_status: ["", "new", "reviewing", "assigned", "in_progress", "waiting", "resolved", "closed", "rejected", "duplicate"],
    new_status: ["", "new", "reviewing", "assigned", "in_progress", "waiting", "resolved", "closed", "rejected", "duplicate"]
  },
  attachments: {
    mime_type: ["image/jpeg", "image/png", "image/webp"],
    file_role: ["report", "progress", "resolved", "additional", "announcement"]
  },
  users: {
    role: ["super_admin", "admin", "officer", "viewer"],
    status: ["active", "inactive"]
  },
  assignments: {
    assignment_status: ["active", "completed", "reassigned", "cancelled"]
  },
  announcements: {
    type: ["info", "warning", "emergency", "maintenance"]
  },
  settings: {
    type: ["string", "number", "boolean", "json"]
  },
  activity_logs: {
    severity: ["info", "warning", "critical"]
  },
  report_additional_info: {
    review_status: ["pending", "reviewed", "hidden"]
  },
  schema_migrations: {
    status: ["success", "failed", "rolled_back"]
  },
  export_logs: {
    export_type: ["reports", "timeline", "summary"],
    status: ["success", "failed", "deleted"]
  }
});

const SETUP_NUMBER_MIN_VALIDATIONS_ = Object.freeze({
  categories: {
    target_days: 0,
    sort_order: 0
  },
  users: {
    password_version: 1,
    failed_login_count: 0,
    version: 1
  },
  settings: {
    version: 1
  },
  system_counters: {
    current_value: 0,
    version: 1
  }
});

function setupSystem() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheet = SheetRepository_getOrCreateSpreadsheet_();
    const rootFolder = DriveRepository_getOrCreateRootFolder_();
    const createdSheets = [];
    const updatedSheets = [];
    const createdFolders = [];

    Object.keys(SETUP_SHEETS_).forEach(function (sheetName) {
      const existed = !!spreadsheet.getSheetByName(sheetName);
      const sheet = SheetRepository_getOrCreateSheet_(spreadsheet, sheetName);

      Setup_prepareSheet_(sheet, SETUP_SHEETS_[sheetName], sheetName);

      if (existed) {
        updatedSheets.push(sheetName);
      } else {
        createdSheets.push(sheetName);
      }
    });

    SETUP_DRIVE_FOLDERS_.forEach(function (folderName) {
      const before = rootFolder.getFoldersByName(folderName).hasNext();
      DriveRepository_getOrCreateChildFolder_(rootFolder, folderName);
      if (!before) {
        createdFolders.push(folderName);
      }
    });

    seedInitialData();

    return {
      ok: true,
      spreadsheetId: spreadsheet.getId(),
      rootFolderId: rootFolder.getId(),
      createdSheets: createdSheets,
      updatedSheets: updatedSheets,
      createdFolders: createdFolders,
      validation: validateSetup()
    };
  } finally {
    lock.releaseLock();
  }
}

function validateSetup() {
  const result = {
    ok: true,
    missingProperties: [],
    missingSheets: [],
    headerMismatches: [],
    missingFolders: [],
    missingSettings: [],
    missingCategories: []
  };
  if (!Config_getSpreadsheetId_()) {
    result.missingProperties.push(CONFIG_KEYS_.SPREADSHEET_ID);
    result.ok = false;
    return result;
  }

  if (!Config_getRootFolderId_()) {
    result.missingProperties.push(CONFIG_KEYS_.ROOT_FOLDER_ID);
    result.ok = false;
    return result;
  }

  const spreadsheet = SheetRepository_getSpreadsheet_();
  const rootFolder = DriveApp.getFolderById(Config_getRootFolderId_());

  Object.keys(SETUP_SHEETS_).forEach(function (sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      result.missingSheets.push(sheetName);
      result.ok = false;
      return;
    }

    const actualHeaders = sheet.getRange(1, 1, 1, SETUP_SHEETS_[sheetName].length).getValues()[0];
    if (actualHeaders.join("|") !== SETUP_SHEETS_[sheetName].join("|")) {
      result.headerMismatches.push(sheetName);
      result.ok = false;
    }
  });

  SETUP_DRIVE_FOLDERS_.forEach(function (folderName) {
    if (!rootFolder.getFoldersByName(folderName).hasNext()) {
      result.missingFolders.push(folderName);
      result.ok = false;
    }
  });

  Setup_getPublicSettingsSeed_().forEach(function (setting) {
    if (!SheetRepository_findRowByKey_(spreadsheet.getSheetByName("settings"), "key", setting.key)) {
      result.missingSettings.push(setting.key);
      result.ok = false;
    }
  });

  Setup_getCategorySeed_().forEach(function (category) {
    if (!SheetRepository_findRowByKey_(spreadsheet.getSheetByName("categories"), "code", category.code)) {
      result.missingCategories.push(category.code);
      result.ok = false;
    }
  });

  return result;
}

function seedInitialData() {
  const spreadsheetId = Config_getSpreadsheetId_();

  if (!spreadsheetId) {
    throw new Error("Missing Script Property: SPREADSHEET_ID");
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  const categories = seedCategories();
  const settings = seedSettings();
  Setup_seedSchemaVersion_(spreadsheet.getSheetByName("schema_migrations"));

  return {
    ok: true,
    categories: categories,
    settings: settings
  };
}

function seedCategories() {
  const spreadsheetId = Config_getSpreadsheetId_();

  if (!spreadsheetId) {
    throw new Error("Missing Script Property: SPREADSHEET_ID");
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName("categories");

  if (!sheet) {
    throw new Error("Missing required sheet: categories");
  }

  Setup_assertHeaderMatches_("categories", sheet, SETUP_SHEETS_.categories);

  return Setup_seedCategories_(sheet);
}

function runMigrateCategoriesAddIsDeletedColumnForDevOnly() {
  const lock = LockService.getScriptLock();

  Setup_assertMigrationAllowed_();
  lock.waitLock(30000);

  try {
    const spreadsheet = SheetRepository_getSpreadsheet_();
    const sheet = spreadsheet.getSheetByName("categories");

    if (!sheet) {
      throw new Error("Missing required sheet: categories");
    }

    const result = Setup_migrateCategoriesAddIsDeletedColumn_(sheet);

    console.log(JSON.stringify({
      migration: "categories.add_is_deleted",
      insertedColumn: result.insertedColumn,
      updatedRows: result.updatedRows,
      header: result.headerAfter
    }));

    return result;
  } finally {
    lock.releaseLock();
  }
}

function Setup_migrateCategoriesAddIsDeletedColumn_(sheet) {
  const expectedHeaders = SETUP_SHEETS_.categories;
  const migrationPlan = Setup_planAddMissingColumn_(SheetRepository_getHeaders_(sheet), {
    sheetName: "categories",
    columnName: "is_deleted",
    beforeColumnName: "version",
    expectedHeaders: expectedHeaders
  });
  let insertedColumn = false;

  if (migrationPlan.insertColumn) {
    if (sheet.getMaxColumns() < migrationPlan.insertAt) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), migrationPlan.insertAt - sheet.getMaxColumns());
    }

    sheet.insertColumnBefore(migrationPlan.insertAt);
    sheet.getRange(1, migrationPlan.insertAt, 1, 1).setValue("is_deleted");
    insertedColumn = true;
  }

  const updatedRows = Setup_fillBooleanDefaultForExistingRows_(sheet, "code", "is_deleted", false);

  SheetRepository_insertCheckboxes_(sheet, expectedHeaders, SETUP_CHECKBOX_COLUMNS_.categories, "code");
  Setup_assertHeaderMatches_("categories", sheet, expectedHeaders);

  return {
    ok: true,
    migration: "categories.add_is_deleted",
    insertedColumn: insertedColumn,
    updatedRows: updatedRows,
    columnName: "is_deleted",
    columnIndex: SheetRepository_getHeaderMap_(sheet).is_deleted,
    defaultValue: false,
    headerBefore: migrationPlan.headerBefore,
    headerAfter: sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0]
  };
}

function Setup_planAddMissingColumn_(actualHeaders, options) {
  const safeOptions = options || {};
  const expectedHeaders = safeOptions.expectedHeaders || [];
  const columnName = safeOptions.columnName || "";
  const beforeColumnName = safeOptions.beforeColumnName || "";
  const headerBefore = (actualHeaders || []).slice();
  const expectedWithoutColumn = expectedHeaders.filter(function (header) {
    return header !== columnName;
  });
  const expectedPosition = expectedHeaders.indexOf(columnName) + 1;
  const existingPosition = headerBefore.indexOf(columnName) + 1;

  if (!columnName || expectedPosition < 1) {
    throw new Error("Invalid migration column: " + columnName);
  }

  if (existingPosition > 0) {
    Setup_assertHeaderArrayMatches_(safeOptions.sheetName || "", headerBefore, expectedHeaders);
    return {
      headerBefore: headerBefore,
      insertColumn: false,
      insertAt: existingPosition,
      headerAfter: headerBefore.slice()
    };
  }

  Setup_assertHeaderArrayMatches_(safeOptions.sheetName || "", headerBefore, expectedWithoutColumn);

  const beforePosition = headerBefore.indexOf(beforeColumnName) + 1;
  const insertAt = beforePosition > 0 ? beforePosition : expectedPosition;
  const headerAfter = headerBefore.slice();

  headerAfter.splice(insertAt - 1, 0, columnName);
  Setup_assertHeaderArrayMatches_(safeOptions.sheetName || "", headerAfter, expectedHeaders);

  return {
    headerBefore: headerBefore,
    insertColumn: true,
    insertAt: insertAt,
    headerAfter: headerAfter
  };
}

function Setup_fillBooleanDefaultForExistingRows_(sheet, keyColumnName, columnName, defaultValue) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const keyColumn = headerMap[keyColumnName];
  const targetColumn = headerMap[columnName];
  const lastRow = sheet.getLastRow();
  let updatedRows = 0;

  if (!keyColumn || !targetColumn || lastRow < 2) {
    return updatedRows;
  }

  const rowCount = lastRow - 1;
  const keyValues = sheet.getRange(2, keyColumn, rowCount, 1).getValues();
  const targetRange = sheet.getRange(2, targetColumn, rowCount, 1);
  const targetValues = targetRange.getValues();

  keyValues.forEach(function (row, index) {
    const key = String(row[0] || "");
    const currentValue = targetValues[index][0];

    if (!key || !(currentValue === "" || currentValue === null || currentValue === undefined)) {
      return;
    }

    targetValues[index][0] = defaultValue;
    updatedRows += 1;
  });

  if (updatedRows > 0) {
    targetRange.setValues(targetValues);
  }

  return updatedRows;
}

function Setup_assertHeaderArrayMatches_(sheetName, actualHeaders, expectedHeaders) {
  if ((actualHeaders || []).join("|") !== (expectedHeaders || []).join("|")) {
    throw new Error(
      "Header mismatch in sheet " + sheetName +
      ". Expected: " + (expectedHeaders || []).join(", ") +
      ". Actual: " + (actualHeaders || []).join(", ")
    );
  }
}

function Setup_assertMigrationAllowed_() {
  const environment = typeof Config_getEnvironment_ === "function" ?
    Utils_normalizeString_(Config_getEnvironment_()).toLowerCase() :
    "development";

  if (environment === "production") {
    throw ApiError_("FORBIDDEN", "Schema migration is blocked when ENVIRONMENT=production.");
  }
}

function seedSettings() {
  const spreadsheetId = Config_getSpreadsheetId_();

  if (!spreadsheetId) {
    throw new Error("Missing Script Property: SPREADSHEET_ID");
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName("settings");

  if (!sheet) {
    throw new Error("Missing required sheet: settings");
  }

  Setup_assertHeaderMatches_("settings", sheet, SETUP_SHEETS_.settings);

  return Setup_seedSettings_(sheet);
}

function validateSeedData() {
  const spreadsheetId = Config_getSpreadsheetId_();

  if (!spreadsheetId) {
    throw new Error("Missing Script Property: SPREADSHEET_ID");
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const categoriesSheet = spreadsheet.getSheetByName("categories");
  const settingsSheet = spreadsheet.getSheetByName("settings");

  if (!categoriesSheet) {
    throw new Error("Missing required sheet: categories");
  }

  if (!settingsSheet) {
    throw new Error("Missing required sheet: settings");
  }

  Setup_assertHeaderMatches_("categories", categoriesSheet, SETUP_SHEETS_.categories);
  Setup_assertHeaderMatches_("settings", settingsSheet, SETUP_SHEETS_.settings);

  const categoryRows = Setup_getDataRowsByKey_(categoriesSheet, SETUP_SHEETS_.categories.length, "code");
  const categoriesCount = categoryRows.length;

  if (categoriesCount < 1) {
    throw new Error("Sheet categories must contain at least 1 data row");
  }

  const categoryHeaderMap = SheetRepository_getHeaderMap_(categoriesSheet);
  const activeCategoriesCount = categoryRows.filter(function (row) {
    return Utils_toBoolean_(row[categoryHeaderMap.is_active - 1]);
  }).length;

  if (activeCategoriesCount < 1) {
    throw new Error("Sheet categories must contain at least 1 active category");
  }

  const settingsRows = Setup_getDataRowsByKey_(settingsSheet, SETUP_SHEETS_.settings.length, "key");
  const settingsHeaderMap = SheetRepository_getHeaderMap_(settingsSheet);
  const existingSettings = {};

  settingsRows.forEach(function (row) {
    const key = String(row[settingsHeaderMap.key - 1] || "");
    if (key) {
      existingSettings[key] = true;
    }
  });

  const missingSettings = SETUP_REQUIRED_SETTING_KEYS_.filter(function (key) {
    return !existingSettings[key];
  });

  if (missingSettings.length > 0) {
    throw new Error("Missing required settings keys: " + missingSettings.join(", "));
  }

  console.log("Categories count: " + categoriesCount);
  console.log("Active categories count: " + activeCategoriesCount);
  console.log("Settings count: " + settingsRows.length);

  return {
    ok: true,
    categoriesCount: categoriesCount,
    activeCategoriesCount: activeCategoriesCount,
    settingsCount: settingsRows.length,
    missingSettings: []
  };
}

function Setup_assertHeaderMatches_(sheetName, sheet, expectedHeaders) {
  const actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];

  if (actualHeaders.join("|") !== expectedHeaders.join("|")) {
    throw new Error(
      "Header mismatch in sheet " + sheetName +
      ". Expected: " + expectedHeaders.join(", ") +
      ". Actual: " + actualHeaders.join(", ")
    );
  }
}

function Setup_getDataRowsByKey_(sheet, columnCount, keyColumnName) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const keyColumn = headerMap[keyColumnName];
  const lastRow = sheet.getLastRow();

  if (!keyColumn) {
    throw new Error("Missing key column: " + keyColumnName + " in sheet " + sheet.getName());
  }

  if (lastRow < 2) {
    return [];
  }

  return sheet.getRange(2, 1, lastRow - 1, columnCount).getValues().filter(function (row) {
    return String(row[keyColumn - 1] || "") !== "";
  });
}

function Setup_prepareSheet_(sheet, headers, sheetName) {
  SheetRepository_applyHeader_(sheet, headers);
  SheetRepository_applyColumnWidths_(sheet, headers, Setup_getColumnWidthMap_());

  if (SETUP_CHECKBOX_COLUMNS_[sheetName]) {
    SheetRepository_insertCheckboxes_(sheet, headers, SETUP_CHECKBOX_COLUMNS_[sheetName], SETUP_PRIMARY_KEY_COLUMNS_[sheetName]);
  }

  if (SETUP_LIST_VALIDATIONS_[sheetName]) {
    Object.keys(SETUP_LIST_VALIDATIONS_[sheetName]).forEach(function (columnName) {
      SheetRepository_applyListValidation_(sheet, columnName, SETUP_LIST_VALIDATIONS_[sheetName][columnName]);
    });
  }

  if (SETUP_NUMBER_MIN_VALIDATIONS_[sheetName]) {
    Object.keys(SETUP_NUMBER_MIN_VALIDATIONS_[sheetName]).forEach(function (columnName) {
      SheetRepository_applyNumberValidation_(sheet, columnName, SETUP_NUMBER_MIN_VALIDATIONS_[sheetName][columnName]);
    });
  }
}

function Setup_seedCategories_(sheet) {
  const now = Utils_nowIso_();
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const rows = Setup_getDataRowsByKey_(sheet, SETUP_SHEETS_.categories.length, "code");
  const existingCodes = {};
  const insertedCodes = [];
  const skippedCodes = [];

  rows.forEach(function (row) {
    const code = String(row[headerMap.code - 1] || "");
    if (code) {
      existingCodes[code] = true;
    }
  });

  Setup_getCategorySeed_().forEach(function (category) {
    if (existingCodes[category.code]) {
      skippedCodes.push(category.code);
      return;
    }

    const rowObject = {
      category_id: category.category_id,
      code: category.code,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      default_assignee: "",
      target_days: category.target_days,
      sort_order: category.sort_order,
      is_active: true,
      created_at: now,
      updated_at: now,
      created_by: "setup",
      updated_by: "setup",
      is_deleted: false,
      version: 1
    };
    const row = SETUP_SHEETS_.categories.map(function (header) {
      return rowObject[header] === undefined ? "" : rowObject[header];
    });

    sheet.getRange(findFirstEmptyDataRow_(sheet, "code"), 1, 1, SETUP_SHEETS_.categories.length).setValues([row]);
    existingCodes[category.code] = true;
    insertedCodes.push(category.code);
  });

  SheetRepository_insertCheckboxes_(sheet, SETUP_SHEETS_.categories, SETUP_CHECKBOX_COLUMNS_.categories, "code");

  console.log("seedCategories existing count: " + rows.length);
  console.log("seedCategories inserted count: " + insertedCodes.length);
  console.log("seedCategories skipped count: " + skippedCodes.length);

  return {
    ok: true,
    existingCount: rows.length,
    insertedCount: insertedCodes.length,
    skippedCount: skippedCodes.length,
    insertedCodes: insertedCodes,
    skippedCodes: skippedCodes
  };
}

function Setup_seedSettings_(sheet) {
  const now = Utils_nowIso_();
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const rows = Setup_getDataRowsByKey_(sheet, SETUP_SHEETS_.settings.length, "key");
  const existingKeys = {};
  const insertedKeys = [];
  const skippedKeys = [];

  rows.forEach(function (row) {
    const key = String(row[headerMap.key - 1] || "");
    if (key) {
      existingKeys[key] = true;
    }
  });

  const seedItems = Setup_getPublicSettingsSeed_();
  const missingBeforeSeed = SETUP_REQUIRED_SETTING_KEYS_.filter(function (key) {
    return !existingKeys[key];
  });

  seedItems.forEach(function (setting) {
    if (existingKeys[setting.key]) {
      skippedKeys.push(setting.key);
      return;
    }

    const row = SETUP_SHEETS_.settings.map(function (header) {
      const rowObject = {
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
        is_public: setting.is_public,
        group_name: setting.group_name,
        updated_at: now,
        updated_by: "setup",
        version: 1
      };

      return rowObject[header] === undefined ? "" : rowObject[header];
    });

    sheet.getRange(findFirstEmptyDataRow_(sheet, "key"), 1, 1, SETUP_SHEETS_.settings.length).setValues([row]);

    existingKeys[setting.key] = true;
    insertedKeys.push(setting.key);
  });

  SheetRepository_insertCheckboxes_(sheet, SETUP_SHEETS_.settings, SETUP_CHECKBOX_COLUMNS_.settings, "key");

  const missingAfterSeed = SETUP_REQUIRED_SETTING_KEYS_.filter(function (key) {
    return !existingKeys[key];
  });

  console.log("seedSettings existing count: " + rows.length);
  console.log("seedSettings inserted count: " + insertedKeys.length);
  console.log("seedSettings skipped count: " + skippedKeys.length);
  console.log("seedSettings missing keys before seed: " + (missingBeforeSeed.length ? missingBeforeSeed.join(", ") : "-"));
  console.log("seedSettings missing keys after seed: " + (missingAfterSeed.length ? missingAfterSeed.join(", ") : "-"));

  return {
    ok: missingAfterSeed.length === 0,
    existingCount: rows.length,
    insertedCount: insertedKeys.length,
    skippedCount: skippedKeys.length,
    missingBeforeSeed: missingBeforeSeed,
    missingAfterSeed: missingAfterSeed,
    insertedKeys: insertedKeys,
    skippedKeys: skippedKeys
  };
}

function Setup_seedSchemaVersion_(sheet) {
  SheetRepository_upsertByKey_(sheet, "migration_id", {
    migration_id: "20260626_001",
    name: "initial_schema_setup",
    from_version: "",
    to_version: SETUP_SCHEMA_VERSION_,
    applied_at: Utils_nowIso_(),
    applied_by: "setup",
    checksum: "",
    status: "success",
    detail: "Initial Google Sheets and Drive setup"
  });
}

function repairSeedRowPlacement() {
  const spreadsheetId = Config_getSpreadsheetId_();

  if (!spreadsheetId) {
    throw new Error("Missing Script Property: SPREADSHEET_ID");
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const categoriesSheet = spreadsheet.getSheetByName("categories");
  const settingsSheet = spreadsheet.getSheetByName("settings");

  if (!categoriesSheet) {
    throw new Error("Missing required sheet: categories");
  }

  if (!settingsSheet) {
    throw new Error("Missing required sheet: settings");
  }

  Setup_assertHeaderMatches_("categories", categoriesSheet, SETUP_SHEETS_.categories);
  Setup_assertHeaderMatches_("settings", settingsSheet, SETUP_SHEETS_.settings);

  const beforeDetails = {
    categories: Setup_getPhysicalSummary_(categoriesSheet, SETUP_SHEETS_.categories.length, "code"),
    settings: Setup_getPhysicalSummary_(settingsSheet, SETUP_SHEETS_.settings.length, "key")
  };
  const before = {
    categories: Setup_compactPhysicalSummary_(beforeDetails.categories),
    settings: Setup_compactPhysicalSummary_(beforeDetails.settings)
  };

  const categories = Setup_repairSeedSheet_(
    categoriesSheet,
    SETUP_SHEETS_.categories,
    "code",
    Setup_getCategorySeed_().map(function (category) {
      return category.code;
    })
  );
  const settings = Setup_repairSeedSheet_(
    settingsSheet,
    SETUP_SHEETS_.settings,
    "key",
    Setup_getPublicSettingsSeed_().map(function (setting) {
      return setting.key;
    })
  );

  const falseOnlyRowsCleared = {
    categories: Setup_clearFalseOnlyRows_(categoriesSheet, SETUP_SHEETS_.categories.length, "code"),
    settings: Setup_clearFalseOnlyRows_(settingsSheet, SETUP_SHEETS_.settings.length, "key")
  };

  SheetRepository_insertCheckboxes_(categoriesSheet, SETUP_SHEETS_.categories, SETUP_CHECKBOX_COLUMNS_.categories, "code");
  SheetRepository_insertCheckboxes_(settingsSheet, SETUP_SHEETS_.settings, SETUP_CHECKBOX_COLUMNS_.settings, "key");

  const afterDetails = {
    categories: Setup_getPhysicalSummary_(categoriesSheet, SETUP_SHEETS_.categories.length, "code"),
    settings: Setup_getPhysicalSummary_(settingsSheet, SETUP_SHEETS_.settings.length, "key")
  };
  const after = {
    categories: Setup_compactPhysicalSummary_(afterDetails.categories),
    settings: Setup_compactPhysicalSummary_(afterDetails.settings)
  };

  console.log("repairSeedRowPlacement before: " + JSON.stringify(before));
  console.log("repairSeedRowPlacement after: " + JSON.stringify(after));

  return {
    ok: true,
    before: before,
    after: after,
    categories: categories,
    settings: settings,
    falseOnlyRowsCleared: falseOnlyRowsCleared
  };
}

function validatePhysicalSeedPlacement() {
  const spreadsheetId = Config_getSpreadsheetId_();

  if (!spreadsheetId) {
    throw new Error("Missing Script Property: SPREADSHEET_ID");
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const categoriesSheet = spreadsheet.getSheetByName("categories");
  const settingsSheet = spreadsheet.getSheetByName("settings");

  if (!categoriesSheet) {
    throw new Error("Missing required sheet: categories");
  }

  if (!settingsSheet) {
    throw new Error("Missing required sheet: settings");
  }

  Setup_assertHeaderMatches_("categories", categoriesSheet, SETUP_SHEETS_.categories);
  Setup_assertHeaderMatches_("settings", settingsSheet, SETUP_SHEETS_.settings);

  const categories = Setup_getPhysicalSummary_(categoriesSheet, SETUP_SHEETS_.categories.length, "code");
  const settings = Setup_getPhysicalSummary_(settingsSheet, SETUP_SHEETS_.settings.length, "key");
  const compactCategories = Setup_compactPhysicalSummary_(categories);
  const compactSettings = Setup_compactPhysicalSummary_(settings);

  Setup_assertPhysicalSeedSheet_("categories", categories, Setup_getCategorySeed_().map(function (category) {
    return category.code;
  }));
  Setup_assertPhysicalSeedSheet_("settings", settings, SETUP_REQUIRED_SETTING_KEYS_);

  console.log("validatePhysicalSeedPlacement categories: " + JSON.stringify(compactCategories));
  console.log("validatePhysicalSeedPlacement settings: " + JSON.stringify(compactSettings));

  return {
    ok: true,
    categories: compactCategories,
    settings: compactSettings
  };
}

function debugActualSpreadsheetData() {
  const spreadsheetId = Config_getSpreadsheetId_();

  if (!spreadsheetId) {
    throw new Error("Missing Script Property: SPREADSHEET_ID");
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const targets = [
    { sheetName: "categories", headers: SETUP_SHEETS_.categories, keyColumnName: "code" },
    { sheetName: "settings", headers: SETUP_SHEETS_.settings, keyColumnName: "key" }
  ];
  const result = {};

  targets.forEach(function (target) {
    const sheet = spreadsheet.getSheetByName(target.sheetName);
    if (!sheet) {
      throw new Error("Missing required sheet: " + target.sheetName);
    }

    Setup_assertHeaderMatches_(target.sheetName, sheet, target.headers);

    const summary = Setup_getPhysicalSummary_(sheet, target.headers.length, target.keyColumnName);

    console.log("debug " + target.sheetName + " header: " + JSON.stringify(target.headers));
    console.log("debug " + target.sheetName + " real row count: " + summary.realRowCount);
    console.log("debug " + target.sheetName + " first real row: " + summary.firstDataRow);
    console.log("debug " + target.sheetName + " last real row: " + summary.lastDataRow);
    console.log("debug " + target.sheetName + " sample rows: " + JSON.stringify(summary.sampleRows));
    console.log("debug " + target.sheetName + " false-only row count: " + summary.falseOnlyRowCount);

    result[target.sheetName] = Setup_compactPhysicalSummary_(summary);
  });

  return {
    ok: true,
    sheets: result
  };
}

function Setup_repairSeedSheet_(sheet, headers, keyColumnName, seedKeys) {
  const summary = Setup_getPhysicalSummary_(sheet, headers.length, keyColumnName);
  const seedKeyMap = {};
  const movedKeys = [];
  const clearedRows = [];
  const duplicates = [];

  seedKeys.forEach(function (key) {
    seedKeyMap[key] = true;
  });

  seedKeys.forEach(function (seedKey, index) {
    const targetRow = index + 2;
    const seedRows = summary.realRows.filter(function (row) {
      return row.key === seedKey;
    });

    if (seedRows.length < 1) {
      return;
    }

    const source = seedRows[0];
    const targetKey = Setup_getKeyAtRow_(sheet, keyColumnName, targetRow);

    if (targetKey && targetKey !== seedKey) {
      throw new Error(
        "Cannot move seed key " + seedKey +
        " in sheet " + sheet.getName() +
        " because target row " + targetRow +
        " contains non-seed key: " + targetKey
      );
    }

    if (source.rowIndex !== targetRow) {
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([source.values]);
      sheet.getRange(source.rowIndex, 1, 1, headers.length).clearContent();
      movedKeys.push(seedKey);
      clearedRows.push(source.rowIndex);
    }

    if (seedRows.length > 1) {
      seedRows.slice(1).forEach(function (duplicate) {
        sheet.getRange(duplicate.rowIndex, 1, 1, headers.length).clearContent();
        duplicates.push({ key: duplicate.key, rowIndex: duplicate.rowIndex });
        clearedRows.push(duplicate.rowIndex);
      });
    }
  });

  console.log("repair " + sheet.getName() + " moved keys: " + (movedKeys.length ? movedKeys.join(", ") : "-"));
  console.log("repair " + sheet.getName() + " cleared rows: " + (clearedRows.length ? clearedRows.join(", ") : "-"));

  return {
    movedKeys: movedKeys,
    clearedRows: clearedRows,
    duplicates: duplicates
  };
}

function Setup_clearFalseOnlyRows_(sheet, columnCount, keyColumnName) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const clearedRows = [];

  if (!headerMap[keyColumnName]) {
    throw new Error("Missing key column: " + keyColumnName + " in sheet " + sheet.getName());
  }

  if (sheet.getLastRow() < 2) {
    return clearedRows;
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, columnCount).getValues();

  values.forEach(function (row, index) {
    const rowIndex = index + 2;

    if (Setup_isFalseOnlyRow_(row)) {
      sheet.getRange(rowIndex, 1, 1, columnCount).clearContent();
      clearedRows.push(rowIndex);
    }
  });

  console.log("repair " + sheet.getName() + " false-only rows cleared: " + (clearedRows.length ? clearedRows.length : 0));

  return clearedRows;
}

function Setup_getPhysicalSummary_(sheet, columnCount, keyColumnName) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const keyColumn = headerMap[keyColumnName];
  const lastRow = sheet.getLastRow();
  const realRows = [];
  let falseOnlyRowCount = 0;

  if (!keyColumn) {
    throw new Error("Missing key column: " + keyColumnName + " in sheet " + sheet.getName());
  }

  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, columnCount).getValues();

    values.forEach(function (row, index) {
      const rowIndex = index + 2;
      const key = String(row[keyColumn - 1] || "");

      if (key) {
        realRows.push({
          rowIndex: rowIndex,
          key: key,
          values: row
        });
        return;
      }

      if (Setup_isFalseOnlyRow_(row)) {
        falseOnlyRowCount += 1;
      }
    });
  }

  return {
    sheetName: sheet.getName(),
    keyColumnName: keyColumnName,
    header: sheet.getRange(1, 1, 1, columnCount).getValues()[0],
    realRowCount: realRows.length,
    firstDataRow: realRows.length ? realRows[0].rowIndex : 0,
    lastDataRow: realRows.length ? realRows[realRows.length - 1].rowIndex : 0,
    falseOnlyRowCount: falseOnlyRowCount,
    realKeys: realRows.map(function (row) {
      return row.key;
    }),
    sampleRows: realRows.slice(0, 20).map(function (row) {
      return {
        rowIndex: row.rowIndex,
        values: row.values
      };
    }),
    realRows: realRows
  };
}

function Setup_compactPhysicalSummary_(summary) {
  return {
    sheetName: summary.sheetName,
    keyColumnName: summary.keyColumnName,
    header: summary.header,
    realRowCount: summary.realRowCount,
    firstDataRow: summary.firstDataRow,
    lastDataRow: summary.lastDataRow,
    falseOnlyRowCount: summary.falseOnlyRowCount,
    sampleKeys: summary.realKeys.slice(0, 20),
    sampleRows: summary.sampleRows
  };
}

function Setup_assertPhysicalSeedSheet_(sheetName, summary, requiredKeys) {
  const keyMap = {};
  const duplicates = [];

  summary.realRows.forEach(function (row) {
    if (keyMap[row.key]) {
      duplicates.push(row.key);
    }
    keyMap[row.key] = row.rowIndex;
  });

  if (duplicates.length > 0) {
    throw new Error("Duplicate keys in sheet " + sheetName + ": " + duplicates.join(", "));
  }

  if (summary.firstDataRow !== 2) {
    throw new Error(
      "Seed data in sheet " + sheetName +
      " starts at row " + summary.firstDataRow +
      "; expected row 2. False-only rows before seed: " + summary.falseOnlyRowCount
    );
  }

  if (summary.falseOnlyRowCount > 0) {
    throw new Error("Sheet " + sheetName + " still contains false-only blank rows: " + summary.falseOnlyRowCount);
  }

  const missingKeys = requiredKeys.filter(function (key) {
    return !keyMap[key];
  });

  if (missingKeys.length > 0) {
    throw new Error("Missing required keys in sheet " + sheetName + ": " + missingKeys.join(", "));
  }

  requiredKeys.forEach(function (key) {
    const rowIndex = keyMap[key];
    if (rowIndex < summary.firstDataRow || rowIndex > summary.lastDataRow) {
      throw new Error("Required key " + key + " is outside real data range in sheet " + sheetName);
    }
  });
}

function Setup_isFalseOnlyRow_(row) {
  let hasFalse = false;

  return row.every(function (cell) {
    if (cell === "" || cell === null) {
      return true;
    }

    if (cell === false || String(cell).toUpperCase() === "FALSE") {
      hasFalse = true;
      return true;
    }

    return false;
  }) && hasFalse;
}

function Setup_getKeyAtRow_(sheet, keyColumnName, rowIndex) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const keyColumn = headerMap[keyColumnName];

  if (!keyColumn) {
    throw new Error("Missing key column: " + keyColumnName + " in sheet " + sheet.getName());
  }

  return String(sheet.getRange(rowIndex, keyColumn, 1, 1).getValue() || "");
}

function setupFirstAdmin(input) {
  const lock = LockService.getScriptLock();
  const payload = Utils_isPlainObject_(input) ? input : {};
  const requestId = Utils_createRequestId_();

  lock.waitLock(30000);

  try {
    Setup_validateFirstAdminSetupKey_(payload.setupKey);

    if (UserService_hasAnyUser_()) {
      throw ApiError_("SETUP_ALREADY_COMPLETED", "มีผู้ใช้งานในระบบแล้ว");
    }

    const user = UserService_createUser_({
      username: payload.username,
      password: payload.temporaryPassword || payload.password,
      displayName: payload.displayName || "ผู้ดูแลระบบ",
      email: payload.email || "",
      phone: payload.phone || "",
      role: "super_admin",
      mustChangePassword: true
    }, {
      createdBy: "setup"
    });

    AuditService_logFirstAdminCreated_(user, requestId);

    return {
      ok: true,
      user: UserService_projectAuthUser_(user),
      mustChangePassword: true
    };
  } finally {
    lock.releaseLock();
  }
}

function Setup_validateFirstAdminSetupKey_(setupKey) {
  const expectedKey = Config_getProperty_(CONFIG_KEYS_.ADMIN_SETUP_KEY, "");
  const providedKey = Utils_normalizeString_(setupKey);

  if (!expectedKey) {
    throw ApiError_("SETUP_KEY_MISSING", "ยังไม่ได้ตั้งค่า ADMIN_SETUP_KEY ใน Script Properties");
  }

  if (!providedKey || !Security_constantTimeEquals_(providedKey, expectedKey)) {
    throw ApiError_("FORBIDDEN", "Setup Key ไม่ถูกต้อง");
  }

  return true;
}

function Setup_getCategorySeed_() {
  return [
    { category_id: "CAT-001", code: "ROAD", name: "ถนน ทางเท้า และสะพาน", description: "ปัญหาถนนชำรุด ทางเท้า หรือสะพาน", icon: "road", color: "#287444", target_days: 14, sort_order: 1 },
    { category_id: "CAT-002", code: "LIGHT", name: "ไฟฟ้าและไฟส่องสว่าง", description: "ไฟฟ้าสาธารณะ ไฟส่องสว่าง หรือไฟดับ", icon: "lightbulb", color: "#348A52", target_days: 7, sort_order: 2 },
    { category_id: "CAT-003", code: "WATER", name: "น้ำประปาและแหล่งน้ำ", description: "น้ำประปา แหล่งน้ำ หรือระบบน้ำชุมชน", icon: "droplet", color: "#2F80ED", target_days: 7, sort_order: 3 },
    { category_id: "CAT-004", code: "WASTE", name: "ขยะและความสะอาด", description: "ขยะตกค้าง จุดทิ้งขยะ หรือความสะอาดพื้นที่สาธารณะ", icon: "trash", color: "#2E7D32", target_days: 5, sort_order: 4 },
    { category_id: "CAT-005", code: "DRAIN", name: "น้ำท่วมและทางระบายน้ำ", description: "น้ำท่วมขัง ท่อระบายน้ำ หรือทางน้ำอุดตัน", icon: "waves", color: "#287444", target_days: 7, sort_order: 5 },
    { category_id: "CAT-006", code: "ENV", name: "สิ่งแวดล้อมและมลพิษ", description: "กลิ่น ควัน เสียง น้ำเสีย หรือมลพิษอื่น ๆ", icon: "leaf", color: "#1F5E36", target_days: 14, sort_order: 6 },
    { category_id: "CAT-007", code: "SAFETY", name: "ความปลอดภัยและเหตุเดือดร้อน", description: "จุดเสี่ยง อุบัติเหตุ หรือเหตุเดือดร้อนที่ไม่ใช่เหตุฉุกเฉิน", icon: "shield", color: "#D98200", target_days: 3, sort_order: 7 },
    { category_id: "CAT-008", code: "ANIMAL", name: "สัตว์จรจัดและสัตว์รบกวน", description: "สัตว์จรจัด สัตว์รบกวน หรือปัญหาที่เกี่ยวข้อง", icon: "paw-print", color: "#348A52", target_days: 7, sort_order: 8 },
    { category_id: "CAT-009", code: "PUBLIC", name: "สาธารณสถานและทรัพย์สินส่วนรวม", description: "ศาลา สนาม พื้นที่สาธารณะ หรือทรัพย์สินส่วนรวม", icon: "landmark", color: "#287444", target_days: 14, sort_order: 9 },
    { category_id: "CAT-010", code: "OTHER", name: "ข้อเสนอแนะและเรื่องอื่น ๆ", description: "ข้อเสนอแนะหรือเรื่องอื่น ๆ ที่เกี่ยวข้องกับชุมชน", icon: "message-circle", color: "#66736B", target_days: 14, sort_order: 10 }
  ];
}

function Setup_getPublicSettingsSeed_() {
  return [
    { key: "app_name", value: "Khaophang Report", type: "string", description: "ชื่อระบบภาษาอังกฤษ", is_public: true, group_name: "general" },
    { key: "app_name_th", value: "ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง", type: "string", description: "ชื่อระบบภาษาไทย", is_public: true, group_name: "general" },
    { key: "contact_email", value: "khaophangreport@gmail.com", type: "string", description: "อีเมลติดต่อโครงการ", is_public: true, group_name: "contact" },
    { key: "site_url", value: "https://khaophangreport.pages.dev", type: "string", description: "URL เว็บไซต์", is_public: true, group_name: "general" },
    { key: "contact_phone", value: "", type: "string", description: "เบอร์โทรติดต่อโครงการ", is_public: true, group_name: "contact" },
    { key: "office_hours", value: "", type: "string", description: "เวลาทำการ", is_public: true, group_name: "contact" },
    { key: "max_images", value: "3", type: "number", description: "จำนวนรูปสูงสุดต่อเรื่อง", is_public: true, group_name: "upload" },
    { key: "max_image_size_mb", value: "1", type: "number", description: "ขนาดรูปสูงสุดหลังบีบอัดต่อรูป", is_public: true, group_name: "upload" },
    { key: "max_image_dimension", value: "1600", type: "number", description: "ด้านยาวสูงสุดของรูป", is_public: true, group_name: "upload" },
    { key: "default_page_size", value: "20", type: "number", description: "จำนวนรายการเริ่มต้นต่อหน้า", is_public: true, group_name: "pagination" },
    { key: "privacy_version", value: "1.0", type: "string", description: "เวอร์ชันนโยบายความเป็นส่วนตัว", is_public: true, group_name: "privacy" },
    { key: "terms_version", value: "1.0", type: "string", description: "เวอร์ชันเงื่อนไขการใช้งาน", is_public: true, group_name: "privacy" },
    { key: "maintenance_mode", value: "false", type: "boolean", description: "สถานะปิดปรับปรุงระบบ", is_public: true, group_name: "system" },
    { key: "schema_version", value: "1", type: "string", description: "เวอร์ชันโครงสร้างข้อมูล", is_public: false, group_name: "system" }
  ];
}

function Setup_getColumnWidthMap_() {
  return {
    description: 280,
    content: 320,
    detail: 320,
    payload_json: 320,
    filters_json: 260,
    search_text: 320,
    title: 240,
    public_message: 280,
    internal_note: 280,
    internal_summary: 280,
    map_url: 260,
    created_at: 190,
    updated_at: 190,
    expires_at: 190,
    applied_at: 190
  };
}
