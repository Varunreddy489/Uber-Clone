import { z } from "zod";

// Define schema for validation
export const envSchema = z.object({
  PORT: z.string().default("5000"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().nonempty(),
  GOOGLE_MAPS_KEY: z.string().optional(),
  OPEN_WEATHER_KEY: z.string().optional(),

  API_URL: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.string().default("60000"),

  ADMIN_ID: z.string().optional(),

  JWT_SECRET_KEY: z.string().nonempty(),
  JWT_REFRESH_SECRET: z.string().nonempty(),
  JWT_EXPIRES_IN: z.string().default("60m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.string().default("12"),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_SERVICE_SID: z.string().optional(),

  // Mail
  SMTP_HOST: z.string().default("smtp-relay.brevo.com"),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email(),

  // Cloudinary
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
});
