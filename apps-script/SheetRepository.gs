function SheetRepository_getOrCreateSpreadsheet_() {
  const spreadsheetId = Config_getSpreadsheetId_();

  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  const spreadsheet = SpreadsheetApp.create("Khaophang Report Database");
  Config_setSpreadsheetId_(spreadsheet.getId());
  return spreadsheet;
}

function SheetRepository_getSpreadsheet_() {
  const spreadsheetId = Config_getSpreadsheetId_();
  if (!spreadsheetId) {
    throw ApiError_("INTERNAL_ERROR", "ยังไม่ได้ตั้งค่า Spreadsheet ID");
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function SheetRepository_getOrCreateSheet_(spreadsheet, sheetName) {
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function SheetRepository_applyHeader_(sheet, headers) {
  const columnCount = headers.length;

  if (sheet.getMaxColumns() < columnCount) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), columnCount - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, sheet.getMaxColumns()).clearContent();
  sheet.getRange(1, 1, 1, columnCount).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight("bold")
    .setBackground("#E7F3EA")
    .setFontColor("#174A2B");

  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }

  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), columnCount).createFilter();
}

function SheetRepository_applyColumnWidths_(sheet, headers, widthMap) {
  headers.forEach(function (header, index) {
    sheet.setColumnWidth(index + 1, widthMap && widthMap[header] ? widthMap[header] : 150);
  });
}

function SheetRepository_getHeaderMap_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    return {};
  }

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const headerMap = {};

  headers.forEach(function (header, index) {
    if (header) {
      headerMap[String(header)] = index + 1;
    }
  });

  return headerMap;
}

function SheetRepository_findRowByKey_(sheet, keyColumnName, keyValue) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const keyColumn = headerMap[keyColumnName];

  if (!keyColumn || sheet.getLastRow() < 2) {
    return 0;
  }

  const values = sheet.getRange(2, keyColumn, sheet.getLastRow() - 1, 1).getValues();
  const normalizedKey = String(keyValue);

  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === normalizedKey) {
      return index + 2;
    }
  }

  return 0;
}

function findFirstEmptyDataRow_(sheet, keyColumnName) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const keyColumn = headerMap[keyColumnName];

  if (!keyColumn) {
    throw new Error("Missing key column: " + keyColumnName + " in sheet " + sheet.getName());
  }

  const rowCount = Math.max(sheet.getLastRow() - 1, 1);
  const values = sheet.getRange(2, keyColumn, rowCount, 1).getValues();

  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0] || "") === "") {
      return index + 2;
    }
  }

  return rowCount + 2;
}

function SheetRepository_upsertByKey_(sheet, keyColumnName, rowObject) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const headers = Object.keys(headerMap).sort(function (a, b) {
    return headerMap[a] - headerMap[b];
  });
  const row = headers.map(function (header) {
    return rowObject[header] === undefined ? "" : rowObject[header];
  });
  const rowIndex = SheetRepository_findRowByKey_(sheet, keyColumnName, rowObject[keyColumnName]);

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
    return "updated";
  }

  sheet.getRange(findFirstEmptyDataRow_(sheet, keyColumnName), 1, 1, headers.length).setValues([row]);
  return "created";
}

function SheetRepository_insertCheckboxes_(sheet, headers, columnNames, keyColumnName) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);

  if (!keyColumnName || !headerMap[keyColumnName] || sheet.getLastRow() < 2) {
    return;
  }

  const keyValues = sheet.getRange(2, headerMap[keyColumnName], sheet.getLastRow() - 1, 1).getValues();

  columnNames.forEach(function (columnName) {
    if (!headerMap[columnName]) {
      return;
    }

    keyValues.forEach(function (row, index) {
      if (String(row[0] || "") !== "") {
        sheet.getRange(index + 2, headerMap[columnName], 1, 1).insertCheckboxes();
      }
    });
  });
}

function SheetRepository_applyListValidation_(sheet, columnName, values) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  if (!headerMap[columnName]) {
    return;
  }

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, headerMap[columnName], Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function SheetRepository_applyNumberValidation_(sheet, columnName, minValue) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  if (!headerMap[columnName]) {
    return;
  }

  const rule = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(minValue)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, headerMap[columnName], Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function SheetRepository_getSheet_(sheetName) {
  const spreadsheet = SheetRepository_getSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw ApiError_("NOT_FOUND", "ไม่พบ Sheet: " + sheetName);
  }

  return sheet;
}

function SheetRepository_getHeaders_(sheet) {
  const headerMap = SheetRepository_getHeaderMap_(sheet);

  return Object.keys(headerMap).sort(function (a, b) {
    return headerMap[a] - headerMap[b];
  });
}

function SheetRepository_requireColumn_(headerMap, columnName, sheetName) {
  if (!headerMap[columnName]) {
    throw ApiError_("INTERNAL_ERROR", "ไม่พบคอลัมน์ " + columnName + " ใน Sheet " + sheetName);
  }

  return headerMap[columnName];
}

function SheetRepository_rowToObject_(headers, row) {
  const item = {};

  headers.forEach(function (header, index) {
    item[header] = row[index] === undefined || row[index] === null ? "" : row[index];
  });

  return item;
}

function SheetRepository_objectToRow_(headers, rowObject, existingObject) {
  const sourceObject = existingObject || {};

  return headers.map(function (header) {
    if (rowObject[header] !== undefined) {
      return rowObject[header];
    }

    return sourceObject[header] === undefined ? "" : sourceObject[header];
  });
}

function SheetRepository_isDeleted_(item) {
  return item && item.is_deleted !== undefined && Utils_toBoolean_(item.is_deleted);
}

function SheetRepository_isEmptyPhysicalRow_(row, keyColumnIndex) {
  if (keyColumnIndex !== undefined && keyColumnIndex > -1) {
    return String(row[keyColumnIndex] || "") === "";
  }

  return !row.some(function (cell) {
    return cell !== "" && cell !== null && cell !== false;
  });
}

function SheetRepository_readRows_(sheetName, options) {
  const safeOptions = options || {};
  const sheet = SheetRepository_getSheet_(sheetName);
  const headers = SheetRepository_getHeaders_(sheet);
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const keyColumnName = safeOptions.keyColumnName || safeOptions.idColumnName || "";
  const keyColumnIndex = keyColumnName && headerMap[keyColumnName] ? headerMap[keyColumnName] - 1 : undefined;
  const lastRow = sheet.getLastRow();

  if (lastRow < 2 || headers.length === 0) {
    return {
      sheet: sheet,
      headers: headers,
      headerMap: headerMap,
      rows: []
    };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const rows = [];

  values.forEach(function (row, index) {
    if (SheetRepository_isEmptyPhysicalRow_(row, keyColumnIndex)) {
      return;
    }

    const item = SheetRepository_rowToObject_(headers, row);

    if (!safeOptions.includeDeleted && SheetRepository_isDeleted_(item)) {
      return;
    }

    rows.push({
      rowNumber: index + 2,
      values: row,
      object: item
    });
  });

  return {
    sheet: sheet,
    headers: headers,
    headerMap: headerMap,
    rows: rows
  };
}

function SheetRepository_findById_(sheetName, idColumnName, idValue, options) {
  const safeOptions = options || {};
  const readResult = SheetRepository_readRows_(sheetName, {
    keyColumnName: idColumnName,
    includeDeleted: safeOptions.includeDeleted
  });

  SheetRepository_requireColumn_(readResult.headerMap, idColumnName, sheetName);

  const normalizedId = String(idValue || "");
  const match = readResult.rows.filter(function (entry) {
    return String(entry.object[idColumnName] || "") === normalizedId;
  })[0];

  return match ? match.object : null;
}

function SheetRepository_findOne_(sheetName, filters, options) {
  const safeOptions = options || {};
  const items = SheetRepository_list_(sheetName, {
    filters: filters || {},
    includeDeleted: safeOptions.includeDeleted,
    keyColumnName: safeOptions.keyColumnName,
    page: 1,
    pageSize: 1
  }).items;

  return items.length > 0 ? items[0] : null;
}

function SheetRepository_list_(sheetName, options) {
  const safeOptions = options || {};
  const readResult = SheetRepository_readRows_(sheetName, safeOptions);
  let items = readResult.rows.map(function (entry) {
    return entry.object;
  });

  items = SheetRepository_applyFilters_(items, safeOptions.filters || {});
  items = SheetRepository_applySort_(items, safeOptions.sortBy, safeOptions.sortDirection);

  const pagination = SheetRepository_paginate_(items, safeOptions.page, safeOptions.pageSize);

  return {
    items: pagination.items,
    pagination: pagination.pagination
  };
}

function SheetRepository_applyFilters_(items, filters) {
  const filterKeys = Object.keys(filters || {}).filter(function (key) {
    return filters[key] !== undefined && filters[key] !== null && filters[key] !== "";
  });

  if (filterKeys.length === 0) {
    return items;
  }

  return items.filter(function (item) {
    return filterKeys.every(function (key) {
      return String(item[key] || "") === String(filters[key]);
    });
  });
}

function SheetRepository_applySort_(items, sortBy, sortDirection) {
  if (!sortBy) {
    return items;
  }

  const direction = String(sortDirection || "asc").toLowerCase() === "desc" ? -1 : 1;
  const sortedItems = items.slice();

  sortedItems.sort(function (a, b) {
    const left = a[sortBy] === undefined || a[sortBy] === null ? "" : a[sortBy];
    const right = b[sortBy] === undefined || b[sortBy] === null ? "" : b[sortBy];

    if (left === right) {
      return 0;
    }

    return left > right ? direction : -direction;
  });

  return sortedItems;
}

function SheetRepository_paginate_(items, page, pageSize) {
  const safePage = Utils_clampInteger_(page, 1, 1, 1000000);
  const safePageSize = Utils_clampInteger_(pageSize, 20, 1, 100);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / safePageSize), 1);
  const currentPage = Math.min(safePage, totalPages);
  const startIndex = (currentPage - 1) * safePageSize;

  return {
    items: items.slice(startIndex, startIndex + safePageSize),
    pagination: {
      page: currentPage,
      pageSize: safePageSize,
      total: total,
      totalPages: totalPages
    }
  };
}

function SheetRepository_prepareWriteObject_(headers, rowObject, existingObject, userId) {
  const now = Utils_nowIso_();
  const preparedObject = Object.assign({}, existingObject || {}, rowObject || {});

  if (headers.indexOf("created_at") !== -1 && !preparedObject.created_at) {
    preparedObject.created_at = now;
  }

  if (headers.indexOf("updated_at") !== -1) {
    preparedObject.updated_at = now;
  }

  if (headers.indexOf("created_by") !== -1 && !preparedObject.created_by) {
    preparedObject.created_by = userId || "system";
  }

  if (headers.indexOf("updated_by") !== -1) {
    preparedObject.updated_by = userId || preparedObject.updated_by || "system";
  }

  if (headers.indexOf("version") !== -1 && !preparedObject.version) {
    preparedObject.version = 1;
  }

  return preparedObject;
}

function SheetRepository_append_(sheetName, rowObject, options) {
  const safeOptions = options || {};
  const sheet = SheetRepository_getSheet_(sheetName);
  const headers = SheetRepository_getHeaders_(sheet);
  const preparedObject = SheetRepository_prepareWriteObject_(headers, rowObject, null, safeOptions.userId);
  const row = SheetRepository_objectToRow_(headers, preparedObject);
  const targetRow = safeOptions.keyColumnName ?
    findFirstEmptyDataRow_(sheet, safeOptions.keyColumnName) :
    Math.max(sheet.getLastRow() + 1, 2);

  sheet.getRange(targetRow, 1, 1, headers.length).setValues([row]);

  return preparedObject;
}

function SheetRepository_updateById_(sheetName, idColumnName, idValue, updates, options) {
  const safeOptions = options || {};
  const readResult = SheetRepository_readRows_(sheetName, {
    keyColumnName: idColumnName,
    includeDeleted: safeOptions.includeDeleted
  });
  const sheet = readResult.sheet;
  const headers = readResult.headers;

  SheetRepository_requireColumn_(readResult.headerMap, idColumnName, sheetName);

  const entry = readResult.rows.filter(function (candidate) {
    return String(candidate.object[idColumnName] || "") === String(idValue || "");
  })[0];

  if (!entry) {
    throw ApiError_("NOT_FOUND", "ไม่พบข้อมูลที่ต้องการแก้ไข");
  }

  const expectedVersion = safeOptions.expectedVersion !== undefined ? safeOptions.expectedVersion : updates && updates.version;
  SheetRepository_assertVersion_(entry.object.version, expectedVersion);

  const nextObject = SheetRepository_prepareWriteObject_(headers, updates, entry.object, safeOptions.userId);
  nextObject[idColumnName] = entry.object[idColumnName];

  if (headers.indexOf("version") !== -1) {
    nextObject.version = Number(entry.object.version || 0) + 1;
  }

  sheet.getRange(entry.rowNumber, 1, 1, headers.length).setValues([
    SheetRepository_objectToRow_(headers, nextObject)
  ]);

  return nextObject;
}

function SheetRepository_softDeleteById_(sheetName, idColumnName, idValue, options) {
  const safeOptions = options || {};
  const sheet = SheetRepository_getSheet_(sheetName);
  const headerMap = SheetRepository_getHeaderMap_(sheet);

  SheetRepository_requireColumn_(headerMap, "is_deleted", sheetName);

  const updates = {
    is_deleted: true
  };

  if (headerMap.deleted_at) {
    updates.deleted_at = Utils_nowIso_();
  }

  if (headerMap.deleted_by) {
    updates.deleted_by = safeOptions.userId || "system";
  }

  return SheetRepository_updateById_(sheetName, idColumnName, idValue, updates, safeOptions);
}

function SheetRepository_assertVersion_(currentVersion, expectedVersion) {
  if (expectedVersion === undefined || expectedVersion === null || expectedVersion === "") {
    return;
  }

  if (Number(currentVersion || 0) !== Number(expectedVersion)) {
    throw ApiError_("VERSION_CONFLICT", "ข้อมูลนี้ถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดข้อมูลใหม่");
  }
}

function SheetRepository_batchRead_(sheetName, options) {
  const readResult = SheetRepository_readRows_(sheetName, options || {});

  return {
    headers: readResult.headers,
    rows: readResult.rows.map(function (entry) {
      return entry.values;
    }),
    objects: readResult.rows.map(function (entry) {
      return entry.object;
    })
  };
}

function SheetRepository_selectColumns_(sheetName, columnNames, options) {
  const safeOptions = options || {};
  const sheet = SheetRepository_getSheet_(sheetName);
  const headerMap = SheetRepository_getHeaderMap_(sheet);
  const keyColumnName = safeOptions.keyColumnName || safeOptions.idColumnName || "";
  const requestedColumns = SheetRepository_uniqueColumns_(columnNames || []);
  const selectedColumns = SheetRepository_uniqueColumns_(
    (keyColumnName ? [keyColumnName] : []).concat(requestedColumns)
  );
  const lastRow = sheet.getLastRow();

  selectedColumns.forEach(function (columnName) {
    SheetRepository_requireColumn_(headerMap, columnName, sheetName);
  });

  if (lastRow < 2 || selectedColumns.length === 0) {
    return {
      headers: selectedColumns,
      objects: [],
      rowCount: 0
    };
  }

  const rowCount = lastRow - 1;
  const columnValues = {};

  selectedColumns.forEach(function (columnName) {
    columnValues[columnName] = sheet.getRange(2, headerMap[columnName], rowCount, 1).getValues();
  });

  const objects = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    if (keyColumnName && String(columnValues[keyColumnName][rowIndex][0] || "") === "") {
      continue;
    }

    const item = {};

    selectedColumns.forEach(function (columnName) {
      const value = columnValues[columnName][rowIndex][0];
      item[columnName] = value === undefined || value === null ? "" : value;
    });

    if (!safeOptions.includeDeleted && SheetRepository_isDeleted_(item)) {
      continue;
    }

    objects.push(item);
  }

  return {
    headers: selectedColumns,
    objects: objects,
    rowCount: objects.length
  };
}

function SheetRepository_uniqueColumns_(columnNames) {
  const seen = {};
  const output = [];

  (columnNames || []).forEach(function (columnName) {
    const normalizedColumnName = String(columnName || "");

    if (!normalizedColumnName || seen[normalizedColumnName]) {
      return;
    }

    seen[normalizedColumnName] = true;
    output.push(normalizedColumnName);
  });

  return output;
}

function SheetRepository_batchWrite_(sheetName, rowObjects, options) {
  const safeOptions = options || {};
  const sheet = SheetRepository_getSheet_(sheetName);
  const headers = SheetRepository_getHeaders_(sheet);
  const objects = (rowObjects || []).map(function (rowObject) {
    return SheetRepository_prepareWriteObject_(headers, rowObject, null, safeOptions.userId);
  });

  if (objects.length === 0) {
    return {
      insertedCount: 0,
      items: []
    };
  }

  const rows = objects.map(function (rowObject) {
    return SheetRepository_objectToRow_(headers, rowObject);
  });
  const startRow = safeOptions.keyColumnName ?
    findFirstEmptyDataRow_(sheet, safeOptions.keyColumnName) :
    Math.max(sheet.getLastRow() + 1, 2);

  sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);

  return {
    insertedCount: objects.length,
    items: objects
  };
}

function testRepositoryLayerInterfaces() {
  const page = SheetRepository_paginate_([{ id: 1 }, { id: 2 }, { id: 3 }], 1, 2);
  const requiredFunctions = [
    { name: "SheetRepository_findById_", value: SheetRepository_findById_ },
    { name: "SheetRepository_findOne_", value: SheetRepository_findOne_ },
    { name: "SheetRepository_list_", value: SheetRepository_list_ },
    { name: "SheetRepository_append_", value: SheetRepository_append_ },
    { name: "SheetRepository_updateById_", value: SheetRepository_updateById_ },
    { name: "SheetRepository_softDeleteById_", value: SheetRepository_softDeleteById_ },
    { name: "SheetRepository_batchRead_", value: SheetRepository_batchRead_ },
    { name: "SheetRepository_batchWrite_", value: SheetRepository_batchWrite_ },
    { name: "DriveRepository_getOrCreateReportFolder_", value: DriveRepository_getOrCreateReportFolder_ },
    { name: "DriveRepository_saveFile_", value: DriveRepository_saveFile_ },
    { name: "DriveRepository_moveTempFile_", value: DriveRepository_moveTempFile_ }
  ];
  const missingFunctions = requiredFunctions.filter(function (entry) {
    return typeof entry.value !== "function";
  }).map(function (entry) {
    return entry.name;
  });

  if (missingFunctions.length > 0) {
    throw new Error("Missing repository functions: " + missingFunctions.join(", "));
  }

  if (page.items.length !== 2 || page.pagination.total !== 3) {
    throw new Error("SheetRepository_paginate_ returned invalid result");
  }

  return {
    ok: true,
    checkedFunctions: requiredFunctions.length,
    pagination: page.pagination
  };
}
