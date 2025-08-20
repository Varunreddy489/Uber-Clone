import { Router } from "express";
import {
  loginUser,
  refreshToken,
  registerUser,
  resetPassword,
  forgotPassword,
  logoutUser,
  verifyOTP,
} from "../../controllers";

const router = Router();

// ~ /api/v1/auth/register POST
router.post("/register", registerUser);

// ~ /api/v1/auth/login POST
router.post("/login", loginUser);

// ~ /api/v1/auth/logout POST
router.post("/logout", logoutUser);

// ~ /api/v1/auth/refresh POST
router.post("/refresh", refreshToken);

// ~ /api/v1/auth/forgot-password POST
router.post("/forgot-password", forgotPassword);

// ~ /api/v1/auth/verify-otp POST
router.post("/verify-otp", verifyOTP);

// ~ /api/v1/auth/reset-password POST
router.post("/reset-password", resetPassword);

export { router as authRoutes };
