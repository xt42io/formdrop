import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useAnimationFrame, useReducedMotion } from "motion/react";
import { usePingPong } from "./use-cycle";

/**
 * The original three bands: the same point sets and the same opacities, with
 * the lit leading line, its bloom and its live tip. These are the resting
 * values the swell moves around rather than replaces, so the shape on screen
 * is still the one this illustration has always drawn.
 */
const WAVES = [
  { points: [30, 42, 36, 52, 45, 62, 55, 72, 64, 80, 74, 90], opacity: 0.32 },
  { points: [20, 30, 26, 38, 33, 46, 40, 52, 46, 58, 52, 66], opacity: 0.22 },
  { points: [12, 18, 16, 24, 21, 29, 26, 34, 30, 38, 34, 44], opacity: 0.14 },
];

const W = 340;
const H = 170;
const INSET = 4;

/** How far a point rides above and below its resting value, in wave units. */
const AMPLITUDE = 3.4;
/** One full swell, in milliseconds. */
const SWELL_MS = 7000;
/** Phase added per point, so a crest travels the line rather than the band bobbing as one. */
const POINT_PHASE = 0.55;

const STEP = (W - INSET * 2) / (WAVES[0].points.length - 1);
const xAt = (i: number) => INSET + i * STEP;
const yAt = (point: number) => H - (point / 100) * H;

/** Where one point sits at a given moment in the swell. */
function valueAt(base: number, index: number, band: number, theta: number) {
  return base + AMPLITUDE * Math.sin(theta + index * POINT_PHASE + band);
}

function linePath(points: number[]) {
  return points
    .map((point, i) => {
      const x = xAt(i);
      const y = yAt(point);
      if (i === 0) return `M ${x} ${y}`;
      const px = xAt(i - 1);
      const py = yAt(points[i - 1]);
      const cx = px + STEP / 2;
      return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
    })
    .join(" ");
}

const areaPath = (line: string) =>
  `${line} L ${W - INSET} ${H} L ${INSET} ${H} Z`;

/**
 * The wave on its own: three layered bands rising together, the leading one
 * drawn as a lit line with its own bloom and a live point at its tip. No card
 * and no chrome around it, because the heading underneath already names it.
 *
 * Three things move. The bands swell on a seven second loop, each point on its
 * own phase so a crest travels the line. The live point sweeps between data
 * points when nobody is touching it and follows a pointer or the arrow keys
 * when somebody is. The read-out underneath names the value it sits on.
 *
 * All of it runs off **one** clock, in a single frame loop that writes the
 * paths and the marker together. The first attempt gave the paths motion
 * keyframes and the marker its own matching set; they desynced the moment the
 * sweep changed index and restarted the marker's timeline, measured at up to
 * 18 units adrift — an eighth of the chart, with the dot visibly off the line.
 * Deriving both from the same theta each frame puts the marker on the line by
 * construction rather than by agreement between two timelines.
 *
 * Under prefers-reduced-motion the loop never starts and this renders the
 * original still illustration.
 */
export function AnalyticsVisual() {
  const reduceMotion = useReducedMotion();
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [active, setActive] = useState(WAVES[0].points.length - 1);
  const [engaged, setEngaged] = useState(false);

  /*
   * Idle, the point sweeps the line on its own. The moment a pointer or the
   * keyboard takes over, the sweep stops and does not resume until focus and
   * the cursor have both left, so it never pulls the marker out from under a
   * reader.
   */
  const swept = usePingPong(
    WAVES[0].points.length,
    900,
    !reduceMotion && !engaged,
  );

  useEffect(() => {
    if (!reduceMotion && !engaged) setActive(swept);
  }, [swept, engaged, reduceMotion]);

  // Read inside the frame loop, which must not close over a stale index.
  const activeRef = useRef(active);
  activeRef.current = active;

  const areaRefs = useRef<Array<SVGPathElement | null>>([]);
  const innerRefs = useRef<Array<SVGPathElement | null>>([]);
  const leadRefs = useRef<Array<SVGPathElement | null>>([]);
  const markerRef = useRef<SVGGElement | null>(null);
  const guideRef = useRef<SVGLineElement | null>(null);

  /** The resting shape, which is also what a reduced-motion reader gets. */
  const resting = useMemo(
    () =>
      WAVES.map((wave) => {
        const line = linePath(wave.points);
        return { ...wave, line, area: areaPath(line) };
      }),
    [],
  );

  useAnimationFrame((elapsed) => {
    if (reduceMotion) return;

    const theta = (elapsed / SWELL_MS) * Math.PI * 2;
    const index = activeRef.current;

    WAVES.forEach((wave, band) => {
      const points = wave.points.map((point, i) =>
        valueAt(point, i, band, theta),
      );
      const line = linePath(points);

      areaRefs.current[band]?.setAttribute("d", areaPath(line));
      innerRefs.current[band]?.setAttribute("d", line);

      if (band !== 0) return;

      leadRefs.current.forEach((path) => path?.setAttribute("d", line));

      const x = xAt(index);
      const y = yAt(valueAt(wave.points[index], index, band, theta));
      markerRef.current?.setAttribute("transform", `translate(${x} ${y})`);
      guideRef.current?.setAttribute("x1", String(x));
      guideRef.current?.setAttribute("x2", String(x));
      guideRef.current?.setAttribute("y1", String(y));
    });
  });

  const lead = resting[0];
  const value = lead.points[active];

  // Pointer x is mapped through the viewBox rather than the element's pixel
  // width, so the point still tracks the cursor at any rendered size.
  const pick = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    for (let i = 1; i < lead.points.length; i += 1) {
      if (Math.abs(xAt(i) - x) < Math.abs(xAt(nearest) - x)) nearest = i;
    }
    setActive(nearest);
  };

  return (
    <figure className="w-full max-w-sm">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70"
        fill="none"
        role="img"
        tabIndex={0}
        aria-label={`Submissions trend. Point ${active + 1} of ${lead.points.length}: ${value}. Use the arrow keys to move along the line.`}
        onPointerMove={(event) => {
          setEngaged(true);
          pick(event.clientX);
        }}
        onPointerLeave={() => setEngaged(false)}
        onFocus={() => setEngaged(true)}
        onBlur={() => setEngaged(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, lead.points.length - 1));
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          }
        }}
      >
        <defs>
          <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              stopColor="var(--color-accent-500)"
              stopOpacity="0.9"
            />
            <stop
              offset="1"
              stopColor="var(--color-accent-500)"
              stopOpacity="0"
            />
          </linearGradient>
          <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--color-accent-400)" />
            <stop offset="1" stopColor="var(--color-accent-600)" />
          </linearGradient>
          <filter
            id={`${gradientId}-glow`}
            x="-20%"
            y="-40%"
            width="140%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* the ground the waves sit on */}
        <line
          x1="0"
          x2={W}
          y1={H}
          y2={H}
          stroke="var(--color-ink-200)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />

        {resting.map((band, i) => (
          <g key={i} opacity={band.opacity}>
            <path
              ref={(el) => {
                areaRefs.current[i] = el;
              }}
              d={band.area}
              fill={`url(#${gradientId}-fill)`}
            />
            {i > 0 && (
              <path
                ref={(el) => {
                  innerRefs.current[i] = el;
                }}
                d={band.line}
                stroke="var(--color-accent-500)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </g>
        ))}

        {/* the leading band, lit */}
        <path
          ref={(el) => {
            leadRefs.current[0] = el;
          }}
          d={lead.line}
          stroke="var(--color-accent-500)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.35"
          filter={`url(#${gradientId}-glow)`}
        />
        <path
          ref={(el) => {
            leadRefs.current[1] = el;
          }}
          d={lead.line}
          stroke={`url(#${gradientId}-line)`}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* the guide, only while the reader is actually driving it */}
        {engaged && (
          <line
            ref={guideRef}
            x1={xAt(active)}
            x2={xAt(active)}
            y1={yAt(lead.points[active])}
            y2={H}
            stroke="var(--color-accent-400)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
        )}

        {/* the live point */}
        <g
          ref={markerRef}
          transform={`translate(${xAt(active)} ${yAt(lead.points[active])})`}
        >
          {!engaged && (
            <circle
              r="7"
              fill="var(--color-accent-500)"
              opacity="0.3"
              className="animate-ping-soft"
            />
          )}
          <circle
            r="4.5"
            fill="var(--color-accent-500)"
            stroke="white"
            strokeWidth="2.5"
          />
        </g>
      </svg>

      {/* The read-out is text, so the number the point is sitting on is the
          same number a screen reader gets. */}
      <figcaption className="mt-3 flex items-baseline justify-center gap-1.5 font-mono text-xs">
        <span className="text-ink-500">Submissions</span>
        <span className="font-semibold text-accent-600 tabular-nums">
          {value}
        </span>
      </figcaption>
    </figure>
  );
}
