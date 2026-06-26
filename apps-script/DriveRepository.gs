var DriveRepository = (function () {
  var REPORT_ROLE_FOLDERS = Object.freeze(['report', 'progress', 'resolved', 'additional']);
  var DEFAULT_ALLOWED_MIME_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);

  function openOrCreateRootFolder() {
    var rootFolderId = getRootFolderId_();
    var rootFolder = rootFolderId
      ? DriveApp.getFolderById(rootFolderId)
      : DriveApp.createFolder(APP_PUBLIC_CONFIG.ROOT_FOLDER_NAME);

    if (!rootFolderId) {
      setRootFolderId_(rootFolder.getId());
    }

    keepPrivate_(rootFolder);
    return rootFolder;
  }

  function keepPrivate_(driveItem) {
    try {
      driveItem.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    } catch (error) {
      // Some shared-drive policies may not allow changing sharing here.
    }
  }

  function findChildFolder(parentFolder, folderName) {
    var folders = parentFolder.getFoldersByName(folderName);

    return folders.hasNext() ? folders.next() : null;
  }

  function ensureChildFolder(parentFolder, folderName) {
    var folder = findChildFolder(parentFolder, folderName) || parentFolder.createFolder(folderName);
    keepPrivate_(folder);
    return folder;
  }

  function getChildFolder(parentFolder, folderName) {
    var folder = findChildFolder(parentFolder, folderName);
    assertCondition_(folder, 'NOT_FOUND', 'ไม่พบโฟลเดอร์ที่ต้องการ', { folderName: folderName });
    return folder;
  }

  function ensureRootStructure(folderNames) {
    var rootFolder = openOrCreateRootFolder();
    var created = [];
    var existing = [];

    folderNames.forEach(function (folderName) {
      var folder = findChildFolder(rootFolder, folderName);

      if (folder) {
        existing.push(folderName);
      } else {
        ensureChildFolder(rootFolder, folderName);
        created.push(folderName);
      }
    });

    return {
      rootFolderId: rootFolder.getId(),
      created: created,
      existing: existing
    };
  }

  function validateRootStructure(folderNames) {
    var result = {
      ok: true,
      missing: [],
      rootFolderId: getRootFolderId_()
    };

    if (!result.rootFolderId) {
      result.ok = false;
      result.missing.push('ROOT_FOLDER_ID');
      return result;
    }

    var rootFolder = DriveApp.getFolderById(result.rootFolderId);

    folderNames.forEach(function (folderName) {
      if (!findChildFolder(rootFolder, folderName)) {
        result.ok = false;
        result.missing.push(folderName);
      }
    });

    return result;
  }

  function getRootSubfolder(folderName) {
    return getChildFolder(openOrCreateRootFolder(), folderName);
  }

  function getYearFromDate(value) {
    var date = value ? new Date(value) : new Date();

    if (isNaN(date.getTime())) {
      date = new Date();
    }

    return String(date.getFullYear());
  }

  function ensureReportFolder(reportId, options) {
    assertCondition_(validateRequired_(reportId), 'VALIDATION_ERROR', 'กรุณาระบุ Report ID');

    var reportsFolder = getRootSubfolder('reports');
    var yearFolder = ensureChildFolder(reportsFolder, getYearFromDate(options && options.createdAt));
    var reportFolder = ensureChildFolder(yearFolder, sanitizeFileNamePart_(reportId));

    REPORT_ROLE_FOLDERS.forEach(function (roleName) {
      ensureChildFolder(reportFolder, roleName);
    });

    return {
      folder: reportFolder,
      folderId: reportFolder.getId(),
      year: yearFolder.getName()
    };
  }

  function ensureReportRoleFolder(reportId, role, options) {
    var safeRole = normalizeString_(role || 'report');
    assertCondition_(REPORT_ROLE_FOLDERS.indexOf(safeRole) >= 0, 'VALIDATION_ERROR', 'ประเภทโฟลเดอร์ไฟล์ไม่ถูกต้อง');

    var reportFolderResult = ensureReportFolder(reportId, options || {});
    var roleFolder = ensureChildFolder(reportFolderResult.folder, safeRole);

    return {
      folder: roleFolder,
      folderId: roleFolder.getId(),
      reportFolderId: reportFolderResult.folderId,
      year: reportFolderResult.year,
      role: safeRole
    };
  }

  function createSafeFileName(role, originalFileName, mimeType) {
    var extension = getExtensionFromMimeType_(mimeType) || getFileExtension_(originalFileName);
    var timestamp = nowIso_().replace(/[-:.]/g, '').replace('T', 'T').replace('Z', 'Z');
    var randomPart = createUuid_().split('-')[0];
    var safeRole = sanitizeFileNamePart_(role || 'file') || 'file';

    assertCondition_(extension, 'VALIDATION_ERROR', 'ไม่พบนามสกุลไฟล์ที่ปลอดภัย');
    return safeRole + '_' + timestamp + '_' + randomPart + '.' + extension;
  }

  function decodeBase64File(base64Value) {
    var raw = String(base64Value || '').replace(/^data:[^;]+;base64,/, '');
    assertCondition_(raw, 'FILE_DECODE_FAILED', 'ไม่พบข้อมูลไฟล์');

    try {
      return Utilities.base64Decode(raw);
    } catch (error) {
      throw createAppError_('FILE_DECODE_FAILED', 'ถอดรหัสไฟล์ไม่สำเร็จ');
    }
  }

  function saveFile(folder, payload, options) {
    var allowedTypes = (options && options.allowedMimeTypes) || DEFAULT_ALLOWED_MIME_TYPES;
    var filePayload = payload || {};
    var mimeType = normalizeString_(filePayload.mimeType);

    assertCondition_(validateMimeType_(mimeType, allowedTypes), 'INVALID_FILE_TYPE', 'ประเภทไฟล์ไม่รองรับ');

    var originalFileName = normalizeString_(filePayload.fileName || 'upload');
    var role = normalizeString_((options && options.fileRole) || filePayload.fileRole || 'report');
    var fileName = createSafeFileName(role, originalFileName, mimeType);
    var bytes = filePayload.bytes || decodeBase64File(filePayload.base64);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);
    var file = folder.createFile(blob);

    keepPrivate_(file);

    return buildFileMetadata(file, {
      originalFileName: originalFileName,
      fileRole: role,
      width: filePayload.width || '',
      height: filePayload.height || ''
    });
  }

  function saveReportFile(reportId, payload, options) {
    var roleFolderResult = ensureReportRoleFolder(reportId, payload && payload.fileRole, options || {});
    var metadata = saveFile(roleFolderResult.folder, payload || {}, options || {});

    metadata.drive_folder_id = roleFolderResult.folderId;
    metadata.report_folder_id = roleFolderResult.reportFolderId;
    metadata.year = roleFolderResult.year;
    return metadata;
  }

  function renameFile(fileId, newName) {
    var file = DriveApp.getFileById(fileId);
    var safeName = sanitizeFileNamePart_(newName);

    assertCondition_(safeName, 'VALIDATION_ERROR', 'ชื่อไฟล์ใหม่ไม่ถูกต้อง');
    file.setName(safeName);

    return buildFileMetadata(file, {});
  }

  function moveFileToFolder(fileId, folder) {
    var file = DriveApp.getFileById(fileId);
    file.moveTo(folder);
    keepPrivate_(file);
    return buildFileMetadata(file, {});
  }

  function moveFileToTemp(fileId) {
    return moveFileToFolder(fileId, getRootSubfolder('temp'));
  }

  function trashTempFile(fileId) {
    var tempFolder = getRootSubfolder('temp');
    var file = DriveApp.getFileById(fileId);
    var parents = file.getParents();
    var inTemp = false;

    while (parents.hasNext()) {
      if (parents.next().getId() === tempFolder.getId()) {
        inTemp = true;
        break;
      }
    }

    assertCondition_(inTemp, 'FORBIDDEN', 'ลบได้เฉพาะไฟล์ใน temp');
    file.setTrashed(true);

    return {
      file_id: fileId,
      trashed: true
    };
  }

  function getFileMetadata(fileId) {
    return buildFileMetadata(DriveApp.getFileById(fileId), {});
  }

  function checkFolder(folderId) {
    try {
      var folder = DriveApp.getFolderById(folderId);
      return {
        ok: true,
        folder_id: folder.getId(),
        name: folder.getName()
      };
    } catch (error) {
      return {
        ok: false,
        folder_id: folderId,
        error: 'NOT_FOUND'
      };
    }
  }

  function buildFileMetadata(file, extra) {
    var metadata = {
      file_id: file.getId(),
      file_name: file.getName(),
      mime_type: file.getMimeType(),
      file_size: file.getSize(),
      created_at: file.getDateCreated() ? file.getDateCreated().toISOString() : '',
      updated_at: file.getLastUpdated() ? file.getLastUpdated().toISOString() : '',
      url: file.getUrl()
    };

    Object.keys(extra || {}).forEach(function (key) {
      metadata[key] = extra[key];
    });

    return metadata;
  }

  function createTestHelper() {
    return {
      createSafeFileName: createSafeFileName,
      getYearFromDate: getYearFromDate,
      reportRoleFolders: REPORT_ROLE_FOLDERS
    };
  }

  return {
    checkFolder: checkFolder,
    createSafeFileName: createSafeFileName,
    createTestHelper: createTestHelper,
    ensureChildFolder: ensureChildFolder,
    ensureReportFolder: ensureReportFolder,
    ensureReportRoleFolder: ensureReportRoleFolder,
    ensureRootStructure: ensureRootStructure,
    findChildFolder: findChildFolder,
    getFileMetadata: getFileMetadata,
    moveFileToFolder: moveFileToFolder,
    moveFileToTemp: moveFileToTemp,
    openOrCreateRootFolder: openOrCreateRootFolder,
    renameFile: renameFile,
    saveFile: saveFile,
    saveReportFile: saveReportFile,
    trashTempFile: trashTempFile,
    validateRootStructure: validateRootStructure
  };
})();
