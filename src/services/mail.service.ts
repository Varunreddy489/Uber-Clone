import { StatusCodes } from "http-status-codes";

import { logger, transporter } from "../config";
import AppError from "../utils/errors/app.error";
import { SendEmailParams } from "../utils/common";

export const sendEmail = async ({ toMail, subject, body }: SendEmailParams) => {
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: toMail,
      subject: subject,
      html: body,
    });

    logger.info("Email sent successfully to " + toMail + subject);
  } catch (error: any) {
    logger.error("Error in sendEmail:", error);
    throw new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
