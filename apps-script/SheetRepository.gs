var SheetRepository = (function () {
  var HEADER_BACKGROUND = '#287444';
  var HEADER_FONT_COLOR = '#ffffff';
  var DEFAULT_COLUMN_WIDTH = 150;
  var LONG_COLUMN_WIDTH = 240;
  var BOOLEAN_ROWS = 999;

  function openOrCreateSpreadsheet() {
    var spreadsheetId = getSpreadsheetId_();
    var spreadsheet = spreadsheetId
      ? SpreadsheetApp.openById(spreadsheetId)
      : SpreadsheetApp.create(APP_PUBLIC_CONFIG.SPREADSHEET_NAME);

    if (!spreadsheetId) {
      setSpreadsheetId_(spreadsheet.getId());
    }

    return spreadsheet;
  }

  function openSpreadsheet() {
    var spreadsheetId = getSpreadsheetId_();
    assertCondition_(spreadsheetId, 'SETUP_REQUIRED', 'ยังไม่ได้ตั้งค่า Spreadsheet ID');
    return SpreadsheetApp.openById(spreadsheetId);
  }

  function getSheet(spreadsheet, sheetName) {
    assertCondition_(validateSheetName_(sheetName), 'VALIDATION_ERROR', 'ชื่อ Sheet ไม่ถูกต้อง');
    return spreadsheet.getSheetByName(sheetName);
  }

  function getSheetByName(sheetName) {
    return getSheet(openSpreadsheet(), sheetName);
  }

  function requireSheet(sheetName) {
    var sheet = getSheetByName(sheetName);
    assertCondition_(sheet, 'NOT_FOUND', 'ไม่พบ Sheet ที่ต้องการ', { sheetName: sheetName });
    return sheet;
  }

  function ensureSheet(spreadsheet, sheetName) {
    return getSheet(spreadsheet, sheetName) || spreadsheet.insertSheet(sheetName);
  }

  function getHeaders(sheet) {
    var lastColumn = sheet.getLastColumn();

    if (lastColumn === 0) {
      return [];
    }

    return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
      return String(value || '');
    });
  }

  function getHeaderMap(sheet) {
    var headers = getHeaders(sheet);
    var map = {};

    headers.forEach(function (header, index) {
      if (header) {
        map[header] = index;
      }
    });

    return map;
  }

  function requireColumn(headers, columnName) {
    var columnIndex = indexOfHeader_(headers, columnName);
    assertCondition_(columnIndex >= 0, 'VALIDATION_ERROR', 'ไม่พบ Column ที่ต้องการ', {
      columnName: columnName
    });
    return columnIndex;
  }

  function resolveIdColumn(headers, options) {
    if (options && options.idColumn) {
      requireColumn(headers, options.idColumn);
      return options.idColumn;
    }

    var candidates = [
      'report_id',
      'update_id',
      'attachment_id',
      'category_id',
      'user_id',
      'session_id',
      'assignment_id',
      'announcement_id',
      'additional_info_id',
      'log_id',
      'migration_id',
      'export_id',
      'key',
      'rate_key',
      'cache_key',
      'counter_key'
    ];

    for (var index = 0; index < candidates.length; index += 1) {
      if (indexOfHeader_(headers, candidates[index]) >= 0) {
        return candidates[index];
      }
    }

    throw createAppError_('VALIDATION_ERROR', 'ไม่พบ Primary Key Column');
  }

  function rowToObject(row, headers) {
    var item = {};

    headers.forEach(function (header, index) {
      if (header) {
        item[header] = row[index] !== undefined ? row[index] : '';
      }
    });

    return item;
  }

  function objectToRow(item, headers) {
    return headers.map(function (header) {
      return item[header] !== undefined ? item[header] : '';
    });
  }

  function isDeletedValue(value) {
    return value === true || String(value).toUpperCase() === 'TRUE';
  }

  function includeRowByDeletedState(item, headers, options) {
    if (options && options.includeDeleted) {
      return true;
    }

    if (indexOfHeader_(headers, 'is_deleted') < 0) {
      return true;
    }

    return !isDeletedValue(item.is_deleted);
  }

  function itemMatchesFilters(item, filters) {
    var keys = Object.keys(filters || {});

    for (var index = 0; index < keys.length; index += 1) {
      var key = keys[index];
      var expected = filters[key];

      if (expected === '' || expected === undefined || expected === null) {
        continue;
      }

      if (String(item[key]) !== String(expected)) {
        return false;
      }
    }

    return true;
  }

  function sortItems(items, headers, options) {
    if (!options || !options.sortBy) {
      return items;
    }

    assertCondition_(validateAllowedColumn_(options.sortBy, headers), 'VALIDATION_ERROR', 'Sort column ไม่ถูกต้อง');
    var direction = options.sortDirection === 'asc' ? 1 : -1;

    return items.sort(function (left, right) {
      if (left[options.sortBy] === right[options.sortBy]) {
        return 0;
      }

      return left[options.sortBy] > right[options.sortBy] ? direction : -direction;
    });
  }

  function paginateItems(items, options) {
    var pageOptions = normalizePageOptions_(options || {});
    var total = items.length;
    var totalPages = Math.max(Math.ceil(total / pageOptions.pageSize), 1);
    var page = Math.min(pageOptions.page, totalPages);
    var start = (page - 1) * pageOptions.pageSize;

    return {
      items: items.slice(start, start + pageOptions.pageSize),
      pagination: {
        page: page,
        pageSize: pageOptions.pageSize,
        total: total,
        totalPages: totalPages
      }
    };
  }

  function getDataRangeValues(sheet) {
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();

    if (lastRow < 2 || lastColumn < 1) {
      return [];
    }

    return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  }

  function readRows(sheet) {
    var headers = getHeaders(sheet);
    var values = getDataRangeValues(sheet);

    return values.map(function (row, index) {
      return {
        rowNumber: index + 2,
        object: rowToObject(row, headers),
        values: row
      };
    });
  }

  function list(sheetName, options) {
    var sheet = requireSheet(sheetName);
    var headers = getHeaders(sheet);
    var rows = readRows(sheet);
    var items = rows.map(function (entry) {
      return entry.object;
    }).filter(function (item) {
      return includeRowByDeletedState(item, headers, options);
    }).filter(function (item) {
      return itemMatchesFilters(item, options && options.filters);
    });

    if (options && typeof options.predicate === 'function') {
      items = items.filter(options.predicate);
    }

    items = sortItems(items, headers, options || {});

    if (options && options.paginate === false) {
      return {
        items: items,
        pagination: {
          page: 1,
          pageSize: items.length,
          total: items.length,
          totalPages: 1
        }
      };
    }

    return paginateItems(items, options || {});
  }

  function findEntry(sheetName, matcher, options) {
    var sheet = requireSheet(sheetName);
    var headers = getHeaders(sheet);
    var rows = readRows(sheet);

    for (var index = 0; index < rows.length; index += 1) {
      var item = rows[index].object;

      if (!includeRowByDeletedState(item, headers, options)) {
        continue;
      }

      if (matcher(item)) {
        rows[index].headers = headers;
        rows[index].sheet = sheet;
        return rows[index];
      }
    }

    return null;
  }

  function findById(sheetName, id, options) {
    var sheet = requireSheet(sheetName);
    var headers = getHeaders(sheet);
    var idColumn = resolveIdColumn(headers, options || {});
    var entry = findEntry(sheetName, function (item) {
      return String(item[idColumn]) === String(id);
    }, options || {});

    return entry ? entry.object : null;
  }

  function findOne(sheetName, criteria, options) {
    var entry = findEntry(sheetName, function (item) {
      return itemMatchesFilters(item, criteria || {});
    }, options || {});

    return entry ? entry.object : null;
  }

  function append(sheetName, item, options) {
    var sheet = requireSheet(sheetName);
    var headers = getHeaders(sheet);
    var idColumn = resolveIdColumn(headers, options || {});
    var now = nowIso_();
    var nextItem = compactObject_(item || {});

    if (!nextItem[idColumn] && !(options && options.skipIdGeneration)) {
      nextItem[idColumn] = createUuid_();
    }

    if (indexOfHeader_(headers, 'created_at') >= 0 && !nextItem.created_at) {
      nextItem.created_at = now;
    }

    if (indexOfHeader_(headers, 'updated_at') >= 0 && !nextItem.updated_at) {
      nextItem.updated_at = now;
    }

    if (indexOfHeader_(headers, 'version') >= 0 && !nextItem.version) {
      nextItem.version = 1;
    }

    if (indexOfHeader_(headers, 'is_deleted') >= 0 && nextItem.is_deleted === undefined) {
      nextItem.is_deleted = false;
    }

    appendRows(sheet, [objectToRow(nextItem, headers)]);

    return nextItem;
  }

  function updateById(sheetName, id, changes, options) {
    var sheet = requireSheet(sheetName);
    var headers = getHeaders(sheet);
    var idColumn = resolveIdColumn(headers, options || {});
    var rows = readRows(sheet);
    var entry = null;

    for (var index = 0; index < rows.length; index += 1) {
      var item = rows[index].object;

      if (String(item[idColumn]) === String(id)) {
        rows[index].headers = headers;
        rows[index].sheet = sheet;
        entry = rows[index];
        break;
      }
    }

    if (!entry) {
      throw createAppError_('NOT_FOUND', 'ไม่พบข้อมูลที่ต้องการแก้ไข');
    }

    if (!options || !options.includeDeleted) {
      assertCondition_(includeRowByDeletedState(entry.object, headers, options || {}), 'NOT_FOUND', 'ไม่พบข้อมูลที่ต้องการแก้ไข');
    }

    return updateEntry(entry.sheet, entry.headers, entry.rowNumber, entry.object, id, changes || {}, options || {});
  }

  function updateEntry(sheet, headers, rowNumber, currentItem, id, changes, options) {
    var idColumn = resolveIdColumn(headers, options || {});
    var currentVersion = Number(currentItem.version || 0);
    var expectedVersion = options.expectedVersion;

    if (expectedVersion === undefined && changes.version !== undefined) {
      expectedVersion = changes.version;
    }

    if (expectedVersion !== undefined && Number(expectedVersion) !== currentVersion) {
      throw createAppError_('VERSION_CONFLICT', 'ข้อมูลนี้ถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดข้อมูลใหม่', {
        expectedVersion: expectedVersion,
        currentVersion: currentVersion
      });
    }

    var nextItem = {};
    Object.keys(currentItem).forEach(function (key) {
      nextItem[key] = currentItem[key];
    });

    Object.keys(changes || {}).forEach(function (key) {
      if (key === idColumn) {
        return;
      }

      assertCondition_(validateAllowedColumn_(key, headers), 'VALIDATION_ERROR', 'Column ที่ต้องการแก้ไขไม่ถูกต้อง', {
        columnName: key
      });
      nextItem[key] = changes[key];
    });

    if (indexOfHeader_(headers, 'updated_at') >= 0) {
      nextItem.updated_at = options.updatedAt || nowIso_();
    }

    if (indexOfHeader_(headers, 'updated_by') >= 0 && options.updatedBy !== undefined) {
      nextItem.updated_by = options.updatedBy;
    }

    if (indexOfHeader_(headers, 'version') >= 0) {
      nextItem.version = currentVersion + 1;
    }

    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([objectToRow(nextItem, headers)]);
    return nextItem;
  }

  function softDeleteById(sheetName, id, options) {
    var sheet = requireSheet(sheetName);
    var headers = getHeaders(sheet);

    requireColumn(headers, 'is_deleted');

    var idColumn = resolveIdColumn(headers, options || {});
    var entry = findEntry(sheetName, function (item) {
      return String(item[idColumn]) === String(id);
    }, Object.assign({}, options || {}, { includeDeleted: true }));

    if (!entry) {
      throw createAppError_('NOT_FOUND', 'ไม่พบข้อมูลที่ต้องการลบ');
    }

    var changes = {
      is_deleted: true
    };

    if (indexOfHeader_(headers, 'deleted_at') >= 0) {
      changes.deleted_at = nowIso_();
    }

    if (indexOfHeader_(headers, 'deleted_by') >= 0 && options && options.deletedBy !== undefined) {
      changes.deleted_by = options.deletedBy;
    }

    return updateEntry(sheet, headers, entry.rowNumber, entry.object, id, changes, options || {});
  }

  function batchRead(requests) {
    return (requests || []).map(function (request) {
      return list(request.sheetName, request.options || {});
    });
  }

  function batchAppend(sheetName, items, options) {
    return (items || []).map(function (item) {
      return append(sheetName, item, options || {});
    });
  }

  function batchUpdateById(sheetName, updates, options) {
    return (updates || []).map(function (update) {
      return updateById(sheetName, update.id, update.changes || {}, Object.assign({}, options || {}, update.options || {}));
    });
  }

  function ensureColumnCount(sheet, count) {
    var maxColumns = sheet.getMaxColumns();

    if (maxColumns < count) {
      sheet.insertColumnsAfter(maxColumns, count - maxColumns);
    }
  }

  function ensureRowCount(sheet, count) {
    var maxRows = sheet.getMaxRows();

    if (maxRows < count) {
      sheet.insertRowsAfter(maxRows, count - maxRows);
    }
  }

  function setHeaders(sheet, headers) {
    ensureColumnCount(sheet, headers.length);
    ensureRowCount(sheet, 2);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  function formatHeader(sheet, headers) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setFontColor(HEADER_FONT_COLOR)
      .setBackground(HEADER_BACKGROUND);
  }

  function ensureFilter(sheet, headers) {
    var existingFilter = sheet.getFilter();

    if (!existingFilter) {
      sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), headers.length).createFilter();
    }
  }

  function applyColumnWidths(sheet, headers) {
    headers.forEach(function (header, index) {
      var width = /description|message|detail|summary|note|content|payload|json|result|reason|search_text/.test(header)
        ? LONG_COLUMN_WIDTH
        : DEFAULT_COLUMN_WIDTH;
      sheet.setColumnWidth(index + 1, width);
    });
  }

  function applyCheckboxes(sheet, headers, booleanColumns) {
    (booleanColumns || []).forEach(function (columnName) {
      var columnIndex = indexOfHeader_(headers, columnName);

      if (columnIndex >= 0) {
        sheet.getRange(2, columnIndex + 1, BOOLEAN_ROWS).insertCheckboxes();
      }
    });
  }

  function applyDropdowns(sheet, headers, dropdowns) {
    Object.keys(dropdowns || {}).forEach(function (columnName) {
      var columnIndex = indexOfHeader_(headers, columnName);

      if (columnIndex >= 0) {
        var rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(dropdowns[columnName], true)
          .setAllowInvalid(false)
          .build();
        sheet.getRange(2, columnIndex + 1, BOOLEAN_ROWS).setDataValidation(rule);
      }
    });
  }

  function applyNumberRules(sheet, headers, numberRules) {
    Object.keys(numberRules || {}).forEach(function (columnName) {
      var columnIndex = indexOfHeader_(headers, columnName);

      if (columnIndex >= 0) {
        var rule = SpreadsheetApp.newDataValidation()
          .requireNumberGreaterThanOrEqualTo(numberRules[columnName])
          .setAllowInvalid(false)
          .build();
        sheet.getRange(2, columnIndex + 1, BOOLEAN_ROWS).setDataValidation(rule);
      }
    });
  }

  function applyFormats(sheet, headers) {
    headers.forEach(function (header, index) {
      var range = sheet.getRange(2, index + 1, BOOLEAN_ROWS);

      if (/_at$|_date$|window_start|expires_at/.test(header)) {
        range.setNumberFormat('yyyy-mm-dd hh:mm:ss');
      } else if (/count|version|sort_order|target_days|file_size|width|height|current_value|row_count/.test(header)) {
        range.setNumberFormat('0');
      }
    });
  }

  function setupSheet(spreadsheet, schema) {
    var sheet = ensureSheet(spreadsheet, schema.name);

    setHeaders(sheet, schema.headers);
    formatHeader(sheet, schema.headers);
    ensureFilter(sheet, schema.headers);
    applyColumnWidths(sheet, schema.headers);
    applyFormats(sheet, schema.headers);
    applyCheckboxes(sheet, schema.headers, schema.booleanColumns);
    applyDropdowns(sheet, schema.headers, schema.dropdowns);
    applyNumberRules(sheet, schema.headers, schema.numberRules);

    return sheet;
  }

  function appendRows(sheet, rows) {
    if (!rows || rows.length === 0) {
      return;
    }

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  function seedRowsByKey(sheet, headers, keyColumnName, items) {
    var headerMap = getHeaderMap(sheet);
    var keyColumnIndex = headerMap[keyColumnName];
    var existingKeys = {};
    var existingRows = getDataRangeValues(sheet);
    var rowsToAppend = [];

    existingRows.forEach(function (row) {
      var key = row[keyColumnIndex];
      if (key !== '') {
        existingKeys[String(key)] = true;
      }
    });

    items.forEach(function (item) {
      var key = item[keyColumnName];

      if (!existingKeys[String(key)]) {
        rowsToAppend.push(objectToRow(item, headers));
      }
    });

    appendRows(sheet, rowsToAppend);
    return rowsToAppend.length;
  }

  function createTestHelper() {
    return {
      objectToRow: objectToRow,
      paginateItems: paginateItems,
      resolveIdColumn: resolveIdColumn,
      rowToObject: rowToObject
    };
  }

  return {
    append: append,
    appendRows: appendRows,
    batchAppend: batchAppend,
    batchRead: batchRead,
    batchUpdateById: batchUpdateById,
    createTestHelper: createTestHelper,
    findById: findById,
    findOne: findOne,
    getDataRangeValues: getDataRangeValues,
    getHeaderMap: getHeaderMap,
    getHeaders: getHeaders,
    getSheet: getSheet,
    getSheetByName: getSheetByName,
    list: list,
    objectToRow: objectToRow,
    openOrCreateSpreadsheet: openOrCreateSpreadsheet,
    openSpreadsheet: openSpreadsheet,
    paginateItems: paginateItems,
    requireSheet: requireSheet,
    rowToObject: rowToObject,
    seedRowsByKey: seedRowsByKey,
    setupSheet: setupSheet,
    softDeleteById: softDeleteById,
    updateById: updateById
  };
})();
