import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  AlertCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/(marketing)/verify-recipient")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || "",
    };
  },
});

type Status = "loading" | "success" | "error" | "expired";

/**
 * One entry per outcome, so the page is a single block of markup rather than
 * four near-identical copies of it. Tints reuse the literals the landing page
 * already uses for the same meanings.
 */
const STATES: Record<
  Status,
  { icon: typeof Tick02Icon; tint: string; title: string }
> = {
  loading: {
    icon: Loading03Icon,
    tint: "bg-ink-100 text-ink-400",
    title: "Verifying your email...",
  },
  success: {
    icon: Tick02Icon,
    tint: "bg-[#cdf0dd] text-[#1f6b45]",
    title: "Email Verified!",
  },
  error: {
    icon: AlertCircleIcon,
    tint: "bg-[#fde3dd] text-[#b4341f]",
    title: "Verification Failed",
  },
  expired: {
    icon: AlertCircleIcon,
    tint: "bg-[#ffeac0] text-[#8a5a00]",
    title: "Link Expired",
  },
};

function RouteComponent() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  const { token } = useSearch({ from: "/(marketing)/verify-recipient" });

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing");
        return;
      }

      try {
        const response = await fetch(
          `/api/verify-recipient?token=${encodeURIComponent(token)}`,
        );
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(
            "Your email has been verified! You will now receive notifications for new submissions.",
          );
        } else {
          if (data.error?.includes("expired")) {
            setStatus("expired");
            setMessage(
              "This verification link has expired. Please ask the form owner to resend the invitation.",
            );
          } else {
            setStatus("error");
            setMessage(data.error || "Verification failed");
          }
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [token]);

  const state = STATES[status];

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 py-16">
      {/* the marketing pages' backdrop — a recipient arriving from an email
          should land somewhere that looks like the product */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] overflow-hidden"
      >
        <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,#000_0%,#000_45%,transparent_92%)]" />
        <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
      </div>

      <Link to="/" className="flex items-center gap-2">
        <img src="/purple_icon.svg" alt="" className="w-7" />
        <span className="text-lg font-semibold tracking-tight text-ink-950">
          FormDrop
        </span>
      </Link>

      <div className="mt-9 w-full max-w-md rounded-panel border border-ink-200 bg-white p-8 text-center">
        <span
          className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${state.tint}`}
        >
          <HugeiconsIcon
            icon={state.icon}
            size={26}
            className={status === "loading" ? "animate-spin" : undefined}
          />
        </span>

        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          {state.title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          {status === "loading" ? "Please wait a moment" : message}
        </p>

        {status !== "loading" && (
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className={`mt-7 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
              status === "success"
                ? "bg-accent-500 text-white hover:bg-accent-600"
                : "bg-ink-100 text-ink-900 hover:bg-ink-200"
            }`}
          >
            Go to Homepage
          </button>
        )}
      </div>
    </div>
  );
}
