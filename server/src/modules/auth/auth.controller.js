import { asyncHandler } from "../../core/utils/asyncHandler.js";
import {
  bootstrapAdmin,
  createCaptcha,
  login,
  requestPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
} from "./auth.service.js";

export const getCaptcha = asyncHandler(async (req, res) => {
  const challenge = await createCaptcha();
  res.json({ success: true, data: challenge });
});

export const postLogin = asyncHandler(async (req, res) => {
  const ip = req.ip;
  const result = await login({ ...req.body, ip });
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
      captchaRequired: result.captchaRequired ?? false,
      attempts: result.attempts,
    });
  }

  res.json({ success: true, data: result.data });
});

export const postRequestOtp = asyncHandler(async (req, res) => {
  await requestPasswordResetOtp(req.body);
  res.json({ success: true, message: "If the email exists, an OTP was sent." });
});

export const postVerifyOtp = asyncHandler(async (req, res) => {
  const result = await verifyPasswordResetOtp(req.body);
  if (!result.ok) {
    return res
      .status(result.status)
      .json({ success: false, message: result.message });
  }
  res.json({ success: true, data: { resetToken: result.resetToken } });
});

export const postResetPassword = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  if (!result.ok) {
    return res
      .status(result.status)
      .json({ success: false, message: result.message });
  }
  res.json({ success: true, message: "Password updated successfully" });
});

export const postBootstrap = asyncHandler(async (req, res) => {
  const result = await bootstrapAdmin(req.body);
  if (!result.ok) {
    return res
      .status(result.status)
      .json({ success: false, message: result.message });
  }
  res.json({ success: true, data: result.data });
});
