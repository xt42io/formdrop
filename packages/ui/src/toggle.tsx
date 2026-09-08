/**
 * The switch that appeared, hand-rolled and character-for-character identical,
 * in all three notification sections plus the Google Sheets section, and once
 * more a size smaller in the recipient row.
 *
 * `checked` is passed in rather than derived from `disabled`, because the
 * recipient row deliberately renders an unverified-but-enabled recipient as
 * off; that call site keeps making that decision itself.
 */
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  /** What the switch controls, for anyone not looking at the label beside it. */
  label?: string;
}

const tracks = {
  sm: "h-5 w-9",
  md: "h-6 w-11",
};

const knobs = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
};

const knobOn = {
  sm: "translate-x-5",
  md: "translate-x-6",
};

export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
  label,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex ${tracks[size]} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
        checked ? "bg-accent" : "bg-ink-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block ${knobs[size]} transform rounded-full bg-white transition-transform ${
          checked ? knobOn[size] : "translate-x-1"
        }`}
      />
    </button>
  );
}
