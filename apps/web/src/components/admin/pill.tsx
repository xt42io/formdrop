/**
 * The status pill the admin tables use.
 *
 * Named by tone rather than by meaning, the way the tint tokens are: the same
 * green marks "active" on the users table and nothing at all on forms, so a
 * semantic name would be wrong at half the call sites.
 */
export function Pill({
  tone,
  children,
}: {
  tone: "accent" | "neutral" | "good" | "bad";
  children: React.ReactNode;
}) {
  const tones = {
    accent: "bg-accent-500/12 text-accent-700",
    neutral: "bg-ink-100 text-ink-600",
    good: "bg-tint-green text-tint-green-ink",
    bad: "bg-tint-rose text-tint-rose-ink",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
