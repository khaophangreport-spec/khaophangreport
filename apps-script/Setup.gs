var SETUP_SCHEMA_VERSION = '1.0.0';

var SETUP_DRIVE_FOLDERS = Object.freeze([
  'reports',
  'announcements',
  'exports',
  'backups',
  'temp'
]);

var SETUP_ENUMS = Object.freeze({
  booleanColumns: [
    'is_anonymous',
    'reporter_consent',
    'truth_confirmation',
    'is_deleted',
    'is_public',
    'is_active',
    'must_change_password',
    'success',
    'included_personal_data',
    'is_valid'
  ],
  priority: ['low', 'normal', 'high', 'critical'],
  reportStatus: ['new', 'reviewing', 'assigned', 'in_progress', 'waiting', 'resolved', 'closed', 'rejected', 'duplicate'],
  updateType: ['status', 'note', 'result', 'request_info', 'info_received', 'assignment', 'system'],
  source: ['web', 'admin', 'phone', 'line', 'other'],
  contactMethod: ['phone', 'email', 'none'],
  fileRole: ['report', 'progress', 'resolved', 'additional', 'announcement'],
  mimeType: ['image/jpeg', 'image/png', 'image/webp'],
  role: ['super_admin', 'admin', 'officer', 'viewer'],
  userStatus: ['active', 'inactive'],
  assignmentStatus: ['active', 'completed', 'reassigned', 'cancelled'],
  announcementType: ['info', 'warning', 'emergency', 'maintenance'],
  settingType: ['string', 'number', 'boolean', 'json'],
  severity: ['info', 'warning', 'critical'],
  reviewStatus: ['pending', 'reviewed', 'hidden'],
  migrationStatus: ['success', 'failed', 'rolled_back'],
  exportStatus: ['success', 'failed', 'deleted']
});

var SETUP_SHEETS = Object.freeze([
  {
    name: 'reports',
    headers: ['report_id', 'tracking_code', 'request_id', 'category_id', 'title', 'description', 'incident_date', 'location_name', 'village_no', 'landmark', 'latitude', 'longitude', 'map_url', 'is_anonymous', 'reporter_name', 'reporter_phone', 'reporter_email', 'contact_method', 'reporter_consent', 'truth_confirmation', 'privacy_version', 'priority_reported', 'priority', 'status', 'assigned_to', 'target_due_at', 'source', 'public_result', 'internal_summary', 'resolved_at', 'closed_at', 'rejected_at', 'rejection_reason', 'duplicate_of_report_id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'is_deleted', 'deleted_at', 'deleted_by', 'version', 'search_text', 'year_month', 'village_key'],
    booleanColumns: ['is_anonymous', 'reporter_consent', 'truth_confirmation', 'is_deleted'],
    dropdowns: {
      contact_method: SETUP_ENUMS.contactMethod,
      priority_reported: SETUP_ENUMS.priority,
      priority: SETUP_ENUMS.priority,
      status: SETUP_ENUMS.reportStatus,
      source: SETUP_ENUMS.source
    },
    numberRules: { version: 0 }
  },
  {
    name: 'report_updates',
    headers: ['update_id', 'report_id', 'update_type', 'old_status', 'new_status', 'public_message', 'internal_note', 'is_public', 'updated_by', 'updated_by_name_snapshot', 'updated_by_role_snapshot', 'created_at', 'is_deleted', 'version'],
    booleanColumns: ['is_public', 'is_deleted'],
    dropdowns: {
      update_type: SETUP_ENUMS.updateType,
      old_status: SETUP_ENUMS.reportStatus,
      new_status: SETUP_ENUMS.reportStatus
    },
    numberRules: { version: 0 }
  },
  {
    name: 'attachments',
    headers: ['attachment_id', 'report_id', 'update_id', 'additional_info_id', 'file_id', 'file_name', 'original_file_name', 'mime_type', 'file_size', 'width', 'height', 'file_role', 'is_public', 'uploaded_by', 'created_at', 'drive_folder_id', 'checksum', 'is_deleted', 'deleted_at', 'version'],
    booleanColumns: ['is_public', 'is_deleted'],
    dropdowns: {
      mime_type: SETUP_ENUMS.mimeType,
      file_role: SETUP_ENUMS.fileRole
    },
    numberRules: { file_size: 0, width: 0, height: 0, version: 0 }
  },
  {
    name: 'categories',
    headers: ['category_id', 'code', 'name', 'description', 'icon', 'color', 'default_assignee', 'target_days', 'sort_order', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by', 'version'],
    booleanColumns: ['is_active'],
    numberRules: { target_days: 0, sort_order: 0, version: 0 }
  },
  {
    name: 'users',
    headers: ['user_id', 'username', 'password_hash', 'password_salt', 'password_version', 'display_name', 'email', 'phone', 'role', 'status', 'failed_login_count', 'locked_until', 'last_login_at', 'last_password_changed_at', 'must_change_password', 'created_at', 'updated_at', 'created_by', 'updated_by', 'is_deleted', 'version'],
    booleanColumns: ['must_change_password', 'is_deleted'],
    dropdowns: {
      role: SETUP_ENUMS.role,
      status: SETUP_ENUMS.userStatus
    },
    numberRules: { password_version: 1, failed_login_count: 0, version: 0 }
  },
  {
    name: 'sessions',
    headers: ['session_id', 'user_id', 'token_hash', 'expires_at', 'revoked_at', 'revoke_reason', 'created_at', 'last_used_at', 'user_agent_hint', 'device_key_hash', 'is_active', 'version'],
    booleanColumns: ['is_active'],
    numberRules: { version: 0 }
  },
  {
    name: 'assignments',
    headers: ['assignment_id', 'report_id', 'assigned_to', 'assigned_by', 'note', 'assigned_at', 'target_due_at', 'completed_at', 'unassigned_at', 'assignment_status', 'created_at', 'version'],
    dropdowns: {
      assignment_status: SETUP_ENUMS.assignmentStatus
    },
    numberRules: { version: 0 }
  },
  {
    name: 'announcements',
    headers: ['announcement_id', 'title', 'content', 'type', 'start_at', 'end_at', 'is_active', 'sort_order', 'created_by', 'updated_by', 'created_at', 'updated_at', 'is_deleted', 'version'],
    booleanColumns: ['is_active', 'is_deleted'],
    dropdowns: {
      type: SETUP_ENUMS.announcementType
    },
    numberRules: { sort_order: 0, version: 0 }
  },
  {
    name: 'settings',
    headers: ['key', 'value', 'type', 'description', 'is_public', 'group_name', 'updated_at', 'updated_by', 'version'],
    booleanColumns: ['is_public'],
    dropdowns: {
      type: SETUP_ENUMS.settingType
    },
    numberRules: { version: 0 }
  },
  {
    name: 'activity_logs',
    headers: ['log_id', 'user_id', 'user_name_snapshot', 'role_snapshot', 'action', 'entity_type', 'entity_id', 'detail', 'request_id', 'ip_hint', 'user_agent_hint', 'created_at', 'severity', 'success'],
    booleanColumns: ['success'],
    dropdowns: {
      severity: SETUP_ENUMS.severity
    }
  },
  {
    name: 'report_additional_info',
    headers: ['additional_info_id', 'report_id', 'message', 'contact_name', 'contact_phone', 'is_public', 'review_status', 'reviewed_by', 'reviewed_at', 'created_at', 'request_id', 'is_deleted', 'version'],
    booleanColumns: ['is_public', 'is_deleted'],
    dropdowns: {
      review_status: SETUP_ENUMS.reviewStatus
    },
    numberRules: { version: 0 }
  },
  {
    name: 'rate_limits',
    headers: ['rate_key', 'action', 'window_start', 'count', 'blocked_until', 'updated_at', 'expires_at'],
    numberRules: { count: 0 }
  },
  {
    name: 'dashboard_cache',
    headers: ['cache_key', 'scope', 'payload_json', 'generated_at', 'expires_at', 'source_version', 'is_valid'],
    booleanColumns: ['is_valid']
  },
  {
    name: 'schema_migrations',
    headers: ['migration_id', 'name', 'from_version', 'to_version', 'applied_at', 'applied_by', 'checksum', 'status', 'detail'],
    dropdowns: {
      status: SETUP_ENUMS.migrationStatus
    }
  },
  {
    name: 'system_counters',
    headers: ['counter_key', 'current_value', 'updated_at', 'version'],
    numberRules: { current_value: 0, version: 0 }
  },
  {
    name: 'export_logs',
    headers: ['export_id', 'user_id', 'export_type', 'filters_json', 'included_personal_data', 'row_count', 'file_id', 'created_at', 'expires_at', 'status'],
    booleanColumns: ['included_personal_data'],
    dropdowns: {
      status: SETUP_ENUMS.exportStatus
    },
    numberRules: { row_count: 0 }
  }
]);

var INITIAL_CATEGORIES = Object.freeze([
  { code: 'ROAD', name: 'ถนน ทางเท้า และสะพาน', target_days: 14, icon: 'road' },
  { code: 'LIGHT', name: 'ไฟฟ้าและไฟส่องสว่าง', target_days: 7, icon: 'lightbulb' },
  { code: 'WATER', name: 'น้ำประปาและแหล่งน้ำ', target_days: 7, icon: 'droplet' },
  { code: 'WASTE', name: 'ขยะและความสะอาด', target_days: 5, icon: 'trash' },
  { code: 'DRAIN', name: 'น้ำท่วมและทางระบายน้ำ', target_days: 7, icon: 'waves' },
  { code: 'ENV', name: 'สิ่งแวดล้อมและมลพิษ', target_days: 14, icon: 'leaf' },
  { code: 'SAFETY', name: 'ความปลอดภัยและเหตุเดือดร้อน', target_days: 3, icon: 'shield' },
  { code: 'ANIMAL', name: 'สัตว์จรจัดและสัตว์รบกวน', target_days: 7, icon: 'paw-print' },
  { code: 'PUBLIC', name: 'สาธารณสถานและทรัพย์สินส่วนรวม', target_days: 14, icon: 'landmark' },
  { code: 'OTHER', name: 'ข้อเสนอแนะและเรื่องอื่น ๆ', target_days: 14, icon: 'circle' }
]);

var INITIAL_PUBLIC_SETTINGS = Object.freeze([
  { key: 'app_name', value: 'Khaophang Report', type: 'string', is_public: true, description: 'ชื่อระบบภาษาอังกฤษ', group_name: 'general' },
  { key: 'app_name_th', value: 'ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง', type: 'string', is_public: true, description: 'ชื่อระบบภาษาไทย', group_name: 'general' },
  { key: 'contact_email', value: 'khaophangreport@gmail.com', type: 'string', is_public: true, description: 'อีเมลติดต่อโครงการ', group_name: 'contact' },
  { key: 'max_images', value: '3', type: 'number', is_public: true, description: 'จำนวนภาพสูงสุดต่อการแจ้ง', group_name: 'upload' },
  { key: 'max_image_size_mb', value: '1', type: 'number', is_public: true, description: 'ขนาดภาพสูงสุดหลังบีบอัดต่อภาพ', group_name: 'upload' },
  { key: 'max_image_dimension', value: '1600', type: 'number', is_public: true, description: 'ด้านยาวสูงสุดของภาพ', group_name: 'upload' },
  { key: 'default_page_size', value: '20', type: 'number', is_public: true, description: 'จำนวนรายการเริ่มต้นต่อหน้า', group_name: 'pagination' },
  { key: 'privacy_version', value: '1.0', type: 'string', is_public: true, description: 'เวอร์ชันนโยบายความเป็นส่วนตัว', group_name: 'privacy' },
  { key: 'maintenance_mode', value: 'false', type: 'boolean', is_public: true, description: 'สถานะปิดปรับปรุงระบบ', group_name: 'system' },
  { key: 'schema_version', value: SETUP_SCHEMA_VERSION, type: 'string', is_public: false, description: 'เวอร์ชันโครงสร้างข้อมูล', group_name: 'system' }
]);

function setupSystem() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var spreadsheet = SheetRepository.openOrCreateSpreadsheet();
    var sheetResults = setupSheets_(spreadsheet);
    var seedResults = seedInitialData_(spreadsheet);
    var driveResult = DriveRepository.ensureRootStructure(SETUP_DRIVE_FOLDERS);
    var validationResult = validateSetup();

    return {
      ok: validationResult.ok,
      spreadsheetId: spreadsheet.getId(),
      rootFolderId: driveResult.rootFolderId,
      sheets: sheetResults,
      seeds: seedResults,
      drive: driveResult,
      validation: validationResult
    };
  } finally {
    lock.releaseLock();
  }
}

function setupSheets_(spreadsheet) {
  return SETUP_SHEETS.map(function (schema) {
    var sheet = SheetRepository.setupSheet(spreadsheet, schema);

    return {
      name: schema.name,
      columns: schema.headers.length,
      sheetId: sheet.getSheetId()
    };
  });
}

function seedInitialData_(spreadsheet) {
  return {
    categories: seedCategories_(spreadsheet),
    settings: seedSettings_(spreadsheet),
    schemaMigrations: seedSchemaMigration_(spreadsheet)
  };
}

function seedCategories_(spreadsheet) {
  var schema = findSetupSchema_('categories');
  var sheet = SheetRepository.getSheet(spreadsheet, 'categories');
  var now = nowIso_();
  var items = INITIAL_CATEGORIES.map(function (category, index) {
    return {
      category_id: 'CAT-' + ('000' + (index + 1)).slice(-3),
      code: category.code,
      name: category.name,
      description: '',
      icon: category.icon,
      color: '#287444',
      default_assignee: '',
      target_days: category.target_days,
      sort_order: index + 1,
      is_active: true,
      created_at: now,
      updated_at: now,
      created_by: 'setup',
      updated_by: 'setup',
      version: 1
    };
  });

  return SheetRepository.seedRowsByKey(sheet, schema.headers, 'code', items);
}

function seedSettings_(spreadsheet) {
  var schema = findSetupSchema_('settings');
  var sheet = SheetRepository.getSheet(spreadsheet, 'settings');
  var now = nowIso_();
  var items = INITIAL_PUBLIC_SETTINGS.map(function (setting) {
    return {
      key: setting.key,
      value: setting.value,
      type: setting.type,
      description: setting.description,
      is_public: setting.is_public,
      group_name: setting.group_name,
      updated_at: now,
      updated_by: 'setup',
      version: 1
    };
  });

  return SheetRepository.seedRowsByKey(sheet, schema.headers, 'key', items);
}

function seedSchemaMigration_(spreadsheet) {
  var schema = findSetupSchema_('schema_migrations');
  var sheet = SheetRepository.getSheet(spreadsheet, 'schema_migrations');
  var migrationId = '20260626_001';
  var items = [{
    migration_id: migrationId,
    name: 'initial_schema_setup',
    from_version: '',
    to_version: SETUP_SCHEMA_VERSION,
    applied_at: nowIso_(),
    applied_by: 'setup',
    checksum: '',
    status: 'success',
    detail: 'Initial Google Sheets schema and Drive folders setup'
  }];

  return SheetRepository.seedRowsByKey(sheet, schema.headers, 'migration_id', items);
}

function validateSetup() {
  var result = {
    ok: true,
    spreadsheetId: getSpreadsheetId_(),
    rootFolderId: getRootFolderId_(),
    sheets: [],
    drive: {},
    issues: []
  };

  if (!result.spreadsheetId) {
    result.ok = false;
    result.issues.push('Missing SPREADSHEET_ID in Script Properties');
    return result;
  }

  var spreadsheet = SpreadsheetApp.openById(result.spreadsheetId);

  SETUP_SHEETS.forEach(function (schema) {
    var sheet = SheetRepository.getSheet(spreadsheet, schema.name);
    var sheetResult = {
      name: schema.name,
      ok: true,
      issues: []
    };

    if (!sheet) {
      sheetResult.ok = false;
      sheetResult.issues.push('Missing sheet');
    } else {
      var headers = SheetRepository.getHeaders(sheet).slice(0, schema.headers.length);

      if (!arraysEqual_(headers, schema.headers)) {
        sheetResult.ok = false;
        sheetResult.issues.push('Header mismatch');
      }

      if (sheet.getFrozenRows() < 1) {
        sheetResult.ok = false;
        sheetResult.issues.push('Header is not frozen');
      }

      if (!sheet.getFilter()) {
        sheetResult.ok = false;
        sheetResult.issues.push('Filter is missing');
      }
    }

    if (!sheetResult.ok) {
      result.ok = false;
      result.issues.push(schema.name + ': ' + sheetResult.issues.join(', '));
    }

    result.sheets.push(sheetResult);
  });

  result.drive = DriveRepository.validateRootStructure(SETUP_DRIVE_FOLDERS);

  if (!result.drive.ok) {
    result.ok = false;
    result.issues.push('Drive structure missing: ' + result.drive.missing.join(', '));
  }

  validateSeedData_(spreadsheet, result);

  return result;
}

function validateSeedData_(spreadsheet, result) {
  var categoriesSheet = SheetRepository.getSheet(spreadsheet, 'categories');
  var settingsSheet = SheetRepository.getSheet(spreadsheet, 'settings');

  if (!categoriesSheet || !settingsSheet) {
    result.ok = false;
    result.issues.push('Missing seed validation sheet');
    return;
  }

  var categoryMap = getExistingKeyMap_(categoriesSheet, 'code');
  var settingsMap = getExistingKeyMap_(settingsSheet, 'key');

  INITIAL_CATEGORIES.forEach(function (category) {
    if (!categoryMap[category.code]) {
      result.ok = false;
      result.issues.push('Missing category seed: ' + category.code);
    }
  });

  INITIAL_PUBLIC_SETTINGS.forEach(function (setting) {
    if (!settingsMap[setting.key]) {
      result.ok = false;
      result.issues.push('Missing setting seed: ' + setting.key);
    }
  });
}

function getExistingKeyMap_(sheet, keyColumnName) {
  var headerMap = SheetRepository.getHeaderMap(sheet);
  var keyColumnIndex = headerMap[keyColumnName];
  var values = SheetRepository.getDataRangeValues(sheet);
  var map = {};

  values.forEach(function (row) {
    var key = row[keyColumnIndex];
    if (key !== '') {
      map[String(key)] = true;
    }
  });

  return map;
}

function findSetupSchema_(sheetName) {
  for (var index = 0; index < SETUP_SHEETS.length; index += 1) {
    if (SETUP_SHEETS[index].name === sheetName) {
      return SETUP_SHEETS[index];
    }
  }

  throw new Error('Unknown setup schema: ' + sheetName);
}
