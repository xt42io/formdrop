/**
 * The right-hand half of the auth pages: a lit panel carrying an illustration
 * of the product, with the headline grouped underneath it.
 *
 * Shared because /login and /signup show it identically. It lives at h-full
 * inside a viewport-locked grid, so it never scrolls, and everything in it is
 * either static or a CSS keyframe whose resting style is the visible one.
 */
export function AuthPanel() {
  return (
    <div className="relative hidden h-full overflow-hidden bg-[#16161f] lg:block">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* The grid is drawn here rather than reused from bg-lines, which is
            tuned for dark ink on white and all but vanishes on a dark ground. */}
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
        {/* the accent behind the illustration, breathing */}
        <div className="animate-glow absolute top-[calc(44%_-_15rem)] left-1/2 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,var(--color-accent-500),transparent_62%)] blur-[90px]" />
        <div className="absolute top-[calc(44%_-_9rem)] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--color-accent-500),transparent_65%)] opacity-50 blur-[70px]" />
        {/* a vignette, so the panel has depth rather than reading flat */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_78%_68%_at_50%_46%,transparent,#16161f_92%)]" />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-14 py-16 text-center">
        <SubmissionFlow />

        <p className="mt-8 max-w-xs text-[1.6rem] leading-[1.2] font-semibold tracking-[-0.03em] text-balance text-white">
          The backend for your headless forms
        </p>

        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-ink-400">
          <span>Visitor submits</span>
          <span aria-hidden="true">&rarr;</span>
          <span>Stored &amp; in your dashboard</span>
          <span aria-hidden="true">&rarr;</span>
          <span>Notified</span>
        </p>
      </div>
    </div>
  );
}

/**
 * A plate is a square rotated 45deg then flattened, so its corner radius is
 * skewed by the same scale and reads as a real bevel. Drawing a darker copy a
 * few units lower gives the plate thickness.
 */
function Plate({
  cy,
  half,
  rx,
  fill,
  edge = false,
  rim,
}: {
  cy: number;
  half: number;
  rx: number;
  fill: string;
  edge?: boolean;
  rim?: string;
}) {
  return (
    <rect
      x={-half}
      y={-half}
      width={half * 2}
      height={half * 2}
      rx={rx}
      transform={`translate(200 ${cy}) scale(1 0.55) rotate(45)`}
      fill={fill}
      stroke={rim ?? (edge ? undefined : "rgb(255 255 255 / 0.09)")}
      strokeWidth={rim || !edge ? 1 : undefined}
    />
  );
}

const SPECKS = [
  { cx: 96, cy: 196, r: 2.6, dur: "8s", dy: "-14px" },
  { cx: 310, cy: 226, r: 2, dur: "11s", dy: "-9px" },
  { cx: 288, cy: 132, r: 1.7, dur: "9.5s", dy: "-16px" },
];

/**
 * What FormDrop does, in one picture: a form on the page, the submission
 * travelling off it, and the store it lands in lit up by the arrival.
 */
function SubmissionFlow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="h-auto w-full max-w-[24rem]"
      fill="none"
    >
      <defs>
        <linearGradient id="fd-auth-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3d4a" />
          <stop offset="1" stopColor="#16161d" />
        </linearGradient>
        <linearGradient id="fd-auth-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f1f27" />
          <stop offset="1" stopColor="#0d0d12" />
        </linearGradient>
        <linearGradient id="fd-auth-core" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-accent-200)" />
          <stop offset="1" stopColor="var(--color-accent-600)" />
        </linearGradient>
        <linearGradient id="fd-auth-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor="var(--color-accent-400)"
            stopOpacity="0"
          />
          <stop
            offset="1"
            stopColor="var(--color-accent-300)"
            stopOpacity="0.8"
          />
        </linearGradient>
        <filter id="fd-auth-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* the store sits on something */}
      <ellipse
        cx="200"
        cy="356"
        rx="124"
        ry="24"
        fill="#000"
        opacity="0.5"
        filter="url(#fd-auth-soft)"
      />

      <Plate cy={318} half={74} rx={26} fill="url(#fd-auth-edge)" edge />
      <Plate cy={292} half={74} rx={26} fill="url(#fd-auth-plate)" />

      {/* the lit plate, with a blurred copy behind it for bloom */}
      <g opacity="0.85" filter="url(#fd-auth-soft)">
        <Plate cy={250} half={62} rx={22} fill="url(#fd-auth-core)" edge />
      </g>
      <Plate cy={262} half={62} rx={22} fill="var(--color-accent-700)" edge />
      <Plate
        cy={250}
        half={62}
        rx={22}
        fill="url(#fd-auth-core)"
        rim="var(--color-accent-100)"
      />

      {/* light rising out of the store */}
      <path
        d="M 152 148 L 248 148 L 274 250 L 126 250 Z"
        fill="url(#fd-auth-shaft)"
        filter="url(#fd-auth-soft)"
        opacity="0.55"
      />

      {/* the submission on its way, on a connector that holds without motion */}
      <path
        d="M 200 162 L 200 208"
        stroke="rgb(255 255 255 / 0.14)"
        strokeWidth="1.5"
      />
      <path
        d="M 200 162 L 200 208"
        stroke="var(--color-accent-300)"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="20 80"
        className="animate-trace"
        style={{ ["--trace-dur" as string]: "2.4s" } as React.CSSProperties}
      />

      {/* the form itself */}
      <g
        className="animate-float"
        style={{ ["--float-y" as string]: "-8px" } as React.CSSProperties}
      >
        <g transform="rotate(-3 200 98)">
          <rect
            x="118"
            y="40"
            width="164"
            height="118"
            rx="16"
            fill="url(#fd-auth-plate)"
            stroke="rgb(255 255 255 / 0.11)"
          />
          <text
            x="134"
            y="62"
            fontSize="9.5"
            fontWeight="600"
            fill="rgb(255 255 255 / 0.45)"
          >
            Contact form
          </text>
          <line
            x1="118"
            x2="282"
            y1="72"
            y2="72"
            stroke="rgb(255 255 255 / 0.08)"
          />

          {[82, 103].map((y, i) => (
            <g key={y}>
              <rect
                x="134"
                y={y}
                width="132"
                height="15"
                rx="5"
                fill="rgb(255 255 255 / 0.06)"
                stroke="rgb(255 255 255 / 0.09)"
              />
              <rect
                x="142"
                y={y + 6}
                width={i === 0 ? 40 : 58}
                height="3.5"
                rx="1.75"
                fill="rgb(255 255 255 / 0.22)"
              />
            </g>
          ))}

          <rect
            x="134"
            y="128"
            width="66"
            height="18"
            rx="6"
            fill="url(#fd-auth-core)"
          />
          <text
            x="167"
            y="140.5"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="700"
            fill="#fff"
          >
            Submit
          </text>
        </g>
      </g>

      {SPECKS.map((speck) => (
        <circle
          key={speck.cx}
          cx={speck.cx}
          cy={speck.cy}
          r={speck.r}
          fill="var(--color-accent-300)"
          opacity="0.55"
          className="animate-float"
          style={
            {
              ["--float-dur" as string]: speck.dur,
              ["--float-y" as string]: speck.dy,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}
