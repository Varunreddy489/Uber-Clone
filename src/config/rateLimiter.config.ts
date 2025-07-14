import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

export const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT) || 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});