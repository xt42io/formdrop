import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ApiArt,
  BoltArt,
  FormArt,
  GridPanel,
  IntegrationsArt,
  NotifyArt,
  RocketArt,
  SheetArt,
  ShieldArt,
} from "@/components/docs/docs-art";

export const Route = createFileRoute("/docs/")({
  component: DocsIndex,
});

/** Where to go next. These navigate. */
const SECTIONS = [
  {
    href: "/docs/getting-started",
    art: <RocketArt />,
    title: "Getting Started",
    body: "Point your form at one URL and collect your first submission in minutes.",
  },
  {
    href: "/docs/api",
    art: <ApiArt />,
    title: "API Reference",
    body: "Submit forms, list submissions and manage keys over the REST API.",
  },
  {
    href: "/docs/forms",
    art: <FormArt />,
    title: "Forms",
    body: "Configure fields, redirects, spam filtering and email notifications.",
  },
  {
    href: "/docs/integrations",
    art: <IntegrationsArt />,
    title: "Integrations",
    body: "Send submissions on to Slack, Discord, Google Sheets and webhooks.",
  },
] as const;

/** What you get. These do not navigate. */
const REASONS = [
  {
    art: <BoltArt />,
    title: "Zero Config",
    body: "Just point your form action to our endpoint and you're done. No server code required.",
  },
  {
    art: <ShieldArt />,
    title: "Spam Protection",
    body: "Built-in spam filtering and captcha support to keep your inbox clean.",
  },
  {
    art: <SheetArt />,
    title: "Integrations",
    body: "Connect with Slack, Discord, Google Sheets, and more via Webhooks.",
  },
  {
    art: <NotifyArt />,
    title: "Email Notifications",
    body: "Get notified instantly when someone submits your form.",
  },
] as const;

function DocsIndex() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <h1 className="text-[clamp(2rem,4.6vw,2.9rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-ink-950">
          Welcome to FormDrop
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink-600">
          The form backend for developers. Point your form at one URL —
          submissions land in a dashboard and a notification hits your inbox,
          Slack or Discord.
        </p>
      </div>

      <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2">
        {SECTIONS.map((card) => (
          <Link key={card.href} to={card.href} className="group block">
            <GridPanel>{card.art}</GridPanel>
            <h2 className="mt-5 font-semibold text-ink-950 transition-colors group-hover:text-accent-700">
              {card.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              {card.body}
            </p>
            <div className="mt-4 border-b border-accent-300/70" />
          </Link>
        ))}
      </div>

      <h2 className="mt-20 text-center text-xl font-semibold tracking-[-0.02em] text-ink-950">
        Why FormDrop?
      </h2>

      <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
        {REASONS.map((reason) => (
          <div key={reason.title}>
            <GridPanel>{reason.art}</GridPanel>
            <h3 className="mt-5 font-semibold text-ink-950">{reason.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              {reason.body}
            </p>
            <div className="mt-4 border-b border-accent-300/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
