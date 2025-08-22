import multer from "multer";
import { UPLOAD_TYPES } from "../utils/constants";
import { createSecureStorage } from "../utils/common";

export const uploadMiddleware = (
  uploadType: keyof typeof UPLOAD_TYPES,
  fields: { name: string; maxCount: number }[]
) => {
  const config = UPLOAD_TYPES[uploadType];

  return multer({
    storage: createSecureStorage(),
    limits: {
      fileSize: config.maxSize,
      files: 1,
      fields: 5,
    },
  }).fields(fields); // ✅ multiple file fields
};
