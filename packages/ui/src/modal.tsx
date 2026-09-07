import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * The dialog shell. Thirteen copies of this markup were spread across nine
 * files, each re-declaring the same overlay, the same panel and the same
 * entrance -- and each with its own scrim opacity, its own corner radius and
 * its own spring, because nothing kept them in step.
 *
 * One shell means one answer to each of those, so the scrim is a single
 * `bg-black/40` everywhere. Sites that used /20 get slightly darker and sites
 * that used /50 slightly lighter; both move to the middle.
 *
 * Centralising also buys what none of the copies had: Escape closes the
 * dialog, and the panel is announced as one.
 *
 * Padding stays with the caller. The shapes of the bodies vary too much --
 * confirmations, forms, a pricing table -- for a shared padding to fit them.
 */
const widths = {
  md: "max-w-md",
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: keyof typeof widths;
  /** Names the dialog for assistive tech when the body has no heading. */
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  size = "md",
  label,
  className = "",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

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
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-white rounded-3xl shadow-xl w-full ${widths[size]} overflow-hidden ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
