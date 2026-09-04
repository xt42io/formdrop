import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  StarIcon,
  ArrowRight01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/(marketing)/welcome-to-pro")({
  component: WelcomeToPro,
});

const FEATURES = [
  "Unlimited forms & submissions",
  "Advanced analytics dashboard",
  "Powerful integrations",
  "Priority support",
  "Form folders",
  "Unlimited team members",
];

const CONFETTI_COLORS = ["#6f63e4", "#b8aef2", "#ffd166", "#4ecdc4"];

/**
 * Derived from the index rather than from Math.random(): the page is rendered
 * on the server too, and random values would differ between that render and
 * hydration, which React reports as a mismatch and can repaint.
 */
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 11 + (i % 4) * 5) % 100}%`,
  size: 7 + (i % 3) * 3,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i % 6) * 0.85,
  duration: 6 + (i % 5),
  rotate: (i % 2 === 0 ? 1 : -1) * (180 + (i % 3) * 90),
}));

function WelcomeToPro() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 py-16">
      {/* the marketing pages' backdrop, so the upgrade lands inside the product */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden"
      >
        <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,#000_0%,#000_45%,transparent_92%)]" />
        <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
      </div>

      {/* Decoration only, so it is the one thing here allowed to depend on
          motion running — the card below never does. */}
      {!reduceMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {CONFETTI.map((piece) => (
            <motion.span
              key={piece.id}
              initial={{ y: "-10vh", opacity: 0 }}
              animate={{
                y: "110vh",
                opacity: [0, 1, 1, 0],
                rotate: piece.rotate,
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-0 rounded-full"
              style={{
                left: piece.left,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
              }}
            />
          ))}
        </div>
      )}

      <div className="animate-enter relative w-full max-w-lg rounded-panel border border-ink-200 bg-white p-8 text-center md:p-10">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
          <HugeiconsIcon icon={StarIcon} size={30} />
        </span>

        <h1 className="mt-6 text-[clamp(1.6rem,3vw,2rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-ink-950">
          Welcome to Pro!
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Thank you for upgrading. You've just unlocked unlimited possibilities
          with FormDrop.
        </p>

        <ul className="animate-enter-late mt-8 flex flex-col gap-3 rounded-2xl bg-ink-50/70 p-6 text-left">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <HugeiconsIcon
                icon={Tick02Icon}
                size={17}
                className="mt-0.5 shrink-0 text-accent-600"
              />
              <span className="text-sm font-medium text-ink-800">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <Link
          to="/app/forms"
          className="group mt-8 flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 active:scale-[0.99]"
        >
          Go to Dashboard
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={18}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  );
}
