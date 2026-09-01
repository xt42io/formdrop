import {
  createFileRoute,
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
import { Button } from "@/components/button";

export const Route = createFileRoute("/verify-recipient")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || "",
    };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [message, setMessage] = useState("");

  const { token } = useSearch({ from: "/verify-recipient" });

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
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-md p-8">
        {status === "loading" && (
          <div className="text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              <HugeiconsIcon
                icon={Loading03Icon}
                size={48}
                className="text-gray-400 animate-spin"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your email...
            </h1>
            <p className="text-gray-500">Please wait a moment</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
              <HugeiconsIcon
                icon={Tick02Icon}
                size={48}
                className="text-green-600"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Button
              onClick={() => navigate({ to: "/" })}
              variant="primary"
              size="lg"
              className="rounded-xl"
            >
              Go to Homepage
            </Button>
          </div>
        )}

        {(status === "error" || status === "expired") && (
          <div className="text-center">
            <div className="inline-flex p-4 bg-red-100 rounded-full mb-4">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={48}
                className="text-red-600"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === "expired" ? "Link Expired" : "Verification Failed"}
            </h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Button
              onClick={() => navigate({ to: "/" })}
              variant="secondary"
              size="lg"
              className="rounded-xl bg-gray-100 border-transparent"
            >
              Go to Homepage
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
