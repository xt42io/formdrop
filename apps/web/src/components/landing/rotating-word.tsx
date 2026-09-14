import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Icon } from "@formdrop/ui";
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
  { label: "contact", icon: Mail01Icon, fill: "bg-pop-violet" },
  { label: "waitlist", icon: UserGroupIcon, fill: "bg-pop-blue" },
  { label: "feedback", icon: Message01Icon, fill: "bg-pop-green" },
  { label: "survey", icon: TableIcon, fill: "bg-pop-amber" },
  { label: "signup", icon: Login03Icon, fill: "bg-pop-pink" },
];

const HOLD_MS = 2600;
const ROW = "1.2em";

/**
 * One spring for the width and for the word itself.
 *
 * Both used to animate on their own clock — the width on a 500ms CSS
 * transition, the word on a 450ms motion tween — so the tag finished sliding
 * while its container was still resizing and the line visibly settled twice.
 * Sharing a spring is what makes it read as one object moving.
 */
const SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
} as const;

export function RotatingWord() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  const word = WORDS[index];

  useEffect(() => {
    if (reduceMotion) return;

    const id = setInterval(
      () => setIndex((i) => (i + 1) % WORDS.length),
      HOLD_MS,
    );
    return () => clearInterval(id);
  }, [reduceMotion]);

  /*
   * Every width is measured up front, from a hidden copy of the whole set.
   *
   * Measuring the live tag instead meant the number for a word only existed
   * once that word had mounted, so the first frame of every transition used
   * the previous word's width and the container caught up a frame late. That
   * late catch-up was the jolt.
   */
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () =>
      setWidths(
        Array.from(el.children).map(
          (child) => child.getBoundingClientRect().width,
        ),
      );

    measure();
    document.fonts?.ready.then(measure).catch(() => {});

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span className="relative inline-flex align-baseline">
      {/* The measurer: the full set, laid out but never painted, so every
          width is known before the first swap rather than after it.

          It sits inside a zero-sized clip because it is genuinely wide — five
          headline-sized words in a row came to 2119px on a 1280px viewport,
          and being absolutely positioned does not keep that out of the
          document's scroll width. It put a horizontal scrollbar on the whole
          landing page. Children still report their true width from inside an
          overflow:hidden box, which is all the measurement needs. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
      >
        <span ref={measureRef} className="flex w-max whitespace-nowrap">
          {WORDS.map((entry) => (
            <span
              key={entry.label}
              className="flex items-center gap-[0.18em] px-[0.22em]"
            >
              <span className="h-[0.62em] w-[0.62em] shrink-0" />
              {entry.label}
            </span>
          ))}
        </span>
      </span>

      <motion.span
        className="relative inline-block overflow-hidden align-baseline"
        style={{ height: ROW }}
        animate={{ width: widths[index] }}
        initial={false}
        transition={reduceMotion ? { duration: 0 } : SPRING}
      >
        {/* initial={false} so the first tag mounts already in place rather than
            waiting on an animation frame to become visible */}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={word.label}
            initial={reduceMotion ? false : { y: "105%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-105%", opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : SPRING}
            className={`absolute inset-y-0 left-0 flex items-center gap-[0.18em] rounded-[0.26em] px-[0.22em] whitespace-nowrap ${word.fill}`}
          >
            <Icon
              aria-hidden="true"
              icon={word.icon}
              className="h-[0.62em] w-[0.62em] shrink-0 text-ink-950"
              strokeWidth={2.2}
            />
            {word.label}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </span>
  );
}
