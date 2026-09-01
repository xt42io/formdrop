import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Login03Icon,
  Mail01Icon,
  Message01Icon,
  TableIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

/**
 * The headline's cycling word: one tag per word, holding its icon and its label
 * on a single fill.
 *
 * The icon and the label live inside the same animated element, so a variant
 * slides in as one piece — with the icon outside, it swapped instantly while the
 * word was still sliding, and mid-transition the headline could show one word's
 * text next to another word's icon.
 *
 * Only the active variant is mounted, so the page reads "The contact form
 * backend for developers" to anything consuming text rather than pixels.
 */
const WORDS = [
  { label: "contact", icon: Mail01Icon, fill: "bg-[#d8d0fb]" },
  { label: "waitlist", icon: UserGroupIcon, fill: "bg-[#cfe2ff]" },
  { label: "feedback", icon: Message01Icon, fill: "bg-[#cdf0dd]" },
  { label: "survey", icon: TableIcon, fill: "bg-[#ffeac0]" },
  { label: "signup", icon: Login03Icon, fill: "bg-[#ffd6e3]" },
];

const HOLD_MS = 2600;
const ROW = "1.2em";

export function RotatingWord() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number>();
  const tagRef = useRef<HTMLSpanElement | null>(null);

  const word = WORDS[index];

  useEffect(() => {
    if (reduceMotion) return;

    const id = setInterval(
      () => setIndex((i) => (i + 1) % WORDS.length),
      HOLD_MS,
    );
    return () => clearInterval(id);
  }, [reduceMotion]);

  // The clip animates to the active tag's own width, so the line re-centres
  // instead of every tag being sized to the longest word.
  useLayoutEffect(() => {
    const el = tagRef.current;
    if (!el) return;

    const measure = () => setWidth(el.getBoundingClientRect().width);

    measure();
    document.fonts?.ready.then(measure).catch(() => {});

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index]);

  return (
    <span
      className="relative inline-block overflow-hidden align-baseline transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ height: ROW, width }}
    >
      {/* initial={false} so the first tag mounts already in place rather than
          waiting on an animation frame to become visible */}
      <AnimatePresence initial={false}>
        <motion.span
          key={word.label}
          ref={tagRef}
          initial={reduceMotion ? false : { y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-y-0 left-0 flex items-center gap-[0.18em] rounded-[0.26em] px-[0.22em] whitespace-nowrap ${word.fill}`}
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={word.icon}
            className="h-[0.62em] w-[0.62em] shrink-0 text-ink-950"
            strokeWidth={2.2}
          />
          {word.label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
