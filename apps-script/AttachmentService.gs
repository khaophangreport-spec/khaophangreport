const ATTACHMENT_ALLOWED_MIME_TYPES_ = Object.freeze(["image/jpeg", "image/png", "image/webp"]);

function AttachmentService_validateCreatePayload_(attachments, fields, settings) {
  const safeAttachments = Array.isArray(attachments) ? attachments : [];
  const safeSettings = settings || {};
  const maxImages = Number(safeSettings.maxImages || 3);
  const maxSizeMb = Number(safeSettings.maxImageSizeMb || 1);
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  const maxDimension = Number(safeSettings.maxImageDimension || 1600);

  if (!Array.isArray(attachments)) {
    fields.attachments = "รูปภาพต้องอยู่ในรูปแบบรายการ";
    return [];
  }

  if (safeAttachments.length > maxImages) {
    fields.attachments = "แนบรูปภาพได้สูงสุด " + maxImages + " รูป";
  }

  return safeAttachments.slice(0, maxImages).map(function (attachment, index) {
    const fieldPrefix = "attachments[" + index + "]";

    if (!Utils_isPlainObject_(attachment)) {
      fields[fieldPrefix] = "รูปแบบไฟล์ไม่ถูกต้อง";
      return {};
    }

    const fileName = Utils_normalizeString_(attachment.fileName || "photo");
    const mimeType = Utils_normalizeString_(attachment.mimeType).toLowerCase();
    const fileSize = Number(attachment.fileSize || 0);
    const width = Number(attachment.width || 0);
    const height = Number(attachment.height || 0);
    const base64 = String(attachment.base64 || "");

    if (!base64) {
      fields[fieldPrefix + ".base64"] = "ไม่พบข้อมูลรูปภาพ";
    }

    if (ATTACHMENT_ALLOWED_MIME_TYPES_.indexOf(mimeType) === -1) {
      fields[fieldPrefix + ".mimeType"] = "รองรับเฉพาะ JPG, PNG และ WebP";
    }

    if (!isFinite(fileSize) || fileSize < 1 || fileSize > maxSizeBytes) {
      fields[fieldPrefix + ".fileSize"] = "รูปภาพต้องมีขนาดไม่เกิน " + maxSizeMb + " MB";
    }

    if (!isFinite(width) || !isFinite(height) || width < 1 || height < 1 || Math.max(width, height) > maxDimension) {
      fields[fieldPrefix + ".dimension"] = "ด้านยาวของรูปภาพต้องไม่เกิน " + maxDimension + " px";
    }

    return {
      fileName: fileName,
      mimeType: mimeType,
      fileSize: fileSize,
      width: width,
      height: height,
      base64: base64
    };
  });
}

function AttachmentService_uploadReportAttachments_(reportId, updateId, attachments, createdAt) {
  const uploadedFiles = [];
  const records = [];

  try {
    (attachments || []).forEach(function (attachment) {
      const uploadResult = AttachmentService_uploadOne_(reportId, attachment, createdAt);

      uploadedFiles.push(uploadResult.fileId);
      records.push({
        attachment_id: Utils_createUuid_(),
        report_id: reportId,
        update_id: updateId || "",
        additional_info_id: "",
        file_id: uploadResult.fileId,
        file_name: uploadResult.fileName,
        original_file_name: attachment.fileName,
        mime_type: uploadResult.mimeType,
        file_size: uploadResult.fileSize,
        width: attachment.width || "",
        height: attachment.height || "",
        file_role: "report",
        is_public: true,
        uploaded_by: "public",
        created_at: createdAt,
        drive_folder_id: uploadResult.driveFolderId,
        checksum: uploadResult.checksum,
        is_deleted: false,
        deleted_at: "",
        version: 1
      });
    });

    if (records.length > 0) {
      SheetRepository_batchWrite_("attachments", records, {
        keyColumnName: "attachment_id",
        userId: "public"
      });
    }

    return {
      uploadedFileIds: uploadedFiles,
      records: records
    };
  } catch (error) {
    AttachmentService_compensateUploads_(uploadedFiles);
    throw error;
  }
}

function AttachmentService_uploadOne_(reportId, attachment, createdAt) {
  const decoded = AttachmentService_decodeBase64_(attachment.base64);
  const detectedMimeType = AttachmentService_detectMimeType_(decoded.bytes);

  if (!detectedMimeType || ATTACHMENT_ALLOWED_MIME_TYPES_.indexOf(detectedMimeType) === -1) {
    throw ApiError_("INVALID_FILE_TYPE", "ประเภทไฟล์รูปภาพไม่รองรับ");
  }

  if (detectedMimeType !== attachment.mimeType) {
    throw ApiError_("INVALID_FILE_TYPE", "ประเภทไฟล์ไม่ตรงกับข้อมูลจริง");
  }

  if (decoded.bytes.length !== Number(attachment.fileSize || 0)) {
    throw ApiError_("VALIDATION_ERROR", "ขนาดไฟล์ไม่ตรงกับข้อมูลจริง", {
      attachments: "กรุณาอัปโหลดรูปภาพใหม่"
    });
  }

  try {
    const blob = Utilities.newBlob(decoded.bytes, detectedMimeType, attachment.fileName);
    const metadata = DriveRepository_saveFile_(blob, {
      reportId: reportId,
      fileRole: "report",
      year: createdAt,
      originalFileName: attachment.fileName,
      mimeType: detectedMimeType
    });

    metadata.checksum = Security_hashBytesSha256_(decoded.bytes);
    return metadata;
  } catch (error) {
    if (error && error.name === "ApiError") {
      throw error;
    }

    throw ApiError_("FILE_UPLOAD_FAILED", "อัปโหลดรูปภาพไม่สำเร็จ");
  }
}

function AttachmentService_decodeBase64_(base64Value) {
  const base64Text = String(base64Value || "").replace(/^data:[^;]+;base64,/, "");

  if (!base64Text) {
    throw ApiError_("FILE_DECODE_FAILED", "ถอดรหัสไฟล์ไม่สำเร็จ");
  }

  try {
    return {
      bytes: Utilities.base64Decode(base64Text)
    };
  } catch (error) {
    throw ApiError_("FILE_DECODE_FAILED", "ถอดรหัสไฟล์ไม่สำเร็จ");
  }
}

function AttachmentService_detectMimeType_(bytes) {
  if (!bytes || bytes.length < 12) {
    return "";
  }

  const unsigned = bytes.map(function (byte) {
    return byte < 0 ? byte + 256 : byte;
  });

  if (unsigned[0] === 0xFF && unsigned[1] === 0xD8 && unsigned[2] === 0xFF) {
    return "image/jpeg";
  }

  if (
    unsigned[0] === 0x89 && unsigned[1] === 0x50 && unsigned[2] === 0x4E && unsigned[3] === 0x47 &&
    unsigned[4] === 0x0D && unsigned[5] === 0x0A && unsigned[6] === 0x1A && unsigned[7] === 0x0A
  ) {
    return "image/png";
  }

  const riff = String.fromCharCode(unsigned[0], unsigned[1], unsigned[2], unsigned[3]);
  const webp = String.fromCharCode(unsigned[8], unsigned[9], unsigned[10], unsigned[11]);

  return riff === "RIFF" && webp === "WEBP" ? "image/webp" : "";
}

function AttachmentService_compensateUploads_(fileIds) {
  (fileIds || []).forEach(function (fileId) {
    try {
      DriveRepository_deleteTempFile_(fileId);
    } catch (error) {
      Security_safeLog_("UPLOAD_COMPENSATION_FAILED", {
        fileId: fileId,
        code: error && error.code ? error.code : "INTERNAL_ERROR"
      });
    }
  });
}

function AttachmentService_listPublicByReport_(reportId) {
  const attachments = SheetRepository_list_("attachments", {
    keyColumnName: "attachment_id",
    page: 1,
    pageSize: 100
  }).items.filter(function (attachment) {
    return String(attachment.report_id || "") === String(reportId || "") &&
      Utils_toBoolean_(attachment.is_public) &&
      !Utils_toBoolean_(attachment.is_deleted);
  }).sort(function (left, right) {
    return String(left.created_at || "").localeCompare(String(right.created_at || ""));
  });

  return attachments.map(AttachmentService_projectPublic_);
}

function AttachmentService_projectPublic_(attachment) {
  return {
    attachmentId: String(attachment.attachment_id || ""),
    updateId: String(attachment.update_id || ""),
    fileName: Security_sanitizeText_(attachment.file_name || attachment.original_file_name || ""),
    mimeType: Security_sanitizeText_(attachment.mime_type || ""),
    fileSize: Number(attachment.file_size || 0),
    width: Number(attachment.width || 0),
    height: Number(attachment.height || 0),
    fileRole: Security_sanitizeText_(attachment.file_role || ""),
    createdAt: String(attachment.created_at || "")
  };
}
