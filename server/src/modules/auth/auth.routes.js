import { Router } from "express";
import {
  getCaptcha,
  postBootstrap,
  postLogin,
  postRequestOtp,
  postResetPassword,
  postVerifyOtp,
} from "./auth.controller.js";
import {
  bootstrapSchema,
  loginSchema,
  requestOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "./auth.validation.js";

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: "Validation error" });
    }
    req.body = parsed.data;
    next();
  };
}

export const authRouter = Router();

authRouter.get("/captcha", getCaptcha);
authRouter.post("/login", validate(loginSchema), postLogin);

authRouter.post(
  "/forgot-password/request-otp",
  validate(requestOtpSchema),
  postRequestOtp
);
authRouter.post(
  "/forgot-password/verify-otp",
  validate(verifyOtpSchema),
  postVerifyOtp
);
authRouter.post(
  "/forgot-password/reset",
  validate(resetPasswordSchema),
  postResetPassword
);

authRouter.post("/bootstrap", validate(bootstrapSchema), postBootstrap);
