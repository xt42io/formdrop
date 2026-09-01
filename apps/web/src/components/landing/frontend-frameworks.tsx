const FRAMEWORKS = [
  "React",
  "Vue.js",
  "Next.js",
  "Svelte",
  "Remix",
  "Astro",
  "Solid",
];

/**
 * Original claim and copy. The row follows the reference's logo bar: plain
 * wordmarks with no chip or border, faded at both edges, drifting across.
 * The track holds the set four times so a wide viewport stays filled, and the
 * resting position is the base style — no frame needed for it to read.
 */
export function FrontendFrameworks() {
  return (
    <section className="overflow-hidden px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[clamp(1.55rem,2.6vw,1.95rem)] leading-[1.25] font-semibold tracking-[-0.025em] text-ink-950">
          Bring Your Own Frontend
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
          FormDrop is framework agnostic. Whether you're building a static site,
          a single page app, or a server-rendered application, we've got you
          covered.
        </p>
      </div>

      <div className="relative mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-linear-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-linear-to-l from-white to-transparent" />

        <div className="animate-band-left flex w-max items-center">
          {[0, 1, 2, 3].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {FRAMEWORKS.map((name) => (
                <span
                  key={name}
                  className="px-10 text-xl font-semibold whitespace-nowrap text-ink-400 lg:text-2xl"
                >
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
