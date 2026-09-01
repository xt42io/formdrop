import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  StarIcon,
  ArrowRight01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/welcome-to-pro")({
  component: WelcomeToPro,
});

function WelcomeToPro() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center border border-gray-100 relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent"
        >
          <HugeiconsIcon icon={StarIcon} size={40} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 mb-4"
        >
          Welcome to Pro!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8 text-lg"
        >
          Thank you for upgrading. You've just unlocked unlimited possibilities
          with FormDrop.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-8 text-left bg-gray-50 p-6 rounded-2xl"
        >
          {[
            "Unlimited forms & submissions",
            "Advanced analytics dashboard",
            "Powerful integrations",
            "Priority support",
            "Form folders",
            "Unlimited team members",
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-green-500 shrink-0">
                <HugeiconsIcon icon={Tick02Icon} size={20} />
              </div>
              <span className="text-gray-700 font-medium">{feature}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/app/forms"
            className="inline-flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent/90 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30 active:scale-[0.98]"
          >
            Go to Dashboard
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
          </Link>
        </motion.div>
      </motion.div>

      {/* Confetti-like background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: -100,
              x: Math.random() * 1000 - 500, // Random start X relative to center (simplified)
            }}
            animate={{
              opacity: [0, 1, 0],
              y: 1000, // Fall down
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
            className="absolute top-0 left-1/2 w-3 h-3 rounded-full"
            style={{
              backgroundColor: ["#6f63e4", "#FFD700", "#FF6B6B", "#4ECDC4"][
                Math.floor(Math.random() * 4)
              ],
              marginLeft: `${Math.random() * 100 - 50}vw`, // Spread across width
            }}
          />
        ))}
      </div>
    </div>
  );
}
