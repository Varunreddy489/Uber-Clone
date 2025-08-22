
import fs from "fs/promises";

import { logger } from "../config";

// ^ Enhanced file type validation using file signatures (magic numbers)
export const validateFileSignature = async (
  filePath: string,
  mimeType: string
): Promise<boolean> => {
  try {
    const buffer = Buffer.alloc(12);
    const fileHandling = await fs.open(filePath);
    await fileHandling.read(buffer, 0, 12, 0);
    await fileHandling.close();

    const hex = buffer.toString("hex").toUpperCase();

    const signatures: Record<string, string[]> = {
      "image/jpeg": ["FFD8FF"],
      "image/png": ["89504E47"],
      "image/webp": ["52494646"], // RIFF
      "application/pdf": ["255044462D"], // %PDF
    };

    const validSignatures = signatures[mimeType];

    if (!validSignatures) return false;

    return validSignatures.some((signature) => hex.startsWith(signature));
  } catch (error: any) {
    logger.error("Error validating file signature:", error);
    return false;
  }
};

// * Sanitize filename to prevent directory traversal attacks
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/\.\./g, "_")
    .replace(/^\./, "_")
    .substring(0, 100);
};


