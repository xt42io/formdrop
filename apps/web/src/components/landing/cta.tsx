import { Link } from "@tanstack/react-router";
import { Icon } from "@formdrop/ui";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";

/**
 * A light card on a plain ground. The card itself carries the hero's backdrop —
 * the 48px line field plus a trace of grain — with a soft clearing behind the
 * type so the copy sits on paper rather than on the ruling.
 */
export function CTA() {
  const { data: session } = authClient.useSession();

  return (
    <section className="px-6 py-24">
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-panel border border-ink-200 bg-white px-8 py-16 text-center sm:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-lines" />
          <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
          {/* keeps the type off the ruling, as on the hero */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(255,255,255,0.92)_40%,transparent_75%)]" />
        </div>

        <div className="relative">
          <h2 className="section-heading mx-auto max-w-md text-balance text-ink-950">
            Ready to get started?
          </h2>
          <p className="section-lede mx-auto mt-4 max-w-md text-ink-600">
            Join developers who are saving time with FormDrop. Start collecting
            submissions in minutes.
          </p>

          <Link
            to={session ? "/app/forms" : "/signup"}
            className="group mt-8 inline-flex items-center gap-1.5 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            {session ? "Go to Dashboard" : "Create Free Account"}
            <Icon
              icon={ArrowRight01Icon}
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
