import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { SendEmailParams } from "../utils/common";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST as string,
  port: parseInt(process.env.SMTP_PORT as string, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
