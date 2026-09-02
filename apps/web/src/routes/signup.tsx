import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/components/auth-error";

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
});

// Kept in step with the same pair on /login.
const FIELD =
  "block w-full appearance-none rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-400 transition-colors focus:border-accent-400 focus:ring-2 focus:ring-accent-500/25 focus:outline-none";
const SOCIAL =
  "flex w-full items-center justify-center gap-2.5 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50";

function RouteComponent() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || "Signup failed. Please try again.");
      console.error("Signup error:", signUpError);
      return;
    }

    if (data) {
      navigate({ to: "/verify-email", search: { email } });
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);

    const { error: socialError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/app/forms",
    });

    setLoading(false);

    if (socialError) {
      setError(socialError.message || "Google signup failed");
      console.error("Google signup error:", socialError);
    }
  };

  const handleGithubSignup = async () => {
    setError("");
    setLoading(true);

    const { error: socialError } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/app/forms",
    });

    setLoading(false);

    if (socialError) {
      setError(socialError.message || "GitHub signup failed");
      console.error("GitHub signup error:", socialError);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col justify-center bg-white px-6 py-12">
      {/* the marketing pages' backdrop, so signing up doesn't feel like a
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
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-ink-600">
          Or{" "}
          <Link
            to="/login"
            className="font-semibold text-accent-700 hover:text-accent-800"
          >
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-md">
        <div className="rounded-panel border border-ink-200 bg-white p-8">
          {/* Social Signup Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className={SOCIAL}
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleGithubSignup}
              disabled={loading}
              className={SOCIAL}
            >
              <svg
                className="h-4.5 w-4.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-ink-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-ink-700"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1.5 ${FIELD}`}
                placeholder="John Doe"
              />
            </div>

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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1.5 ${FIELD}`}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-ink-700"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-1.5 ${FIELD}`}
                placeholder="••••••••"
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
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>

            <p className="text-center text-xs leading-relaxed text-ink-500">
              By signing up, you agree to our{" "}
              <a
                href="/terms"
                className="font-semibold text-accent-700 hover:text-accent-800"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="font-semibold text-accent-700 hover:text-accent-800"
              >
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
