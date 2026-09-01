import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Zap, ShieldCheck, Workflow, Bell } from "lucide-react";

export const Route = createFileRoute("/docs/")({
  component: DocsIndex,
});

function DocsIndex() {
  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Introduction
        </h1>
        <p className="text-xl text-gray-600">
          Welcome to the FormDrop documentation. Learn how to create, manage, and
          integrate forms into your applications in minutes.
        </p>
      </div>

      <div className="prose prose-gray max-w-none">
        <p>
          FormDrop is a powerful form backend service that handles form
          submissions, email notifications, and integrations, so you can focus
          on building your frontend.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-6">Why FormDrop?</h2>
        <div className="grid sm:grid-cols-2 gap-4 not-prose mb-12">
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-accent/20 transition-colors">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              <Zap size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Zero Config</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Just point your form action to our endpoint and you're done. No
              server code required.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-accent/20 transition-colors">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Spam Protection</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Built-in spam filtering and captcha support to keep your inbox
              clean.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-accent/20 transition-colors">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4">
              <Workflow size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Integrations</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Connect with Slack, Discord, Google Sheets, and more via Webhooks.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-accent/20 transition-colors">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 mb-4">
              <Bell size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Email Notifications</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Get notified instantly when someone submits your form.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Next Steps</h2>
        <div className="not-prose">
          <Link
            to="/docs/getting-started"
            className="inline-flex items-center gap-2 text-accent font-medium hover:underline"
          >
            Get started with your first form <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
