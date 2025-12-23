import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 8080),
  mongoUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  bootstrap: {
    secret: process.env.BOOTSTRAP_SECRET ?? "",
    username: process.env.BOOTSTRAP_ADMIN_USERNAME ?? "admin",
    email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@college.edu",
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "ChangeMe123!",
  },
  mail: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: String(process.env.SMTP_SECURE ?? "true") === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM ?? "EduGuard <no-reply@eduguard.local>",
  },
};
