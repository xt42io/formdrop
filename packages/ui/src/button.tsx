import { Tooltip } from "./tooltip";
import { usePlanGate } from "./plan-gate";

/**
 * The one button. Twenty-one files in apps/web imported the copy this
 * replaces; the only reason it could not already be shared was that it read
 * the subscription itself, which packages/ui has no business doing. That now
 * arrives through PlanGateProvider.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  icon?: React.ReactNode;
  /** Disable and explain via a tooltip unless the viewer is on a paid plan. */
  requiresPro?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

/*
 * On the token ramps. This is the last file in packages/ui and apps/web
 * outside the admin surface still mixing Tailwind's stock palette into a
 * shared surface, and it is the one that mattered most: sixty-nine call sites
 * take their colour from here, so a call site could be perfectly tokenised and
 * still paint a stock grey.
 *
 * `danger` moves to tint-rose-ink, which is also what the quota meters and the
 * destructive text elsewhere use, so one red means one thing. White on it is
 * 6.1:1, up from red-600's 4.8:1.
 *
 * Its hover lightens where `primary`'s darkens, and that asymmetry is real
 * rather than an oversight: the accent ramp has a 600 step to darken into, and
 * the tint palette has no rose ramp at all -- only the pastel ground and this
 * ink. Inventing a token here would be the tail wagging the dog; /90 over the
 * page is the same thing `primary` itself did until this commit.
 */
const variants = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500 border border-transparent shadow-sm",
  secondary:
    "bg-white text-ink-700 border border-ink-300 hover:bg-ink-50 focus:ring-ink-500",
  outline:
    "bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 focus:ring-ink-500",
  ghost:
    "text-ink-600 hover:bg-ink-100 focus:ring-ink-500 bg-transparent border border-transparent",
  danger:
    "bg-tint-rose-ink text-white hover:bg-tint-rose-ink/90 focus:ring-tint-rose-ink border border-transparent",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-xl gap-1",
  md: "px-4 py-2 text-sm rounded-3xl gap-2",
  lg: "px-4 py-3 text-base rounded-4xl gap-3",
  xl: "px-4 py-4 text-base rounded-4xl gap-3",
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  disabled,
  requiresPro,
  ...props
}: ButtonProps) {
  const isPro = usePlanGate();
  const isDisabledByPro = requiresPro && !isPro;

  const buttonContent = (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled || isDisabledByPro}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!isLoading && icon}
      {children}
    </button>
  );

  if (isDisabledByPro) {
    return (
      <Tooltip content="Upgrade to Pro to use this feature">
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
}
