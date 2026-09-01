import { createFileRoute } from "@tanstack/react-router";
import { Bell, MessageSquare, Table, Webhook } from "lucide-react";

export const Route = createFileRoute("/docs/integrations")({
  component: IntegrationsDocs,
});

function IntegrationsDocs() {
  return (
    <div className="max-w-3xl pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Integrations & Notifications
        </h1>
        <p className="text-xl text-gray-600">
          Connect your forms to the tools you use every day.
        </p>
      </div>

      <div className="prose prose-gray max-w-none">
        <p>
          FormDrop separates external connections into <strong>Notifications</strong> (alerts) and <strong>Integrations</strong> (data sync).
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Notifications</h2>
        <p>
            Configure these in the <strong>Notifications</strong> tab of your form.
        </p>

        <div className="grid gap-6 not-prose mt-8">
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-accent/20 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                <Bell size={20} />
              </div>
              <h3 className="font-semibold text-lg">Email Notifications</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Receive an email whenever a new submission is received. You can
              add multiple recipients.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-accent/20 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-semibold text-lg">Slack & Discord</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Send form submissions directly to a Slack channel or Discord server.
              Perfect for team notifications and support tickets.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Integrations</h2>
        <p>
            Configure these in the <strong>Integrations</strong> tab of your form.
        </p>

        <div className="grid gap-6 not-prose mt-8">
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-accent/20 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                <Table size={20} />
              </div>
              <h3 className="font-semibold text-lg">Google Sheets</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Automatically sync every form submission to a Google Sheet in real-time.
            </p>
          </div>
        </div>
        
        <div className="grid gap-6 not-prose mt-8">
          <div className="p-6 rounded-xl border border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Webhook size={20} />
                </div>
                <h3 className="font-semibold text-lg text-gray-500">Webhooks</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                Coming Soon
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Send a JSON payload to any URL when a form is submitted. Connect with Zapier, Make, or your own backend.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                  <Table size={20} />
                </div>
                <h3 className="font-semibold text-lg text-gray-500">Airtable</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                Coming Soon
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Automatically sync form submissions to your Airtable base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
