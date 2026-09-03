import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { capture } from "@formdrop/analytics";
import { AuthError } from "@/components/auth-error";
import { z } from "zod";

const verifyEmailSearchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search) => verifyEmailSearchSchema.parse(search),
  component: RouteComponent,
});

// Kept in step with the same pair on /login and /signup.
const FIELD =
  "block w-full appearance-none rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-900 placeholder-ink-400 transition-colors focus:border-accent-400 focus:bg-white focus:ring-4 focus:ring-accent-500/15 focus:outline-none";

function RouteComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.email) {
      setEmail(search.email);
    }
  }, [search.email]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const { data, error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });

    setLoading(false);

    if (verifyError) {
      setError(
        verifyError.message || "Invalid or expired OTP. Please try again.",
      );
      console.error("OTP verification error:", verifyError);
      return;
    }

    if (data) {
      capture("email_verified");
      navigate({ to: "/login" });
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email is required to resend OTP");
      return;
    }

    setError("");
    setNotice("");
    setLoading(true);

    const { error: resendError } =
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

    setLoading(false);

    if (resendError) {
      setError(
        resendError.message || "Failed to resend OTP. Please try again.",
      );
      console.error("Resend OTP error:", resendError);
      return;
    }

    setNotice("A new OTP has been sent to your email!");
  };

  return (
    <div className="h-screen overflow-hidden">
      {/* the page itself never scrolls; only this column does, and only
          when the form is taller than the viewport */}
      <div className="relative isolate flex h-full flex-col overflow-y-auto overscroll-contain bg-white px-6 pt-12 pb-16 lg:pt-28">
        {/* the marketing pages' backdrop, so verifying doesn't feel like a
            different product */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] overflow-hidden"
        >
          <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,#000_0%,#000_45%,transparent_92%)]" />
          <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
        </div>

        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2">
            <img src="/purple_icon.svg" alt="" className="w-7" />
            <span className="text-lg font-semibold tracking-tight text-ink-950">
              FormDrop
            </span>
          </Link>

          <h1 className="mt-8 text-center text-2xl font-semibold tracking-[-0.02em] text-ink-950">
            Verify your email
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-ink-600">
            We've sent a verification code to{" "}
            <strong className="font-semibold text-ink-900">
              {email || "your email"}
            </strong>
            . Please check your inbox for the OTP.
          </p>

          <div className="mt-8">
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {!search.email && (
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ink-700"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`mt-1.5 ${FIELD}`}
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-ink-700"
                >
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`mt-1.5 ${FIELD} text-center font-mono text-xl tracking-[0.4em]`}
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </div>

              <div>
                {error && (
                  <AuthError
                    message={error}
                    onDismiss={() => setError("")}
                    className="mb-4"
                  />
                )}
                {notice && (
                  <p className="mb-4 rounded-xl border border-accent-200 bg-accent-50 px-3.5 py-2.5 text-sm text-accent-800">
                    {notice}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || !email}
                  className="w-full rounded-xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </div>

              <p className="text-center text-sm text-ink-600">
                Didn't get it?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || !email}
                  className="font-semibold text-accent-700 transition-colors hover:text-accent-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Resend code
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
