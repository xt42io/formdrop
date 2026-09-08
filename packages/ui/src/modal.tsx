import { AnimatePresence, motion } from "motion/react";

/**
 * The dialog shell. Thirteen copies of this markup were spread across nine
 * files, each re-declaring the same overlay, the same panel and the same
 * entrance.
 *
 * W3 is a refactor, not a restyle -- the redesign of these screens is W4 --
 * so this deliberately changes nothing a user can see. The copies had drifted
 * to three different scrim opacities, so rather than unify them here and
 * restyle twelve dialogs as a side effect of moving code, `scrim` carries each
 * caller's original value. W4 is where they should converge.
 *
 * The panel is announced with role="dialog", which none of the copies did.
 * That is invisible, changes no behaviour, and is what lets the smoke path the
 * PRD asks for address the dialog at all.
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

/** What every copy but one used. */
const DEFAULT_SCRIM = "bg-black/20 backdrop-blur-sm";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: keyof typeof widths;
  /** Overlay classes. Preserves each call site's original scrim; see above. */
  scrim?: string;
  /** Panel corner radius. One dialog was rounded-2xl rather than rounded-3xl,
      and a class passed through `className` would not reliably win against the
      default without tailwind-merge. */
  radius?: string;
  /** Names the dialog for assistive tech when the body has no heading. */
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  size = "md",
  scrim = DEFAULT_SCRIM,
  radius = "rounded-3xl",
  label,
  className = "",
  children,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 ${scrim}`}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-white ${radius} shadow-xl w-full ${widths[size]} overflow-hidden ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
