import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
} from "../validations";
import { sendEmail } from "../services";
import { logger, prisma } from "../config";
import { generateTokens, setTokenCookies } from "../helper";
import { ErrorResponse, SuccessResponse } from "../utils/common";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, name, password, phoneNumber } = req.body;

    if (!email || !name || !password || !phoneNumber) {
      ErrorResponse.error = "All fields are required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    // email validation
    if (!validateEmail(email)) {
      ErrorResponse.error = "Please provide a valid email address";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    // phone number validation
    if (!validatePhoneNumber(phoneNumber)) {
      ErrorResponse.error = "Please provide a valid phone number";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    // Password validation
    const passwordValidation = validatePassword(password);

    if (!passwordValidation.isValid) {
      ErrorResponse.error = passwordValidation.errors.join("; ");
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { phone_number: phoneNumber }],
      },
    });

    if (existingUser) {
      ErrorResponse.error =
        existingUser.email === email.toLowerCase()
          ? "Email already registered"
          : "Phone number already registered";
      res.status(StatusCodes.CONFLICT).json(ErrorResponse);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          password: hashedPassword,
          phone_number: phoneNumber.trim(),
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

    SuccessResponse.data = {
      user,
      accessToken, // Include in response for mobile apps
    };
    SuccessResponse.message = "User registered successfully";
    res.status(StatusCodes.CREATED).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in registerUser:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      ErrorResponse.error = "Email/Phone Number and Password are required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.lowerCase() }, { phone_number: identifier }],
      },
      include: {
        Driver: true, // Include driver info if exists
      },
    });

    if (!user) {
      ErrorResponse.error = "User not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      ErrorResponse.error = "Invalid password";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await generateTokens(
      user.id,
      user.role
    );

    // Set secure cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    // Send a Registration Success email
    const emailPayload = {
      toMail: user.email,
      subject: "Login Success",
      body: "<h1>Login Success</h1>",
    };

    await sendEmail(emailPayload);

    SuccessResponse.data = {
      user: userWithoutPassword,
      accessToken,
    };
    SuccessResponse.message = "Login successful";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in loginUser:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    SuccessResponse.message = "Logged out successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      ErrorResponse.error = "Refresh token not provided";
      res.status(StatusCodes.UNAUTHORIZED).json(ErrorResponse);
      return;
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken, expiresAt: { gt: new Date() } },
      include: {
        user: true,
      },
    });

    if (!tokenRecord) {
      ErrorResponse.error = "Invalid or expired refresh token";
      res.status(StatusCodes.UNAUTHORIZED).json(ErrorResponse);
      return;
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.role
    );

    // Revoke old refresh token and create new one
    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: tokenRecord.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      }),
    ]);

    // Set new cookies
    setTokenCookies(res, accessToken, newRefreshToken);

    SuccessResponse.data = { accessToken };
    SuccessResponse.message = "Token refreshed successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in refreshToken:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      ErrorResponse.error = "Provide valid Email Address";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
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

    SuccessResponse.data = user;
    SuccessResponse.message = "OTP sent successfully! Please Check your email";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { emailVerificationToken } = req.body;

    if (!emailVerificationToken) {
      ErrorResponse.error = "All fields are required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      ErrorResponse.error = "User not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const isToken = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerificationToken: true },
    });

    if (!isToken) {
      ErrorResponse.error = "User not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    if (
      isToken.emailVerificationToken ??
      0 !== Number(emailVerificationToken)
    ) {
      ErrorResponse.error = "Invalid OTP";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    SuccessResponse.data = user;
    SuccessResponse.message = "OTP verified successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      ErrorResponse.error = "Passwords do not match";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      ErrorResponse.error = passwordValidation.errors.join("; ");
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
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
      ErrorResponse.error = "Invalid or expired reset token";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
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
      ErrorResponse.error = "No email found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    // Send a Registration Success email
    const emailPayload = {
      toMail: userEmail.email,
      subject: "Registration Success",
      body: "<h1>Registration Success</h1>",
    };

    await sendEmail(emailPayload);

    SuccessResponse.message = "Password reset successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};
