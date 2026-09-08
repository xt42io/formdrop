import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Discord, Slack } from "@ridemountainpig/svgl-react";
import moment from "moment";
import { Tooltip } from "@formdrop/ui";
import type { Form } from "@/lib/app-client";

/**
 * The forms list as a dense table (W4 section 4.5: "Cards become a dense
 * table -- last-7-day sparkline, submission count, integration status pills").
 *
 * A table rather than a grid of cards because the useful comparison here is
 * between forms: which is busy, which has gone quiet, which is not wired up.
 * Cards put one form per row's worth of vertical space and made that
 * comparison impossible without scrolling.
 */

/**
 * A seven-point sparkline drawn as an inline SVG.
 *
 * No charting library: this is seven numbers and a polyline, and Recharts
 * would ship a renderer per row. The viewBox is fixed and the path is scaled
 * into it, so the SVG can be sized entirely by CSS.
 */
function Sparkline({ series }: { series: Form["recentUsage"] }) {
  const points = series ?? [];
  const peak = Math.max(1, ...points.map((p) => p.count));

  if (points.length === 0) {
    return <div className="h-8 w-24" aria-hidden />;
  }

  const W = 96;
  const H = 32;
  const step = points.length > 1 ? W / (points.length - 1) : W;
  const y = (count: number) => H - 2 - (count / peak) * (H - 6);
  const line = points.map((p, i) => `${i * step},${y(p.count)}`).join(" ");
  const total = points.reduce((n, p) => n + p.count, 0);

  return (
    <Tooltip
      content={`${total.toLocaleString()} in the last ${points.length} days`}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-8 w-24 overflow-visible"
        role="img"
        aria-label={`${total} submissions in the last ${points.length} days`}
        preserveAspectRatio="none"
      >
        {/* Filled area first, so the stroke sits on top of its own edge. */}
        <polygon
          points={`0,${H} ${line} ${W},${H}`}
          className="fill-accent-500/10"
        />
        <polyline
          points={line}
          fill="none"
          className="stroke-accent-500"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </Tooltip>
  );
}

/** Which channels a form actually delivers to, as pills. */
function IntegrationPills({ form }: { form: Form }) {
  const active = [
    form.emailNotificationsEnabled && { key: "email", label: "Email" },
    form.slackConnected &&
      form.slackNotificationsEnabled && { key: "slack", label: "Slack" },
    form.discordConnected &&
      form.discordNotificationsEnabled && { key: "discord", label: "Discord" },
    form.googleSheetsConnected &&
      form.googleSheetsEnabled && { key: "sheets", label: "Sheets" },
  ].filter(Boolean) as { key: string; label: string }[];

  if (active.length === 0) {
    return (
      <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500">
        No notifications
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {active.map((channel) => (
        <span
          key={channel.key}
          className="inline-flex items-center gap-1 rounded-full bg-tint-green px-2.5 py-1 text-xs font-medium text-tint-green-ink"
        >
          {channel.key === "slack" ? (
            <Slack className="size-3" />
          ) : channel.key === "discord" ? (
            <Discord className="size-3" />
          ) : (
            <HugeiconsIcon icon={Tick02Icon} size={12} />
          )}
          {channel.label}
        </span>
      ))}
    </div>
  );
}

export function FormsTable({ forms }: { forms: Form[] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/60">
              <th
                scope="col"
                className="px-5 py-3 text-xs font-medium tracking-wide text-ink-500 uppercase"
              >
                Form
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-xs font-medium tracking-wide text-ink-500 uppercase"
              >
                Last 7 days
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-right text-xs font-medium tracking-wide text-ink-500 uppercase"
              >
                Submissions
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-xs font-medium tracking-wide text-ink-500 uppercase"
              >
                Delivering to
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-xs font-medium tracking-wide text-ink-500 uppercase"
              >
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {forms.map((form) => (
              <tr
                key={form.id}
                className="group transition-colors hover:bg-accent-500/4"
              >
                <td className="px-5 py-4">
                  {/* The link covers the name rather than the row: a row-wide
                      anchor cannot contain the tooltip triggers beside it. */}
                  <Link
                    to="/app/forms/$id/submissions"
                    params={{ id: form.id }}
                    className="rounded-sm font-medium text-ink-950 transition-colors group-hover:text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
                  >
                    {form.name}
                  </Link>
                  <div className="mt-0.5 font-mono text-xs text-ink-400">
                    /f/{form.slug}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Sparkline series={form.recentUsage} />
                </td>
                <td className="px-5 py-4 text-right text-sm font-medium text-ink-950 tabular-nums">
                  {(form.submissionCount ?? 0).toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <IntegrationPills form={form} />
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-ink-500">
                  {moment(form.createdAt).format("MMM D, YYYY")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
