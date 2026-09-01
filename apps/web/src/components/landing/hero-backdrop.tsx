/**
 * Line field behind the top of the page — jargons.run's approach: a 48px grid
 * of 1px rules at very low contrast, running edge to edge.
 *
 * No colour and no gradient washes: white ground, faint ruling, a trace of
 * grain. The ruling is faded out at the bottom with a mask rather than a white
 * overlay, so nothing tints the page.
 *
 * Sits behind the navbar as well as the hero, so the ruling runs under the nav
 * rather than starting below it. Positioned absolutely with its own clip; an
 * `overflow-hidden` wrapper here would break the sticky navbar.
 */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[76rem] overflow-hidden"
    >
      <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,#000_0%,#000_62%,transparent_96%)]" />

      <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
    </div>
  );
}
