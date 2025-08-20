import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";
import AppError from "../utils/errors/app.error";
import { StatusCodes } from "http-status-codes";

export const generateTokens = (userId: string, role: string) => {
  try {
    const accessToken = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET_KEY as string,
      { expiresIn: "1d" }
    );

    const refreshToken = crypto.randomBytes(32).toString("hex");
    return { accessToken, refreshToken };
  } catch (error: any) {
    console.error("errror in genTokenCookie:", error);
    throw new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    // Access token cookie (shorter expiry)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Refresh token cookie (longer expiry)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  } catch (error: any) {}
};
