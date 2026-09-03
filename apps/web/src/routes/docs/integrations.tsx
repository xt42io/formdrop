import { createFileRoute } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArtTile } from "@/components/docs/docs-art";
import {
  Message01Icon,
  Notification01Icon,
  TableIcon,
  WebhookIcon,
} from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/docs/integrations")({
  component: IntegrationsDocs,
});

function IntegrationsDocs() {
  return (
    <div className="max-w-3xl pb-20">
      <div className="mb-10">
        <h1 className="mb-4 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-950">
          Integrations & Notifications
        </h1>
        <p className="text-[17px] leading-relaxed text-ink-600">
          Connect your forms to the tools you use every day.
        </p>
      </div>

      <div className="max-w-none">
        <p>
          FormDrop separates external connections into{" "}
          <strong>Notifications</strong> (alerts) and{" "}
          <strong>Integrations</strong> (data sync).
        </p>

        <h2 className="mt-14 mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
          Notifications
        </h2>
        <p>
          Configure these in the <strong>Notifications</strong> tab of your
          form.
        </p>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-ink-200 p-6 transition-colors hover:border-accent-300 hover:bg-accent-50/30">
            <div className="flex items-center gap-4 mb-4">
              <ArtTile>
                <HugeiconsIcon icon={Notification01Icon} size={18} />
              </ArtTile>
              <h3 className="font-semibold text-lg">Email Notifications</h3>
            </div>
            <p className="text-sm leading-relaxed text-ink-600">
              Receive an email whenever a new submission is received. You can
              add multiple recipients.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-200 p-6 transition-colors hover:border-accent-300 hover:bg-accent-50/30">
            <div className="flex items-center gap-4 mb-4">
              <ArtTile>
                <HugeiconsIcon icon={Message01Icon} size={18} />
              </ArtTile>
              <h3 className="font-semibold text-lg">Slack & Discord</h3>
            </div>
            <p className="text-sm leading-relaxed text-ink-600">
              Send form submissions directly to a Slack channel or Discord
              server. Perfect for team notifications and support tickets.
            </p>
          </div>
        </div>

        <h2 className="mt-14 mb-4 text-xl font-semibold tracking-[-0.02em] text-ink-950">
          Integrations
        </h2>
        <p>
          Configure these in the <strong>Integrations</strong> tab of your form.
        </p>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-ink-200 p-6 transition-colors hover:border-accent-300 hover:bg-accent-50/30">
            <div className="flex items-center gap-4 mb-4">
              <ArtTile>
                <HugeiconsIcon icon={TableIcon} size={18} />
              </ArtTile>
              <h3 className="font-semibold text-lg">Google Sheets</h3>
            </div>
            <p className="text-sm leading-relaxed text-ink-600">
              Automatically sync every form submission to a Google Sheet in
              real-time.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <ArtTile>
                  <HugeiconsIcon icon={WebhookIcon} size={18} />
                </ArtTile>
                <h3 className="text-base font-semibold text-ink-500">
                  Webhooks
                </h3>
              </div>
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
                Coming Soon
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink-500">
              Send a JSON payload to any URL when a form is submitted. Connect
              with Zapier, Make, or your own backend.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <ArtTile>
                  <HugeiconsIcon icon={TableIcon} size={18} />
                </ArtTile>
                <h3 className="text-base font-semibold text-ink-500">
                  Airtable
                </h3>
              </div>
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
                Coming Soon
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink-500">
              Automatically sync form submissions to your Airtable base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
