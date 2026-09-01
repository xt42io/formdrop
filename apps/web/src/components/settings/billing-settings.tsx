import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";

interface BillingSettingsProps {
  settings: any;
}

export function BillingSettings({ settings }: BillingSettingsProps) {
  const isPro = settings?.subscription?.status === "active";
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Billing & Plans
      </h2>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Current Plan</p>
            <h3 className="text-xl font-bold text-gray-900">
              {isPro ? "Pro Plan" : "Free Plan"}
            </h3>
          </div>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              isPro
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {isPro ? "Active" : "Free"}
          </span>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Total Submissions</span>
            <span>{settings?.usage?.used?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isPro ? (
          <Button
            variant="outline"
            size="lg"
            className="w-full border-dashed border-gray-300 hover:border-gray-400 text-gray-600"
            icon={<HugeiconsIcon icon={CreditCardIcon} size={18} />}
            onClick={() => authClient.customer.portal()}
          >
            Manage Subscription
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20"
              icon={<HugeiconsIcon icon={CreditCardIcon} size={18} />}
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              Upgrade to Pro
            </Button>
            <UpgradeModal
              isOpen={isUpgradeModalOpen}
              onClose={() => setIsUpgradeModalOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
