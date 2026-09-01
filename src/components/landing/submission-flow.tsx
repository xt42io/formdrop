import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Mail01Icon,
  SlackIcon,
} from "@hugeicons/core-free-icons";

/**
 * The hero demo: a form submits, the row lands in the dashboard, the
 * notification fires. Four steps on a ~6.4s loop.
 *
 *   0  idle        empty form
 *   1  filling     fields carry values, submit is armed
 *   2  landed      row slides into the submissions table
 *   3  notified    Slack toast appears
 */
const STEP_MS = 1600;
const STEPS = 4;

const NEW_ROW = {
  name: "Ada Okoye",
  email: "ada@northwind.io",
  message: "Can I pipe submissions into Slack?",
  time: "just now",
};

const EXISTING_ROWS = [
  { name: "Marcus Bell", email: "marcus@fold.dev", time: "12m ago" },
  { name: "Lena Fischer", email: "lena@parcelly.com", time: "1h ago" },
  { name: "Tom Adeyemi", email: "tom@quiethours.co", time: "3h ago" },
  { name: "Priya Raman", email: "priya@stackless.app", time: "5h ago" },
  { name: "Femi Adigun", email: "femi@northloop.io", time: "6h ago" },
  { name: "Sara Kim", email: "sara@brightsend.co", time: "8h ago" },
];

export function SubmissionFlow() {
  const reduceMotion = useReducedMotion();

  // Starts on the last step, so the first paint — server-rendered, or any
  // client that never animates — shows the completed flow rather than an
  // empty form. The loop then picks up from there.
  const [step, setStep] = useState(STEPS - 1);

  useEffect(() => {
    if (reduceMotion) return;

    const id = setInterval(() => setStep((s) => (s + 1) % STEPS), STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const filled = step >= 1;
  const landed = step >= 2;
  const notified = step >= 3;

  return (
    <div className="relative mx-auto mt-16 max-w-4xl px-4 sm:px-6">
      <div className="rounded-panel border border-ink-200 bg-white p-2 sm:p-3">
        <div className="grid gap-3 sm:grid-cols-5">
          {/* the customer's form */}
          <div className="flex flex-col rounded-card border border-ink-100 bg-canvas p-6 sm:col-span-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ink-300" />
              <span className="text-xs font-medium text-ink-400">
                your-site.com/contact
              </span>
            </div>

            <div className="mt-6 flex flex-1 flex-col gap-3.5">
              <Field label="Name" value={NEW_ROW.name} filled={filled} />
              <Field label="Email" value={NEW_ROW.email} filled={filled} />
              <Field
                label="Message"
                value={NEW_ROW.message}
                filled={filled}
                lines={2}
              />

              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : { scale: step === 2 ? 0.97 : 1 }
                }
                transition={{ duration: 0.18 }}
                className={`mt-1 flex items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  filled
                    ? "bg-accent-500 text-white"
                    : "bg-ink-200 text-ink-400"
                }`}
              >
                Send message
              </motion.div>

              {/* the one line of integration, filling what would otherwise be
                  dead space next to the taller table */}
              <div className="mt-auto pt-5">
                <p className="mb-2 text-[11px] font-medium tracking-wide text-ink-400 uppercase">
                  Form action
                </p>
                <code className="block overflow-x-auto rounded-lg border border-ink-100 bg-white px-3 py-2 text-[11px] whitespace-nowrap text-ink-600">
                  api.formdrop.co/f/contact
                </code>
              </div>
            </div>
          </div>

          {/* the dashboard it lands in */}
          <div className="relative overflow-hidden rounded-card border border-ink-100 bg-white sm:col-span-3">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Contact form
                </p>
                <p className="text-xs text-ink-400">Submissions</p>
              </div>
              <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                {landed ? "7 today" : "6 today"}
              </span>
            </div>

            {/* fixed height so the row entering and leaving doesn't resize the
                whole panel on every cycle */}
            <div className="flex min-h-[26rem] flex-col pb-14">
              <AnimatePresence initial={false}>
                {landed && (
                  <motion.div
                    key="new-row"
                    initial={
                      reduceMotion ? false : { opacity: 0, y: -14, height: 0 }
                    }
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  >
                    <Row {...NEW_ROW} highlight />
                  </motion.div>
                )}
              </AnimatePresence>

              {EXISTING_ROWS.map((row) => (
                <Row key={row.email} {...row} />
              ))}
            </div>

            {/* notification */}
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-end">
              <AnimatePresence>
                {notified && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-ink-950 px-3.5 py-2.5 shadow-lift"
                  >
                    <HugeiconsIcon
                      icon={SlackIcon}
                      size={16}
                      className="text-white"
                    />
                    <span className="text-xs font-medium text-white">
                      #leads &middot; new submission
                    </span>
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={15}
                      className="text-accent-300"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* what just happened, in words */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-500">
        <Caption active={filled}>Visitor submits</Caption>
        <Arrow />
        <Caption active={landed}>Stored &amp; in your dashboard</Caption>
        <Arrow />
        <Caption active={notified}>
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Mail01Icon} size={14} />
            Notified
          </span>
        </Caption>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  filled,
  lines = 1,
}: {
  label: string;
  value: string;
  filled: boolean;
  lines?: number;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium tracking-wide text-ink-400 uppercase">
        {label}
      </p>
      <div
        className={`rounded-lg border bg-white px-3 py-2 text-sm transition-colors ${
          filled ? "border-ink-200 text-ink-800" : "border-ink-100 text-ink-300"
        }`}
        style={{ minHeight: lines > 1 ? 108 : undefined }}
      >
        {filled ? (
          value
        ) : (
          <span className="inline-block h-4 w-full max-w-[70%] rounded bg-ink-100" />
        )}
      </div>
    </div>
  );
}

function Row({
  name,
  email,
  time,
  highlight = false,
}: {
  name: string;
  email: string;
  time: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5 last:border-b-0 ${
        highlight ? "bg-accent-50/70" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            highlight
              ? "bg-accent-500 text-white"
              : "bg-ink-100 text-ink-500"
          }`}
        >
          {name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">{name}</p>
          <p className="truncate text-xs text-ink-400">{email}</p>
        </div>
      </div>
      <span className="shrink-0 text-xs text-ink-400">{time}</span>
    </div>
  );
}

function Caption({
  children,
  active,
}: {
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <span
      className={`transition-colors duration-300 ${
        active ? "font-medium text-ink-800" : "text-ink-400"
      }`}
    >
      {children}
    </span>
  );
}

function Arrow() {
  return <span className="text-ink-300">&rarr;</span>;
}
