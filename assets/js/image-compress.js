(function () {
  "use strict";

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MIME_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };
  const QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46];
  const MIN_DIMENSION = 720;

  async function compress(file, options) {
    const settings = normalizeOptions(options);

    if (!isSupported()) {
      throw createError("เบราว์เซอร์นี้ไม่รองรับการบีบอัดรูปภาพ");
    }

    if (!file || !isAllowedType(file.type)) {
      throw createError("รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
    }

    const bitmap = await decodeImage(file);
    let result = null;

    try {
      const dimensions = fitDimensions(bitmap.width, bitmap.height, settings.maxDimension);
      result = await encodeToTarget(bitmap, file.type, dimensions, settings);
    } finally {
      closeBitmap(bitmap);
    }

    if (!result || result.blob.size > settings.maxSizeBytes) {
      throw createError("ไม่สามารถบีบอัดรูปภาพให้เล็กกว่า " + settings.maxSizeMb + " MB ได้");
    }

    const fileName = buildOutputFileName(file.name, result.mimeType);
    const compressedFile = createFile(result.blob, fileName, result.mimeType, file.lastModified);

    return {
      file: compressedFile,
      blob: result.blob,
      fileName: fileName,
      mimeType: result.mimeType,
      fileSize: result.blob.size,
      width: result.width,
      height: result.height,
      originalFileName: file.name || fileName,
      originalMimeType: file.type,
      originalSize: file.size,
      originalWidth: result.originalWidth,
      originalHeight: result.originalHeight,
      wasCompressed: result.blob.size !== file.size || result.width !== result.originalWidth || result.height !== result.originalHeight
    };
  }

  function isSupported() {
    const canvas = document.createElement("canvas");

    return !!(
      window.File &&
      window.Blob &&
      window.URL &&
      canvas &&
      canvas.getContext &&
      canvas.getContext("2d") &&
      canvas.toBlob
    );
  }

  function isAllowedType(mimeType) {
    return ALLOWED_TYPES.indexOf(mimeType) !== -1;
  }

  function normalizeOptions(options) {
    const config = window.APP_CONFIG || {};
    const source = options || {};
    const maxDimension = Number(source.maxDimension || config.MAX_IMAGE_DIMENSION || 1600);
    const maxSizeMb = Number(source.maxSizeMb || config.MAX_IMAGE_SIZE_MB || 1);

    return {
      maxDimension: Number.isFinite(maxDimension) && maxDimension > 0 ? maxDimension : 1600,
      maxSizeMb: Number.isFinite(maxSizeMb) && maxSizeMb > 0 ? maxSizeMb : 1,
      maxSizeBytes: Math.round((Number.isFinite(maxSizeMb) && maxSizeMb > 0 ? maxSizeMb : 1) * 1024 * 1024)
    };
  }

  async function decodeImage(file) {
    if (typeof createImageBitmap === "function") {
      try {
        return await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch (error) {
        return loadImageElement(file);
      }
    }

    return loadImageElement(file);
  }

  function loadImageElement(file) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = function () {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(createError("ไม่สามารถอ่านไฟล์รูปภาพนี้ได้"));
      };

      image.decoding = "async";
      image.src = objectUrl;
    });
  }

  async function encodeToTarget(source, originalMimeType, initialDimensions, settings) {
    const mimeCandidates = getMimeCandidates(originalMimeType);
    let dimensions = initialDimensions;
    let bestResult = null;

    while (true) {
      for (let mimeIndex = 0; mimeIndex < mimeCandidates.length; mimeIndex += 1) {
        const mimeType = mimeCandidates[mimeIndex];
        const qualitySteps = mimeType === "image/png" ? [1] : QUALITY_STEPS;

        for (let qualityIndex = 0; qualityIndex < qualitySteps.length; qualityIndex += 1) {
          const blob = await drawAndEncode(source, dimensions, mimeType, qualitySteps[qualityIndex]);
          const candidate = {
            blob: blob,
            mimeType: blob.type || mimeType,
            width: dimensions.width,
            height: dimensions.height,
            originalWidth: source.width,
            originalHeight: source.height
          };

          if (!bestResult || candidate.blob.size < bestResult.blob.size) {
            bestResult = candidate;
          }

          if (candidate.blob.size <= settings.maxSizeBytes) {
            return candidate;
          }
        }
      }

      const nextDimensions = reduceDimensions(dimensions);

      if (nextDimensions.width === dimensions.width && nextDimensions.height === dimensions.height) {
        break;
      }

      dimensions = nextDimensions;
    }

    return bestResult;
  }

  function drawAndEncode(source, dimensions, mimeType, quality) {
    return new Promise(function (resolve, reject) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: mimeType !== "image/jpeg" });

      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      if (!context) {
        reject(createError("ไม่สามารถเตรียมพื้นที่บีบอัดรูปภาพได้"));
        return;
      }

      if (mimeType === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(source, 0, 0, dimensions.width, dimensions.height);
      canvas.toBlob(function (blob) {
        canvas.width = 0;
        canvas.height = 0;

        if (!blob) {
          reject(createError("ไม่สามารถบีบอัดรูปภาพนี้ได้"));
          return;
        }

        resolve(blob);
      }, mimeType, quality);
    });
  }

  function getMimeCandidates(originalMimeType) {
    if (originalMimeType === "image/png") {
      return ["image/png", "image/webp", "image/jpeg"];
    }

    return [originalMimeType, originalMimeType === "image/webp" ? "image/jpeg" : "image/webp"];
  }

  function fitDimensions(width, height, maxDimension) {
    const longestSide = Math.max(width, height);

    if (!Number.isFinite(longestSide) || longestSide <= 0) {
      throw createError("ขนาดรูปภาพไม่ถูกต้อง");
    }

    if (longestSide <= maxDimension) {
      return {
        width: Math.round(width),
        height: Math.round(height)
      };
    }

    const ratio = maxDimension / longestSide;

    return {
      width: Math.max(1, Math.round(width * ratio)),
      height: Math.max(1, Math.round(height * ratio))
    };
  }

  function reduceDimensions(dimensions) {
    if (dimensions.width <= MIN_DIMENSION && dimensions.height <= MIN_DIMENSION) {
      return dimensions;
    }

    const nextWidth = Math.max(1, Math.round(dimensions.width * 0.85));
    const nextHeight = Math.max(1, Math.round(dimensions.height * 0.85));

    if (nextWidth === dimensions.width && nextHeight === dimensions.height) {
      return dimensions;
    }

    return {
      width: nextWidth,
      height: nextHeight
    };
  }

  function buildOutputFileName(originalName, mimeType) {
    const extension = MIME_EXTENSIONS[mimeType] || "jpg";
    const safeName = String(originalName || "report-image")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "report-image";

    return safeName + "." + extension;
  }

  function createFile(blob, fileName, mimeType, lastModified) {
    try {
      return new File([blob], fileName, {
        type: mimeType,
        lastModified: lastModified || Date.now()
      });
    } catch (error) {
      blob.name = fileName;
      return blob;
    }
  }

  function closeBitmap(bitmap) {
    if (bitmap && typeof bitmap.close === "function") {
      bitmap.close();
    }
  }

  function createError(message) {
    const error = new Error(message);
    error.code = "IMAGE_COMPRESS_ERROR";
    return error;
  }

  window.KPR_IMAGE_COMPRESS = Object.freeze({
    compress: compress,
    isAllowedType: isAllowedType,
    isSupported: isSupported,
    maxImages: function () {
      return (window.APP_CONFIG && Number(window.APP_CONFIG.MAX_IMAGES)) || 3;
    }
  });
})();
