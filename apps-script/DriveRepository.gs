function DriveRepository_getOrCreateRootFolder_() {
  const rootFolderId = Config_getRootFolderId_();

  if (rootFolderId) {
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    DriveRepository_assertFolderNotPublic_(rootFolder);
    return rootFolder;
  }

  const folder = DriveApp.createFolder("Khaophang_Report_Files");
  DriveRepository_assertFolderNotPublic_(folder);
  Config_setRootFolderId_(folder.getId());
  return folder;
}

function DriveRepository_getOrCreateChildFolder_(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(folderName);
}

function DriveRepository_getRootFolder_() {
  const rootFolderId = Config_getRootFolderId_();

  if (!rootFolderId) {
    throw ApiError_("INTERNAL_ERROR", "ยังไม่ได้ตั้งค่า Root Folder ID");
  }

  const rootFolder = DriveApp.getFolderById(rootFolderId);
  DriveRepository_assertFolderNotPublic_(rootFolder);

  return rootFolder;
}

function DriveRepository_assertFolderNotPublic_(folder) {
  const access = folder.getSharingAccess();

  if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
    throw ApiError_("FORBIDDEN", "โฟลเดอร์ Drive ถูกเปิดเป็นสาธารณะ กรุณาปรับสิทธิ์ก่อนใช้งาน");
  }
}

function DriveRepository_assertFolderExists_(folderId) {
  if (!folderId) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาระบุ Folder ID");
  }

  const folder = DriveApp.getFolderById(folderId);
  DriveRepository_assertFolderNotPublic_(folder);

  return folder;
}

function DriveRepository_getOrCreateReportFolder_(reportId, yearOrDate) {
  if (!Validation_isNonEmptyString_(reportId)) {
    throw ApiError_("VALIDATION_ERROR", "กรุณาระบุ Report ID");
  }

  const rootFolder = DriveRepository_getRootFolder_();
  const reportsFolder = DriveRepository_getOrCreateChildFolder_(rootFolder, "reports");
  const yearFolder = DriveRepository_getOrCreateChildFolder_(reportsFolder, Utils_getYear_(yearOrDate));
  const reportFolder = DriveRepository_getOrCreateChildFolder_(yearFolder, Utils_sanitizeFileName_(reportId));

  DriveRepository_assertFolderNotPublic_(reportFolder);

  return reportFolder;
}

function DriveRepository_getOrCreateReportRoleFolder_(reportId, fileRole, yearOrDate) {
  const role = DriveRepository_normalizeFileRole_(fileRole);
  const reportFolder = DriveRepository_getOrCreateReportFolder_(reportId, yearOrDate);
  const roleFolder = DriveRepository_getOrCreateChildFolder_(reportFolder, role);

  DriveRepository_assertFolderNotPublic_(roleFolder);

  return roleFolder;
}

function DriveRepository_normalizeFileRole_(fileRole) {
  const role = Utils_normalizeString_(fileRole || "report").toLowerCase();
  const allowedRoles = ["report", "progress", "resolved", "additional", "announcement"];

  if (allowedRoles.indexOf(role) === -1) {
    throw ApiError_("VALIDATION_ERROR", "ประเภทไฟล์ไม่ถูกต้อง", {
      fileRole: "ค่าที่รองรับคือ " + allowedRoles.join(", ")
    });
  }

  return role;
}

function DriveRepository_buildFileName_(fileRole, originalFileName, mimeType) {
  const role = DriveRepository_normalizeFileRole_(fileRole);
  const timestamp = Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'");
  const randomSuffix = Utils_createUuid_().replace(/-/g, "").slice(0, 6);
  const extension = DriveRepository_getExtension_(originalFileName, mimeType);

  return role + "_" + timestamp + "_" + randomSuffix + "." + extension;
}

function DriveRepository_getExtension_(originalFileName, mimeType) {
  const safeName = Utils_sanitizeFileName_(originalFileName || "");
  const match = safeName.match(/\.([A-Za-z0-9]+)$/);

  if (match && match[1]) {
    return match[1].toLowerCase().slice(0, 12);
  }

  return Utils_getFileExtensionFromMime_(mimeType);
}

function DriveRepository_saveFile_(blob, options) {
  const safeOptions = options || {};

  if (!blob || typeof blob.getBytes !== "function") {
    throw ApiError_("VALIDATION_ERROR", "รูปแบบไฟล์ไม่ถูกต้อง");
  }

  const folder = safeOptions.folder ||
    (safeOptions.folderId ? DriveRepository_assertFolderExists_(safeOptions.folderId) :
      DriveRepository_getOrCreateReportRoleFolder_(safeOptions.reportId, safeOptions.fileRole, safeOptions.year || safeOptions.createdAt));
  const originalFileName = safeOptions.originalFileName || blob.getName() || "upload";
  const fileName = DriveRepository_buildFileName_(safeOptions.fileRole || "report", originalFileName, safeOptions.mimeType || blob.getContentType());
  const uploadBlob = blob.copyBlob().setName(fileName);
  const file = folder.createFile(uploadBlob);

  return DriveRepository_getFileMetadata_(file, {
    originalFileName: originalFileName,
    fileRole: DriveRepository_normalizeFileRole_(safeOptions.fileRole || "report"),
    driveFolderId: folder.getId()
  });
}

function DriveRepository_saveBase64File_(base64Value, options) {
  const safeOptions = options || {};
  const base64Text = String(base64Value || "").replace(/^data:[^;]+;base64,/, "");

  if (!base64Text) {
    throw ApiError_("FILE_DECODE_FAILED", "ไม่พบข้อมูลไฟล์");
  }

  try {
    const bytes = Utilities.base64Decode(base64Text);
    const mimeType = safeOptions.mimeType || "application/octet-stream";
    const blob = Utilities.newBlob(bytes, mimeType, safeOptions.originalFileName || "upload");

    return DriveRepository_saveFile_(blob, safeOptions);
  } catch (error) {
    throw ApiError_("FILE_DECODE_FAILED", "ถอดรหัสไฟล์ไม่สำเร็จ");
  }
}

function DriveRepository_renameFile_(fileId, newFileName) {
  const file = DriveApp.getFileById(fileId);
  const safeName = Utils_sanitizeFileName_(newFileName);

  file.setName(safeName);

  return DriveRepository_getFileMetadata_(file, {});
}

function DriveRepository_moveFileToFolder_(fileId, targetFolder) {
  const file = DriveApp.getFileById(fileId);
  const folder = typeof targetFolder === "string" ?
    DriveRepository_assertFolderExists_(targetFolder) :
    targetFolder;

  DriveRepository_assertFolderNotPublic_(folder);
  file.moveTo(folder);

  return DriveRepository_getFileMetadata_(file, {
    driveFolderId: folder.getId()
  });
}

function DriveRepository_moveTempFile_(fileId, options) {
  const safeOptions = options || {};
  const targetFolder = safeOptions.folder || safeOptions.folderId ||
    DriveRepository_getOrCreateReportRoleFolder_(safeOptions.reportId, safeOptions.fileRole || "additional", safeOptions.year || safeOptions.createdAt);

  return DriveRepository_moveFileToFolder_(fileId, targetFolder);
}

function DriveRepository_deleteTempFile_(fileId) {
  const file = DriveApp.getFileById(fileId);
  file.setTrashed(true);

  return DriveRepository_getFileMetadata_(file, {
    trashed: true
  });
}

function DriveRepository_getFileMetadata_(file, extra) {
  const parents = file.getParents();
  const parentFolderId = parents.hasNext() ? parents.next().getId() : "";
  const safeExtra = extra || {};

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    originalFileName: safeExtra.originalFileName || "",
    mimeType: file.getMimeType(),
    fileSize: file.getSize(),
    fileRole: safeExtra.fileRole || "",
    driveFolderId: safeExtra.driveFolderId || parentFolderId,
    url: file.getUrl(),
    createdAt: file.getDateCreated().toISOString(),
    updatedAt: file.getLastUpdated().toISOString(),
    trashed: safeExtra.trashed === true
  };
}
