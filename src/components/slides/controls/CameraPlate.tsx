/**
 * Decorative SVG plates rendered behind the CameraBubble in cinematic
 * scenes ("cam-only", "stage-fill"). Pure presentation — no state,
 * no interactivity, pointer-events disabled.
 *
 * The squircle is a quadratic-Bezier superellipse approximation; the
 * dashed ring + corner ticks add a "live broadcast" frame without
 * stealing focus from the presenter's face.
 */
export function CameraPlate({ variant }: { variant: "squircle" | "stage" }) {
  if (variant === "stage") {
    // Stage-fill: corner ticks only, hugging the viewport edges.
    return (
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <g fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" strokeLinecap="square">
          {/* 4 L-shaped corner ticks */}
          <path d="M2,8 V2 H8" />
          <path d="M92,2 H98 V8" />
          <path d="M98,92 V98 H92" />
          <path d="M8,98 H2 V92" />
        </g>
        <text
          x="50" y="98"
          textAnchor="middle"
          fontSize="1.4"
          fill="rgba(255,255,255,0.5)"
          letterSpacing="0.6"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          ● LIVE
        </text>
      </svg>
    );
  }

  // Squircle plate framing the bubble in "cam-only" mode.
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-3 h-[calc(100%+24px)] w-[calc(100%+24px)]"
    >
      <defs>
        <linearGradient id="cam-plate-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
        </linearGradient>
      </defs>
      {/* Outer squircle ring (superellipse via cubic curves) */}
      <path
        d="
          M 50 2
          C 78 2, 98 22, 98 50
          C 98 78, 78 98, 50 98
          C 22 98, 2 78, 2 50
          C 2 22, 22 2, 50 2
          Z
        "
        fill="none"
        stroke="url(#cam-plate-ring)"
        strokeWidth="0.6"
        strokeDasharray="2 2.5"
      />
    </svg>
  );
}
