import path from "path";
import multer from "multer";
import fs from "fs/promises";

// import { SUPPORTED_MIMES, UPLOAD_LIMITS, UPLOAD_TYPES } from "../constants";
import { generateSecureFilename } from "../../helper";
import { SUPPORTED_MIMES, UPLOAD_TYPES } from "../constants";

export const createSecureStorage = () => {
  const uploadDir = path.join(process.cwd(), "temp", "uploads");

  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error: any) {
        cb(error, "");
      }
    },
    filename: (req, file, cb) => {
      const secureFilename = generateSecureFilename(file.originalname);
      cb(null, secureFilename);
    },
  });
};

type SupportedExtension =
  (typeof SUPPORTED_MIMES)[keyof typeof SUPPORTED_MIMES];

export const createSecureFileFilter = (
  uploadType: keyof typeof UPLOAD_TYPES
) => {
  return async (req: Request, file: Express.Multer.File, cb: any) => {
    try {
      const config = UPLOAD_TYPES[uploadType];

      if (!config.allowedTypes.includes(file.mimetype as any)) {
        return cb(
          new Error(`File type ${file.mimetype} not allowed for ${uploadType}`)
        );
      }

      const ext = path.extname(file.originalname).toLowerCase().slice(1);

      const allowedExtensions = config.allowedTypes.map(
        (type) => SUPPORTED_MIMES[type as keyof typeof SUPPORTED_MIMES]
      );

      if (!allowedExtensions.includes(ext as SupportedExtension)) {
        return cb(new Error(`File extension .${ext} not allowed`));
      }

      cb(null, true);
    } catch (error: any) {
      cb(error);
    }
  };
};
