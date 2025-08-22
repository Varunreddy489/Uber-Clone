import path from "path";
import crypto from "crypto";
export const generateSecureFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const ext = path.extname(originalname).toLowerCase();
  return `${timestamp}_${randomBytes}${ext}`;
};
