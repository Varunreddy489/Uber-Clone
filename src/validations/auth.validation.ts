import { z } from "zod";

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

export const validatePassword = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8)
    errors.push("Password must be at least 8 characters long");
  if (!/(?=.*[a-z])/.test(password))
    errors.push("Password must contain at least one lowercase letter");
  if (!/(?=.*[A-Z])/.test(password))
    errors.push("Password must contain at least one uppercase letter");
  if (!/(?=.*\d)/.test(password))
    errors.push("Password must contain at least one number");
  if (!/(?=.*[@$!%*?&])/.test(password))
    errors.push("Password must contain at least one special character");

  return { isValid: errors.length === 0, errors };
};

// User Register Schema

export const registerSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .transform((val: any) => val.trim().toLowerCase()),

  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[+]?[\d\s\-()]+$/, "Please provide a valid phone number"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  role: z.enum(["USER", "DRIVER"]).default("USER"),
});

// User Login Schema
export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .transform((val: any) => val.trim().toLowerCase()),
});

// Reset Password Schema

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// Change Password Schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    confirmPassword: z.string(),
  })
  .refine((data: any) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
