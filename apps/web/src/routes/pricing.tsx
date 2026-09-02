import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { capture } from "@formdrop/analytics";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const freeFeatures = [
  { label: "Unlimited Submissions", included: true },
  { label: "Unlimited Forms", included: true },
  { label: "Email Notifications", included: true },
  { label: "Custom Redirects", included: true },
  { label: "Integrations", included: false },
  { label: "Basic Analytics", included: true },
  { label: "Slack & Discord Notifications", included: false },
  { label: "1,000 Row Exports", included: true },
];

const proFeatures = [
  "Unlimited submissions",
  "Unlimited Forms",
  "Email, Slack & Discord Notifications",
  "Integrations",
  "Custom Redirects",
  "Advanced Analytics",
  "Unlimited Row Exports",
  "Monthly & Weekly Reports",
  "Priority Support",
];

function PricingPage() {
  const { data: session } = authClient.useSession();
  const [isAnnual, setIsAnnual] = useState(true);

  useEffect(() => {
    capture("pricing_viewed");
  }, []);

  return (
    <div className="relative isolate min-h-screen bg-white">
      {/* the landing page's own backdrop, so the two surfaces match */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] overflow-hidden"
      >
        <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,#000_0%,#000_55%,transparent_95%)]" />
        <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
      </div>

      <Navbar />

      <main className="px-6 pt-16 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-[clamp(1.9rem,4vw,2.9rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-950">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink-600">
            Start for free, upgrade when you need more power. No hidden fees.
          </p>

          <div className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-1.5">
            <span
              className={`px-3 text-sm font-medium transition-colors ${
                !isAnnual ? "text-ink-950" : "text-ink-400"
              }`}
            >
              Monthly
            </span>

            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              aria-label="Toggle billing cycle"
              className="relative h-7 w-12 shrink-0 rounded-full bg-ink-200 transition-colors"
            >
              <span
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform duration-300 ${
                  isAnnual ? "translate-x-5" : ""
                }`}
              />
            </button>

            <span
              className={`px-3 text-sm font-medium transition-colors ${
                isAnnual ? "text-ink-950" : "text-ink-400"
              }`}
            >
              Annual{" "}
              <span className="font-semibold text-accent-700">(Save 17%)</span>
            </span>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-panel border border-ink-200 bg-white p-8">
            <h3 className="text-lg font-semibold text-ink-950">Free</h3>
            <p className="mt-1 text-sm text-ink-500">
              Perfect for side projects
            </p>

            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-[-0.03em] text-ink-950">
                $0
              </span>
              <span className="text-sm text-ink-500">/month</span>
            </p>

            <Link
              to={session ? "/app/forms" : "/signup"}
              className="mt-7 rounded-lg bg-ink-100 px-5 py-2.5 text-center text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-200"
            >
              Get Started
            </Link>

            <ul className="mt-8 flex flex-1 flex-col gap-3 border-t border-ink-100 pt-7">
              {freeFeatures.map((feature) => (
                <li key={feature.label} className="flex items-start gap-2.5">
                  <HugeiconsIcon
                    icon={feature.included ? Tick02Icon : Cancel01Icon}
                    size={17}
                    className={`mt-0.5 shrink-0 ${
                      feature.included ? "text-accent-600" : "text-ink-300"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      feature.included
                        ? "text-ink-700"
                        : "text-ink-400 line-through"
                    }`}
                  >
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col overflow-hidden rounded-panel bg-ink-950 p-8">
            <span className="absolute top-0 right-0 rounded-bl-xl bg-accent-500 px-3 py-1 text-[11px] font-bold tracking-wide text-white">
              POPULAR
            </span>

            <h3 className="text-lg font-semibold text-white">Pro</h3>
            <p className="mt-1 text-sm text-ink-400">For serious businesses</p>

            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-[-0.03em] text-white">
                ${isAnnual ? "24" : "29"}
              </span>
              <span className="text-sm text-ink-400">/month</span>
            </p>
            {isAnnual && (
              <p className="mt-1.5 text-xs text-accent-300">
                Billed $288 yearly
              </p>
            )}

            <Link
              to={session ? "/app/settings" : "/signup"}
              search={session ? { tab: "billing" } : undefined}
              className="mt-7 rounded-lg bg-accent-500 px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-600"
            >
              Upgrade to Pro
            </Link>

            <ul className="mt-8 flex flex-1 flex-col gap-3 border-t border-white/10 pt-7">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={17}
                    className="mt-0.5 shrink-0 text-accent-300"
                  />
                  <span className="text-sm text-ink-200">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
