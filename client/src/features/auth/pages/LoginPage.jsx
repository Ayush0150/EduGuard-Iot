import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import collegeImg from "../../../assets/college-img.png";
import eduGuardLogo from "../../../assets/eduGuard-logo.png";
import { setAccessToken } from "../../../core/auth/tokenStorage";
import ThemeToggle from "../../../core/theme/ThemeToggle";
import { getCaptcha, login } from "../api/authApi";

function EduGuardMark() {
  return (
    <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-none">
      <img
        src={eduGuardLogo}
        alt="EduGuard"
        className="h-full w-full object-contain"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

function EyeIcon({ open }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200"
    >
      {open ? (
        <>
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 4l16 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const inputBaseClass =
    "mt-2 w-full rounded-none border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-offset-0 focus-visible:outline-none dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

  const inputClass = (hasError) =>
    `${inputBaseClass} ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-900/60"
        : "border-slate-200 focus:border-indigo-600 focus:ring-indigo-600 dark:border-slate-700"
    }`;

  const canSubmit = useMemo(() => {
    if (!identifier.trim() || !password) return false;
    if (captchaRequired && (!captchaToken || !captchaAnswer.trim()))
      return false;
    return true;
  }, [identifier, password, captchaRequired, captchaAnswer, captchaToken]);

  async function ensureCaptcha() {
    const challenge = await getCaptcha();
    setCaptchaToken(challenge.token);
    setCaptchaQuestion(challenge.question);
    setCaptchaAnswer("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setFieldErrors({ identifier: "Email or username is required." });
      return;
    }
    if (!password) {
      setFieldErrors({ password: "Password is required." });
      return;
    }
    if (captchaRequired) {
      if (!captchaToken) {
        await ensureCaptcha();
        setFieldErrors({ captchaAnswer: "Captcha answer is required." });
        return;
      }
      if (!captchaAnswer.trim()) {
        setFieldErrors({ captchaAnswer: "Captcha answer is required." });
        return;
      }
      if (!/^\d+$/.test(captchaAnswer.trim())) {
        setFieldErrors({ captchaAnswer: "Captcha answer must be a number." });
        return;
      }
    }

    setBusy(true);
    try {
      const payload = {
        identifier: trimmedIdentifier,
        password,
        captchaToken: captchaRequired ? captchaToken : undefined,
        captchaAnswer: captchaRequired ? captchaAnswer.trim() : undefined,
        remember,
      };

      const data = await login(payload);
      setAccessToken(data.token);
      navigate("/dashboard");
    } catch (err) {
      const serverErrors = err?.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length) {
        const nextFieldErrors = {};
        for (const item of serverErrors) {
          const key = Array.isArray(item?.path) ? item.path[0] : item?.path;
          if (typeof key === "string" && !nextFieldErrors[key]) {
            nextFieldErrors[key] = item?.message;
          }
        }
        if (Object.keys(nextFieldErrors).length)
          setFieldErrors(nextFieldErrors);
      }

      const firstFieldError = serverErrors?.[0]?.message;
      const message =
        firstFieldError || err?.response?.data?.message || "Login failed";
      const needsCaptcha = Boolean(err?.response?.data?.captchaRequired);
      setError(message);
      if (needsCaptcha) {
        setCaptchaRequired(true);
        if (!captchaQuestion) {
          await ensureCaptcha();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-start bg-slate-100 px-4 py-6 sm:items-center sm:p-8 lg:p-10 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid w-full overflow-hidden rounded-none border border-slate-200 bg-white shadow-lg lg:min-h-[min(640px,calc(100dvh-6rem))] lg:grid-cols-2 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="flex items-center justify-between gap-4">
                <EduGuardMark />
                <ThemeToggle />
              </div>

              <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-8 sm:text-3xl dark:text-slate-50">
                Welcome back!
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                Enter to get unlimited access to data &amp; information.
              </p>

              <form className="mt-6 space-y-4 sm:mt-8" onSubmit={onSubmit}>
                <div>
                  <label
                    htmlFor="identifier"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Email or Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError("");
                      if (fieldErrors.identifier)
                        setFieldErrors((prev) => ({ ...prev, identifier: "" }));
                    }}
                    placeholder="Enter your email or username"
                    className={inputClass(Boolean(fieldErrors.identifier))}
                    autoComplete="username"
                    aria-invalid={Boolean(fieldErrors.identifier)}
                    aria-describedby={
                      fieldErrors.identifier ? "identifier-error" : undefined
                    }
                  />
                  {fieldErrors.identifier && (
                    <p
                      id="identifier-error"
                      className="mt-2 text-xs text-red-600 dark:text-red-300"
                    >
                      {fieldErrors.identifier}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                        if (fieldErrors.password)
                          setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      placeholder="Enter password"
                      type={showPassword ? "text" : "password"}
                      className={
                        inputClass(Boolean(fieldErrors.password)).replace(
                          "mt-2 ",
                          ""
                        ) + " pr-12"
                      }
                      autoComplete="current-password"
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password ? "password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="group absolute inset-y-0 right-0 flex items-center px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p
                      id="password-error"
                      className="mt-2 text-xs text-red-600 dark:text-red-300"
                    >
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {captchaRequired && (
                  <div>
                    <label
                      htmlFor="captchaAnswer"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Captcha
                    </label>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 break-words rounded-none border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                        {captchaQuestion || "Loading captcha…"}
                      </div>
                      <button
                        type="button"
                        onClick={ensureCaptcha}
                        className="shrink-0 self-start rounded-none border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:self-auto dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-900"
                        title="Refresh captcha"
                      >
                        ↻
                      </button>
                    </div>
                    <input
                      id="captchaAnswer"
                      name="captchaAnswer"
                      value={captchaAnswer}
                      onChange={(e) => {
                        setCaptchaAnswer(e.target.value);
                        if (error) setError("");
                        if (fieldErrors.captchaAnswer)
                          setFieldErrors((prev) => ({
                            ...prev,
                            captchaAnswer: "",
                          }));
                      }}
                      placeholder="Enter answer"
                      className={inputClass(
                        Boolean(fieldErrors.captchaAnswer)
                      ).replace("mt-2 ", "mt-3 ")}
                      inputMode="numeric"
                      aria-invalid={Boolean(fieldErrors.captchaAnswer)}
                      aria-describedby={
                        fieldErrors.captchaAnswer ? "captcha-error" : undefined
                      }
                    />
                    {fieldErrors.captchaAnswer && (
                      <p
                        id="captcha-error"
                        className="mt-2 text-xs text-red-600 dark:text-red-300"
                      >
                        {fieldErrors.captchaAnswer}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Captcha appears after 3 wrong attempts.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded-none border-slate-300 accent-indigo-600 focus:ring-indigo-600 dark:border-slate-600"
                    />
                    Remember me
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {error && (
                  <div
                    className="break-words rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit || busy}
                  className="w-full rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
                >
                  {busy ? "Logging in…" : "Log In"}
                </button>
              </form>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <img
              src={collegeImg}
              alt="College campus"
              className="h-full w-full object-cover filter saturate-110 contrast-110 brightness-105 dark:saturate-100 dark:contrast-125 dark:brightness-75"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
