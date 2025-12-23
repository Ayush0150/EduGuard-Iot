import crypto from "crypto";
import nodemailer from "nodemailer";
import { env } from "../../core/config/env.js";
import { signAccessToken } from "../../core/security/jwt.js";
import { hashPassword, verifyPassword } from "../../core/security/password.js";
import { captchaStore } from "../../core/store/captchaStore.js";
import { loginAttemptStore } from "../../core/store/loginAttemptStore.js";
import { User } from "../users/user.model.js";

function normalizeIdentifier(identifier) {
  return String(identifier ?? "").trim();
}

function isEmail(value) {
  return String(value).includes("@");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function createTransporter() {
  const { host, port, secure, user, pass } = env.mail;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function createCaptcha() {
  return captchaStore.createChallenge();
}

export async function login({
  identifier,
  password,
  captchaToken,
  captchaAnswer,
  ip,
}) {
  const normalized = normalizeIdentifier(identifier);
  const attemptKey = loginAttemptStore.key({ identifier: normalized, ip });
  const attempts = loginAttemptStore.getAttempts(attemptKey);
  const captchaRequired = attempts >= 3;

  if (captchaRequired) {
    const ok = captchaStore.verify({
      token: captchaToken,
      answer: captchaAnswer,
    });
    if (!ok) {
      const nextAttempts = loginAttemptStore.increment(attemptKey);
      return {
        ok: false,
        status: 400,
        message: "Captcha required",
        captchaRequired: true,
        attempts: nextAttempts,
      };
    }
  }

  const query = isEmail(normalized)
    ? { email: normalized.toLowerCase() }
    : { username: normalized };

  const user = await User.findOne(query);
  const passwordOk = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !user.isActive || !passwordOk) {
    const nextAttempts = loginAttemptStore.increment(attemptKey);
    return {
      ok: false,
      status: 401,
      message: "Invalid credentials",
      captchaRequired: nextAttempts >= 3,
      attempts: nextAttempts,
    };
  }

  loginAttemptStore.reset(attemptKey);

  const token = signAccessToken(
    { userId: user._id.toString(), role: user.role },
    { secret: env.jwtSecret, expiresIn: env.jwtExpiresIn }
  );

  return {
    ok: true,
    status: 200,
    data: {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  };
}

export async function requestPasswordResetOtp({ email }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // Prevent user enumeration: always return success.
  if (!user || !user.isActive) return { ok: true };

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = sha256(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  user.resetOtpHash = otpHash;
  user.resetOtpExpiresAt = expiresAt;
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  await user.save();

  const transporter = createTransporter();
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.warn("SMTP not configured; OTP (dev only):", otp);
    return { ok: true };
  }

  await transporter.sendMail({
    from: env.mail.from,
    to: normalizedEmail,
    subject: "EduGuard Password Reset OTP",
    text: `Your EduGuard password reset OTP is: ${otp}. It expires in 10 minutes.`,
  });

  return { ok: true };
}

export async function verifyPasswordResetOtp({ email, otp }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.isActive)
    return { ok: false, status: 400, message: "Invalid OTP" };

  if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
    return { ok: false, status: 400, message: "OTP not requested" };
  }
  if (user.resetOtpExpiresAt.getTime() < Date.now()) {
    return { ok: false, status: 400, message: "OTP expired" };
  }
  if (sha256(otp) !== user.resetOtpHash) {
    return { ok: false, status: 400, message: "Invalid OTP" };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetTokenHash = sha256(resetToken);
  user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.resetOtpHash = null;
  user.resetOtpExpiresAt = null;
  await user.save();

  return { ok: true, resetToken };
}

export async function resetPassword({ email, resetToken, newPassword }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.isActive)
    return { ok: false, status: 400, message: "Invalid reset request" };

  if (!user.resetTokenHash || !user.resetTokenExpiresAt) {
    return { ok: false, status: 400, message: "Reset token not found" };
  }
  if (user.resetTokenExpiresAt.getTime() < Date.now()) {
    return { ok: false, status: 400, message: "Reset token expired" };
  }
  if (sha256(resetToken) !== user.resetTokenHash) {
    return { ok: false, status: 400, message: "Invalid reset token" };
  }

  user.passwordHash = await hashPassword(newPassword);
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  await user.save();

  return { ok: true };
}

export async function bootstrapAdmin({ secret, username, email, password }) {
  if (!env.bootstrap.secret || secret !== env.bootstrap.secret) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  const count = await User.countDocuments();
  if (count > 0) {
    return { ok: false, status: 409, message: "Bootstrap already completed" };
  }

  const admin = await User.create({
    username: username ?? env.bootstrap.username,
    email: (email ?? env.bootstrap.email).toLowerCase(),
    passwordHash: await hashPassword(password ?? env.bootstrap.password),
    role: "SUPER_ADMIN",
    isActive: true,
  });

  return {
    ok: true,
    data: {
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
    },
  };
}
