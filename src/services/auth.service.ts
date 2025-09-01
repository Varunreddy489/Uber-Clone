import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";

import { logger, prisma } from "../config";
import { sendEmail } from "./mail.service";
import AppError from "../utils/errors/app.error";
import { generateTokens, setTokenCookies } from "../helper";
import { validateEmail, validatePhoneNumber } from "../validations";

export const userRegisterService = async (res: Response, data: any) => {
  try {
    const { email, name, password, phone_number } = data;

    if (!email || !name || !password || !phone_number) {
      throw new AppError("All fields are required", StatusCodes.BAD_REQUEST);
    }

    // email validation
    if (!validateEmail(email)) {
      throw new AppError(
        "Please provide a valid email address",
        StatusCodes.BAD_REQUEST
      );
    }

    // phone number validation
    if (!validatePhoneNumber(phone_number)) {
      throw new AppError(
        "Please provide a valid phone number",
        StatusCodes.BAD_REQUEST
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { phone_number: phone_number }],
      },
    });

    if (existingUser) {
      throw new AppError(
        existingUser.email === email.toLowerCase()
          ? "Email already registered"
          : "Phone number already registered",
        StatusCodes.CONFLICT
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          password: hashedPassword,
          phone_number: phone_number.trim(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone_number: true,
          role: true,
          createdAt: true,
        },
      });

      // * Create Refresh token
      const refreshToken = crypto.randomBytes(64).toString("hex");
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: newUser.id,
          expiresAt: refreshTokenExpiry,
        },
      });

      // Send a Registration Success email
      const emailPayload = {
        toMail: newUser.email,
        subject: "Registration Success",
        body: "<h1>Registration Success</h1>",
      };

      await sendEmail(emailPayload);

      return newUser;
    });

    // * Setting token in cookies
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    setTokenCookies(res, accessToken, refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user, accessToken };
  } catch (error: any) {
    logger.error("Error in userRegisterService:", error);

    throw new AppError(
      `Failed to Register user: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const userLoginService = async (res: Response, data: any) => {
  try {
    const { identifier, password } = data;

    if (!identifier || !password) {
      throw new AppError(
        "Email/Phone Number and Password are required",
        StatusCodes.BAD_REQUEST
      );
    }
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { phone_number: identifier }],
      },
      include: {
        Driver: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", StatusCodes.BAD_REQUEST);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid password", StatusCodes.BAD_REQUEST);
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await generateTokens(
      user.id,
      user.role
    );

    setTokenCookies(res, accessToken, refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { id, name } = user;

    // Send a Registration Success email
    const emailPayload = {
      toMail: user.email,
      subject: "Login Success",
      body: "<h1>Login Success</h1>",
    };

    await sendEmail(emailPayload);

    return { user: { id: user.id, name: user.name }, accessToken };
  } catch (error: any) {
    logger.error("Error in userLoginService:", error);

    throw new AppError(
      `Error in userLoginService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const resetPasswordService = async (res: Response, token: string) => {
  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError(
        "Invalid or expired refresh token",
        StatusCodes.UNAUTHORIZED
      );
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.role
    );

    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: tokenRecord.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    setTokenCookies(res, accessToken, newRefreshToken);
    return { accessToken };
  } catch (error: any) {
    logger.error("Error in resetPasswordService:", error);

    throw new AppError(
      `Error in resetPasswordService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const forgotPasswordService = async (email: string) => {
  try {
    if (!email || !validateEmail(email)) {
      throw new AppError(
        "Provide valid Email Address",
        StatusCodes.BAD_REQUEST
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return;
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create reset token record
    await prisma.passwordReset.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Send email with reset link
    const emailPayload = {
      toMail: email,
      subject: "Password Reset",
      body: `${process.env.CLIENT_URL}/reset-password/${resetToken}`,
    };

    await sendEmail(emailPayload);

    logger.info(`Password reset token for ${email}: ${resetToken}`);

    return user;
  } catch (error: any) {
    logger.error("Error in forgotPasswordService:", error);

    throw new AppError(
      `Error in forgotPasswordService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const otpVerificationService = async (
  userId: string,
  emailVerificationToken: string
) => {
  try {
    if (!emailVerificationToken) {
      throw new AppError("All fields are required", StatusCodes.BAD_REQUEST);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", StatusCodes.BAD_REQUEST);
    }

    const isToken = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerificationToken: true },
    });

    if (!isToken) {
      throw new AppError("User not found", StatusCodes.BAD_REQUEST);
    }

    if (
      isToken.emailVerificationToken ??
      0 !== Number(emailVerificationToken)
    ) {
      throw new AppError("Invalid OTP", StatusCodes.BAD_REQUEST);
    }

    return user;
  } catch (error: any) {
    logger.error("Error in otpVerificationService:", error);

    throw new AppError(
      `Error in otpVerificationService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const resetUserPasswordService = async (data: any) => {
  try {
    const { userId, token, password, confirmPassword } = data;

    if (password !== confirmPassword) {
      throw new AppError("Passwords do not match", StatusCodes.BAD_REQUEST);
    }

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new AppError(
        "Invalid or expired reset token",
        StatusCodes.BAD_REQUEST
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      }),
    ]);

    const userEmail = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userEmail) {
      throw new AppError("No email found", StatusCodes.BAD_REQUEST);
    }

    // Send a Registration Success email
    const emailPayload = {
      toMail: userEmail.email,
      subject: "Registration Success",
      body: "<h1>Registration Success</h1>",
    };

    await sendEmail(emailPayload);
  } catch (error: any) {
    logger.error("Error in resetUserPasswordService:", error);

    throw new AppError(
      `Error in resetUserPasswordService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
