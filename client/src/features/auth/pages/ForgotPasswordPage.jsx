import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import collegeImg from "../../../assets/college-img.png";
import eduGuardLogo from "../../../assets/eduGuard-logo.png";
import ThemeToggle from "../../../core/theme/ThemeToggle";
import { requestResetOtp, resetPassword, verifyResetOtp } from "../api/authApi";

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

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const inputBaseClass =
    "mt-2 w-full rounded-none border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-offset-0 focus-visible:outline-none dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

  const inputClass = (hasError) =>
    `${inputBaseClass} ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-900/60"
        : "border-slate-200 focus:border-indigo-600 focus:ring-indigo-600 dark:border-slate-700"
    }`;

  const emailOk = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  const passwordRules = useMemo(() => {
    const pwd = newPassword;
    return {
      min: pwd.length >= 8,
      lower: /[a-z]/.test(pwd),
      upper: /[A-Z]/.test(pwd),
      number: /\d/.test(pwd),
      symbol: /[^A-Za-z0-9]/.test(pwd),
    };
  }, [newPassword]);

  const passwordStrong = useMemo(
    () => Object.values(passwordRules).every(Boolean),
    [passwordRules]
  );

  const canRequest = useMemo(() => emailOk, [emailOk]);
  const canVerify = useMemo(() => /^\d{6}$/.test(otp.trim()), [otp]);
  const canReset = useMemo(() => {
    if (!resetToken) return false;
    if (!passwordStrong) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [resetToken, passwordStrong, newPassword, confirmPassword]);

  function applyServerFieldErrors(err) {
    const serverErrors = err?.response?.data?.errors;
    if (!Array.isArray(serverErrors) || !serverErrors.length) return false;

    const nextFieldErrors = {};
    for (const item of serverErrors) {
      const key = Array.isArray(item?.path) ? item.path[0] : item?.path;
      if (typeof key === "string" && !nextFieldErrors[key]) {
        nextFieldErrors[key] = item?.message;
      }
    }

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      return true;
    }

    return false;
  }

  async function onRequestOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setFieldErrors({});

    if (!emailOk) {
      setFieldErrors({ email: "Enter a valid email." });
      return;
    }

    setBusy(true);
    try {
      await requestResetOtp(email.trim());
      setInfo("If the email exists, an OTP was sent.");
      setStep(2);
    } catch (err) {
      const mapped = applyServerFieldErrors(err);
      if (!mapped) {
        const firstFieldError = err?.response?.data?.errors?.[0]?.message;
        setError(
          firstFieldError ||
            err?.response?.data?.message ||
            "Failed to request OTP"
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setFieldErrors({});

    if (!emailOk) {
      setFieldErrors({ email: "Enter a valid email." });
      return;
    }
    if (!canVerify) {
      setFieldErrors({ otp: "OTP must be 6 digits." });
      return;
    }

    setBusy(true);
    try {
      const data = await verifyResetOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      const mapped = applyServerFieldErrors(err);
      if (!mapped) {
        const firstFieldError = err?.response?.data?.errors?.[0]?.message;
        setError(
          firstFieldError || err?.response?.data?.message || "Invalid OTP"
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setFieldErrors({});

    if (!emailOk) {
      setFieldErrors({ email: "Enter a valid email." });
      return;
    }
    if (!resetToken) {
      setError("Reset token is missing. Please verify OTP again.");
      return;
    }
    if (!passwordRules.min) {
      setFieldErrors({
        newPassword: "Password must be at least 8 characters.",
      });
      return;
    }
    if (!passwordRules.lower) {
      setFieldErrors({
        newPassword: "Password must include a lowercase letter.",
      });
      return;
    }
    if (!passwordRules.upper) {
      setFieldErrors({
        newPassword: "Password must include an uppercase letter.",
      });
      return;
    }
    if (!passwordRules.number) {
      setFieldErrors({ newPassword: "Password must include a number." });
      return;
    }
    if (!passwordRules.symbol) {
      setFieldErrors({ newPassword: "Password must include a symbol." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setBusy(true);
    try {
      await resetPassword({ email: email.trim(), resetToken, newPassword });
      setInfo("Password updated successfully. You can now log in.");
      setStep(4);
    } catch (err) {
      const mapped = applyServerFieldErrors(err);
      if (!mapped) {
        const firstFieldError = err?.response?.data?.errors?.[0]?.message;
        setError(
          firstFieldError ||
            err?.response?.data?.message ||
            "Failed to reset password"
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const visualStep = step === 4 ? 3 : step;
  const steps = [
    { id: 1, label: "Email" },
    { id: 2, label: "OTP" },
    { id: 3, label: "New password" },
  ];

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
                Forgot password
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                Reset using an email OTP.
              </p>

              <div className="mt-6">
                <div
                  className="flex flex-col gap-3 sm:flex-row sm:items-center"
                  aria-label="Reset steps"
                >
                  {steps.map((s, idx) => {
                    const done = visualStep > s.id;
                    const current = visualStep === s.id;
                    const circleClass =
                      done || current
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400";
                    const labelClass =
                      done || current
                        ? "text-slate-700 dark:text-slate-200"
                        : "text-slate-500 dark:text-slate-400";
                    const connectorClass =
                      visualStep > s.id
                        ? "bg-indigo-200 dark:bg-indigo-900/40"
                        : "bg-slate-200 dark:bg-slate-800";

                    return (
                      <div key={s.id} className="flex items-center sm:flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-none border text-[11px] font-semibold ${circleClass}`}
                            aria-current={current ? "step" : undefined}
                          >
                            {s.id}
                          </div>
                          <span
                            className={`text-xs font-semibold ${labelClass}`}
                          >
                            {s.label}
                          </span>
                        </div>

                        {idx !== steps.length - 1 && (
                          <div
                            className={`mx-3 hidden h-px flex-1 sm:block ${connectorClass}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {step === 4 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Completed. You can now log in.
                  </p>
                )}
              </div>

              {error && (
                <div
                  className="mt-6 break-words rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
              {info && (
                <div
                  className="mt-6 break-words rounded-none border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200"
                  role="status"
                  aria-live="polite"
                >
                  {info}
                </div>
              )}

              {step === 1 && (
                <form
                  className="mt-6 space-y-4 sm:mt-8"
                  onSubmit={onRequestOtp}
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                        if (fieldErrors.email)
                          setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="Enter your registered email"
                      className={inputClass(Boolean(fieldErrors.email))}
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? "email-error" : undefined
                      }
                    />
                    {fieldErrors.email && (
                      <p
                        id="email-error"
                        className="mt-2 text-xs text-red-600 dark:text-red-300"
                      >
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!canRequest || busy}
                    className="w-full rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
                  >
                    {busy ? "Sending…" : "Send OTP"}
                  </button>
                  <Link
                    to="/login"
                    className="block text-center text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Back to login
                  </Link>
                </form>
              )}

              {step === 2 && (
                <form className="mt-6 space-y-4 sm:mt-8" onSubmit={onVerifyOtp}>
                  <div>
                    <label
                      htmlFor="otp"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      OTP
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        if (error) setError("");
                        if (fieldErrors.otp)
                          setFieldErrors((prev) => ({ ...prev, otp: "" }));
                      }}
                      placeholder="Enter 6-digit OTP"
                      className={inputClass(Boolean(fieldErrors.otp))}
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      aria-invalid={Boolean(fieldErrors.otp)}
                      aria-describedby={
                        fieldErrors.otp ? "otp-error" : undefined
                      }
                    />
                    {fieldErrors.otp && (
                      <p
                        id="otp-error"
                        className="mt-2 text-xs text-red-600 dark:text-red-300"
                      >
                        {fieldErrors.otp}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      OTP expires in 10 minutes.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={!canVerify || busy}
                    className="w-full rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
                  >
                    {busy ? "Verifying…" : "Verify OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full rounded-none border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus-visible:ring-offset-slate-900"
                  >
                    Change email
                  </button>
                </form>
              )}

              {step === 3 && (
                <form className="mt-6 space-y-4 sm:mt-8" onSubmit={onReset}>
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      New password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError("");
                        if (fieldErrors.newPassword)
                          setFieldErrors((prev) => ({
                            ...prev,
                            newPassword: "",
                          }));
                      }}
                      placeholder="Use a strong password"
                      type="password"
                      className={inputClass(Boolean(fieldErrors.newPassword))}
                      autoComplete="new-password"
                      aria-invalid={Boolean(fieldErrors.newPassword)}
                      aria-describedby={
                        fieldErrors.newPassword
                          ? "newPassword-error"
                          : "newPassword-help"
                      }
                    />
                    {fieldErrors.newPassword ? (
                      <p
                        id="newPassword-error"
                        className="mt-2 text-xs text-red-600 dark:text-red-300"
                      >
                        {fieldErrors.newPassword}
                      </p>
                    ) : (
                      <p
                        id="newPassword-help"
                        className="mt-2 text-xs text-slate-500 dark:text-slate-400"
                      >
                        Must include: 8+ chars, uppercase, lowercase, number,
                        symbol.
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                        if (fieldErrors.confirmPassword)
                          setFieldErrors((prev) => ({
                            ...prev,
                            confirmPassword: "",
                          }));
                      }}
                      placeholder="Re-enter new password"
                      type="password"
                      className={inputClass(
                        Boolean(fieldErrors.confirmPassword)
                      )}
                      autoComplete="new-password"
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={
                        fieldErrors.confirmPassword
                          ? "confirmPassword-error"
                          : undefined
                      }
                    />
                    {fieldErrors.confirmPassword && (
                      <p
                        id="confirmPassword-error"
                        className="mt-2 text-xs text-red-600 dark:text-red-300"
                      >
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                    {!fieldErrors.confirmPassword &&
                      confirmPassword &&
                      confirmPassword !== newPassword && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-300">
                          Passwords do not match.
                        </p>
                      )}
                  </div>
                  <button
                    type="submit"
                    disabled={!canReset || busy}
                    className="w-full rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
                  >
                    {busy ? "Updating…" : "Reset password"}
                  </button>
                </form>
              )}

              {step === 4 && (
                <div className="mt-8 sm:mt-10">
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                  >
                    Go to login
                  </Link>
                </div>
              )}
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
