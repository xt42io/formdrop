import type { ComponentType, SVGProps } from "react";
import {
  AstroLight,
  Nextjs,
  ReactDark,
  RemixLight,
  Solidjs,
  Svelte,
  Vue,
} from "@ridemountainpig/svgl-react";

/**
 * Original claim and copy, and the original set — now carrying each framework's
 * own mark rather than its name set in the same grey as the one beside it.
 *
 * The wordmark stays next to the logo instead of being replaced by it: a row of
 * bare marks is a puzzle, and the point of this band is that a reader spots
 * their own stack without having to decode anything.
 */
const FRAMEWORKS: Array<{
  name: string;
  Logo: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { name: "React", Logo: ReactDark },
  { name: "Vue.js", Logo: Vue },
  { name: "Next.js", Logo: Nextjs },
  { name: "Svelte", Logo: Svelte },
  // svgl names these for the ground they sit on, not for their own colour:
  // the "Dark" variants are white-filled and vanish on this page.
  { name: "Remix", Logo: RemixLight },
  { name: "Astro", Logo: AstroLight },
  { name: "Solid", Logo: Solidjs },
];

export function FrontendFrameworks() {
  return (
    <section className="overflow-hidden px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="section-heading text-balance text-ink-950">
          Bring Your Own Frontend
        </h2>
        <p className="section-lede mt-4 text-ink-600">
          FormDrop is framework agnostic. Whether you're building a static site,
          a single page app, or a server-rendered application, we've got you
          covered.
        </p>
      </div>

      {/* The edges fade by masking the track itself.

          They used to be two overlaid gradients running `from-white
          to-transparent`, and `transparent` is transparent *black* — so the
          ramp interpolated white to black-at-zero-alpha and laid a grey haze
          over the marks on both sides, with a visible edge where it ended. A
          mask removes the pixels instead of painting over them, so there is no
          colour to interpolate and it holds over any background. */}
      <div className="relative mt-14 mask-[linear-gradient(to_right,transparent,#000_14%,#000_86%,transparent)]">

        {/* The track holds the set four times so a wide viewport stays filled.
            It pauses on hover, so somebody who wants to look at one mark can. */}
        <div className="animate-band-left flex w-max items-center hover:[animation-play-state:paused]">
          {[0, 1, 2, 3].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {FRAMEWORKS.map(({ name, Logo }) => (
                <span
                  key={name}
                  className="flex items-center px-10"
                  // The duplicates are the same seven marks repeated, so only
                  // the first pass should reach assistive tech.
                  aria-hidden={copy > 0 ? "true" : undefined}
                >
                  {/* The name is carried by the mark rather than set beside
                      it, so the row reads as logos. It stays the accessible
                      name, because a bare <svg> announces nothing. Larger now
                      that each mark has the space the wordmark was using. */}
                  <Logo
                    role="img"
                    aria-label={name}
                    className="h-7 w-auto shrink-0 lg:h-8"
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
