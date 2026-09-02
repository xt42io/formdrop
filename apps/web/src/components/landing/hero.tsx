import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { SubmissionFlow } from "./submission-flow";
import { RotatingWord } from "./rotating-word";
import { capture } from "@formdrop/analytics";

export function Hero() {
  const { data: session } = authClient.useSession();

  return (
    <section className="relative pt-10 pb-20 sm:pt-14">
      <div className="animate-enter relative mx-auto max-w-4xl px-6 text-center">
        {/* segmented chip: the disclaimer on the left, the thing it disclaims
            on the right, so the joke lands on the logo */}
        <div className="inline-flex items-center gap-2 rounded-2xl border border-ink-200/80 bg-white/80 p-1 pl-3 text-xs backdrop-blur-sm">
          <span className="font-medium text-ink-500">Not backed by</span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink-950 py-1 pr-2.5 pl-1 font-semibold text-white">
            <img
              src="/yc.jpeg"
              alt=""
              className="h-4 w-4 rounded-md object-cover"
            />
            Y Combinator
          </span>
        </div>

        <h1 className="mt-7 text-[clamp(1.9rem,6.4vw,4.5rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-ink-950 sm:tracking-[-0.04em]">
          <span className="flex flex-wrap items-center justify-center gap-x-[0.22em]">
            The <RotatingWord /> form
          </span>
          <span className="block">backend for developers</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
          Point your form at one URL. Submissions land in a dashboard and a
          notification hits your inbox, Slack or Discord &mdash; no backend to
          write.
        </p>

        <div className="mx-auto mt-9 w-full max-w-sm rounded-3xl border border-ink-200/70 bg-white/60 p-2 backdrop-blur-sm">
          <Link
            to={session ? "/app/forms" : "/signup"}
            onClick={() => capture("hero_cta_clicked")}
            className="group flex items-center justify-center gap-1.5 rounded-2xl bg-accent-500 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-600"
          >
            {session ? "Go to dashboard" : "Start for free"}
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <p className="py-2.5 text-center text-xs text-ink-500">
            Free plan &middot; unlimited forms and submissions &middot; no card
            required
          </p>
        </div>
      </div>

      <div className="animate-enter-late relative">
        <SubmissionFlow />
      </div>
    </section>
  );
}
