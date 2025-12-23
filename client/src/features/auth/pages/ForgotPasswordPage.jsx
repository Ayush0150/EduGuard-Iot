import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import collegeImg from "../../../assets/college-img.png";
import eduGuardLogo from "../../../assets/eduGuard-logo.png";
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

  const canRequest = useMemo(() => email.trim().length > 3, [email]);
  const canVerify = useMemo(() => /^\d{6}$/.test(otp.trim()), [otp]);
  const canReset = useMemo(() => {
    if (!resetToken) return false;
    if (newPassword.length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [resetToken, newPassword, confirmPassword]);

  async function onRequestOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await requestResetOtp(email.trim());
      setInfo("If the email exists, an OTP was sent.");
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to request OTP");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const data = await verifyResetOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await resetPassword({ email: email.trim(), resetToken, newPassword });
      setInfo("Password updated successfully. You can now log in.");
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password");
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
    <div className="flex min-h-[100dvh] items-center bg-slate-100 p-4 sm:p-8 lg:p-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid w-full overflow-hidden rounded-none border border-slate-200 bg-white shadow-lg lg:min-h-[min(640px,calc(100dvh-6rem))] lg:grid-cols-2">
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <EduGuardMark />

              <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-8 sm:text-3xl">
                Forgot password
              </h1>
              <p className="mt-2 text-sm text-slate-500">
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
                        : "border-slate-300 bg-white text-slate-500";
                    const labelClass =
                      done || current ? "text-slate-700" : "text-slate-500";
                    const connectorClass =
                      visualStep > s.id ? "bg-indigo-200" : "bg-slate-200";

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
                  <p className="mt-2 text-xs text-slate-500">
                    Completed. You can now log in.
                  </p>
                )}
              </div>

              {error && (
                <div
                  className="mt-6 rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
              {info && (
                <div
                  className="mt-6 rounded-none border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700"
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
                      className="text-xs font-semibold text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="mt-2 w-full rounded-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0 focus-visible:outline-none"
                      autoComplete="email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!canRequest || busy}
                    className="w-full rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Sending…" : "Send OTP"}
                  </button>
                  <Link
                    to="/login"
                    className="block text-center text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
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
                      className="text-xs font-semibold text-slate-700"
                    >
                      OTP
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="mt-2 w-full rounded-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0 focus-visible:outline-none"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      OTP expires in 10 minutes.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={!canVerify || busy}
                    className="w-full rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Verifying…" : "Verify OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full rounded-none border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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
                      className="text-xs font-semibold text-slate-700"
                    >
                      New password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      type="password"
                      className="mt-2 w-full rounded-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0 focus-visible:outline-none"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      type="password"
                      className="mt-2 w-full rounded-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0 focus-visible:outline-none"
                      autoComplete="new-password"
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-2 text-xs text-red-600">
                        Passwords do not match.
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!canReset || busy}
                    className="w-full rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Updating…" : "Reset password"}
                  </button>
                </form>
              )}

              {step === 4 && (
                <div className="mt-8 sm:mt-10">
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-none bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
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
              className="h-full w-full object-cover filter saturate-110 contrast-110 brightness-105"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
