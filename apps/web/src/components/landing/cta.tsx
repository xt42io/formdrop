import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRightDoubleIcon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";

export function CTA() {
  const { data: session } = authClient.useSession();

  return (
    <div className="py-20 px-6">
      <div className="max-w-5xl mx-auto bg-gray-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-accent/20 via-gray-900 to-gray-900 opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join developers who are saving time with FormDrop. Start collecting
            submissions in minutes.
          </p>
          <Link
            to={session ? "/app/forms" : "/signup"}
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-medium text-lg hover:bg-gray-100 transition-colors"
          >
            {session ? "Go to Dashboard" : "Create Free Account"}
            <HugeiconsIcon icon={ArrowRightDoubleIcon} />
          </Link>
        </div>
      </div>
    </div>
  );
}
