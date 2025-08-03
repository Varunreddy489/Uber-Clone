import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, errors } = format;

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp}  ${level}: ${message}`;
});

export const logger = createLogger({
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    customFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "combines.log" }),
    new transports.File({
      filename: "error.log",
      level: "error",
    }),
  ],
});