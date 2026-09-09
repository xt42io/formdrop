import { Tick02Icon, Cancel01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import { Icon, Modal } from "@formdrop/ui";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "year",
  );
  const [isLoading, setIsLoading] = useState(false);

  const benefits = [
    "Unlimited forms",
    "Form folders",
    "Advanced analytics",
    "Powerful integrations",
    "Priority support",
    "Priority feature requests",
  ];

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await authClient.checkout({
        slug: billingInterval === "year" ? "Pro Yearly" : "Pro Monthly",
      });
    } catch (error) {
      console.error("Failed to start checkout", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      label="Upgrade to Pro"
      scrim="bg-black/40 backdrop-blur-sm"
    >
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-ink-100 rounded-full transition-colors text-ink-500"
        >
          <Icon icon={Cancel01Icon} size={20} />
        </button>
      </div>

      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent-500/10 rounded-2xl text-accent-600">
            <Icon icon={StarIcon} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink-950">Upgrade to Pro</h2>
            <p className="text-ink-500 text-sm">
              Unlock the full potential of FormDrop
            </p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          {/* The pill is rendered inside whichever button is active and sized
              `inset-0`, so it is that button's box by construction.

              It used to be a sibling positioned at `left: 50%` with
              `width: calc(50% - 4px)`, which assumes the two buttons split the
              row evenly. They never did -- "Yearly -20%" measures 115px against
              "Monthly" at 87px -- so the pill sat 14px narrower than the button
              it was meant to be highlighting and offset to the right of it,
              leaving under 2px between its left edge and the "Y" while 16px
              went spare on the other side. On Monthly the same maths overhung
              the pill 14px into its neighbour.

              layoutId is what animates it between the two now, the same way the
              settings and form tabs move their underline. */}
          <div className="bg-ink-100 p-1 rounded-xl flex items-center">
            {(["month", "year"] as const).map((interval) => {
              const isActive = billingInterval === interval;
              return (
                <button
                  key={interval}
                  onClick={() => setBillingInterval(interval)}
                  className={`relative cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-ink-950"
                      : "text-ink-500 hover:text-ink-700"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="billing-interval-pill"
                      className="absolute inset-0 bg-white rounded-lg"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">
                    {interval === "month" ? (
                      "Monthly"
                    ) : (
                      <>
                        Yearly
                        <span className="text-xs text-tint-green-ink font-bold ml-1.5">
                          -20%
                        </span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-ink-950">
              ${billingInterval === "year" ? "24" : "29"}
            </span>
            <span className="text-ink-500">/month</span>
          </div>
          <p className="text-sm text-ink-500 mt-2">
            {billingInterval === "year"
              ? "Billed $288 yearly"
              : "Billed monthly"}
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="shrink-0 text-accent-500">
                <Icon icon={Tick02Icon} size={20} />
              </div>
              <span className="text-ink-700 text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-white rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? "Redirecting..." : "Upgrade Now"}
        </button>
      </div>
    </Modal>
  );
}
