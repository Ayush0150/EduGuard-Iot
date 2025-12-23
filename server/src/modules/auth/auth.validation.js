import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  captchaToken: z.string().optional(),
  captchaAnswer: z.string().optional(),
});

export const requestOtpSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  resetToken: z.string().min(20),
  newPassword: z.string().min(8),
});

export const bootstrapSchema = z.object({
  secret: z.string().min(1),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});
