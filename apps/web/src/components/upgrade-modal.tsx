import { Tick02Icon, Cancel01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence } from "motion/react";
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                  <HugeiconsIcon icon={StarIcon} size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upgrade to Pro
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Unlock the full potential of FormDrop
                  </p>
                </div>
              </div>

              {/* Billing Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-xl flex items-center relative">
                  <button
                    onClick={() => setBillingInterval("month")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative z-10 ${
                      billingInterval === "month"
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingInterval("year")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative z-10 ${
                      billingInterval === "year"
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Yearly{" "}
                    <span className="text-xs text-green-600 font-bold ml-1">
                      -20%
                    </span>
                  </button>

                  <motion.div
                    className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm"
                    initial={false}
                    animate={{
                      left: billingInterval === "month" ? 4 : "50%",
                      width:
                        billingInterval === "month"
                          ? "calc(50% - 4px)"
                          : "calc(50% - 4px)",
                      x: billingInterval === "month" ? 0 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${billingInterval === "year" ? "24" : "29"}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {billingInterval === "year"
                    ? "Billed $288 yearly"
                    : "Billed monthly"}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="shrink-0 text-accent">
                      <HugeiconsIcon icon={Tick02Icon} size={20} />
                    </div>
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? "Redirecting..." : "Upgrade Now"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
