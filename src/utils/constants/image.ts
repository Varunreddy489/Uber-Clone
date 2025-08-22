export const SUPPORTED_MIMES = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
  "application/pdf": "pdf",
} as const;

export const UPLOAD_LIMITS = {
  fileSize: 10 * 1024 * 1024, // 10MB max file size
  files: 5, // Max 5 files per request
  fields: 10, // Max 10 form fields
};

export const UPLOAD_TYPES = {
  PROFILE_IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/png", "image/jpg", "image/jpeg", "image/webp"],
    dimensions: { width: 500, height: 500 },
    quality: 80,
  },
  DRIVER_DOCUMENTS: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/png", "image/jpg", "image/jpeg", "application/pdf"],
    dimensions: { width: 1920, height: 1080 },
    quality: 85,
  },
  VEHICLE_IMAGES: {
    maxSize: 8 * 1024 * 1024, // 8MB
    allowedTypes: ["image/png", "image/jpg", "image/jpeg", "image/webp"],
    dimensions: { width: 1200, height: 800 },
    quality: 80,
  },
};
