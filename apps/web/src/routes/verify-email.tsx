import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/components/auth-error";
import { z } from "zod";
import { Button } from "@/components/button";

const verifyEmailSearchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search) => verifyEmailSearchSchema.parse(search),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.email) {
      setEmail(search.email);
    }
  }, [search.email]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      navigate({ to: "/login" });
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email is required to resend OTP");
      return;
    }

    setError("");
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

    // Show success message (could be a toast, but alert for now as per previous code)
    alert("A new OTP has been sent to your email!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h2 className="text-3xl font-bold text-gray-900">FormDrop</h2>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-semibold text-gray-900">
          Verify your email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border rounded-3xl border-gray-200 p-8">
          <div>
            <p className="text-sm text-gray-600 mb-6">
              We've sent a verification code to{" "}
              <strong>{email || "your email"}</strong>. Please check your inbox
              for the OTP.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {!search.email && (
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-4xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-4xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>

              <div>
                {error && (
                  <AuthError
                    message={error}
                    onDismiss={() => setError("")}
                    className="mb-4"
                  />
                )}
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6 || !email}
                  isLoading={loading}
                  variant="primary"
                  size="xl"
                  className="w-full bg-gray-900 hover:bg-gray-800 focus:ring-gray-900"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || !email}
                  variant="ghost"
                  size="sm"
                  className="text-gray-900 hover:underline hover:bg-transparent"
                >
                  Resend code
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
