import { Button, Icon } from "@formdrop/ui";
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

  const used: number = settings?.usage?.used ?? 0;
  const limit: number = settings?.usage?.limit ?? 0;
  // The endpoint has always returned the limit next to the count; this panel
  // rendered only the count, so the one screen actually about billing showed
  // a number with nothing to measure it against -- while the sidebar, two
  // inches to the left, showed the same figure over its quota.
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const exceeded = limit > 0 && used >= limit;

  return (
    <div className="overflow-hidden rounded-panel border border-ink-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-5">
        <div>
          <div className="text-xs font-medium tracking-wide text-ink-500 uppercase">
            Current plan
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink-950">
            {isPro ? "Pro" : "Free"}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isPro
              ? "bg-tint-green text-tint-green-ink"
              : "bg-ink-100 text-ink-600"
          }`}
        >
          {isPro ? "Active" : "No subscription"}
        </span>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-ink-700">
            Submissions this month
          </span>
          <span className="text-sm text-ink-600 tabular-nums">
            <span className="font-semibold text-ink-950">
              {used.toLocaleString()}
            </span>
            {limit > 0 && ` / ${limit.toLocaleString()}`}
          </span>
        </div>

        {limit > 0 && (
          <div
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-label="Submissions used this month"
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                exceeded ? "bg-tint-rose-ink" : "bg-accent-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        <p className="mt-3 text-xs text-ink-500">
          {exceeded
            ? "You have reached the limit for this plan. New submissions are rejected until it resets or you upgrade."
            : limit > 0
              ? `${(limit - used).toLocaleString()} left on this plan.`
              : "Usage is counted per calendar month."}
        </p>

        <div className="mt-6 border-t border-ink-100 pt-5">
          {isPro ? (
            <Button
              variant="outline"
              icon={<Icon icon={CreditCardIcon} size={16} />}
              onClick={() => authClient.customer.portal()}
            >
              Manage subscription
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                icon={<Icon icon={CreditCardIcon} size={16} />}
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
    </div>
  );
}
