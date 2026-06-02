import {
  Boxes, BookOpen, Braces, Brain, Clipboard, Cloud, Code2, Container,
  Cpu, Database, FileCode2, GitBranch, GitMerge, Github, MessageSquare,
  Package, Server, Terminal, UserCheck, Workflow,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { useReducedMotion } from "../useReducedMotion";

/**
 * Decorative "coding journey" icon scatter for cover/center slides.
 *
 * Renders ~18 faded developer-tool marks at hand-tuned positions inside the
 * 1920×1080 slide space. Mixes Lucide glyphs (terminal, git, cloud, db…)
 * with brand-style inline SVGs (VS Code, JetBrains, AWS, Azure, OpenAI) so
 * the slide feels like a stack story rather than a clipart sheet.
 *
 * Design rules:
 * - Pure decoration. `aria-hidden`, `pointer-events: none`, `data-print-hide`.
 * - Opacity stays under ~22% so it never fights the headline.
 * - Subtle 8s drift loop; suppressed when prefers-reduced-motion is set.
 * - Sizes vary 36–88 px to break up the rhythm.
 */

type IconFn = ComponentType<SVGProps<SVGSVGElement>>;

const VsCodeMark: IconFn = (p) => (
  <svg viewBox="0 0 100 100" {...p}>
    <path
      fill="currentColor"
      d="M70 8 38 38 18 22 8 28v44l10 6 20-16 32 30 22-10V18zM38 50 70 22v56z"
      opacity="0.9"
    />
  </svg>
);

const JetBrainsMark: IconFn = (p) => (
  <svg viewBox="0 0 100 100" {...p}>
    <rect x="8" y="8" width="84" height="84" rx="14" fill="none" stroke="currentColor" strokeWidth="6" />
    <path d="M22 78h28" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <path d="M62 26v32a10 10 0 0 1-10 10h-6" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
  </svg>
);

const AwsMark: IconFn = (p) => (
  <svg viewBox="0 0 120 60" {...p}>
    <text x="0" y="38" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="800" fontSize="36" fill="currentColor" letterSpacing="-1">aws</text>
    <path d="M2 50 C 40 60 80 60 118 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
  </svg>
);

const AzureMark: IconFn = (p) => (
  <svg viewBox="0 0 100 100" {...p}>
    <path
      fill="currentColor"
      d="M38 12 14 76h22l28-46zM58 22 86 88H44l8-14h22L58 44z"
    />
  </svg>
);

const OpenAiMark: IconFn = (p) => (
  <svg viewBox="0 0 100 100" {...p}>
    <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
      <path d="M50 18 28 30v24l22 12 22-12V30z" />
      <path d="M28 30 50 42l22-12M50 42v24" />
    </g>
  </svg>
);

interface Mark {
  Icon: IconFn;
  /** 1920×1080 coordinates of the icon center. */
  x: number;
  y: number;
  size: number;
  /** Opacity 0–1 before global multiplier. */
  o?: number;
  /** Hue tint, default "white". */
  tint?: string;
  /** Drift delay seconds for the subtle loop. */
  delay?: number;
}

// Hand-tuned scatter — diagonals avoid the centred headline; brand marks
// (VS Code, JetBrains, AWS, Azure, OpenAI) anchor the corners.
const MARKS: Mark[] = [
  { Icon: VsCodeMark,    x: 760,  y: 200,  size: 72, tint: "#4ec9ff", o: 0.55, delay: 0.0 },
  { Icon: Terminal,      x: 1000, y: 170,  size: 52, o: 0.40, delay: 0.8 },
  { Icon: GitBranch,     x: 360,  y: 360,  size: 56, o: 0.35, delay: 0.4 },
  { Icon: MessageSquare, x: 240,  y: 600,  size: 50, o: 0.30, delay: 1.6 },
  { Icon: Clipboard,     x: 460,  y: 700,  size: 44, o: 0.28, delay: 2.0 },
  { Icon: Database,      x: 140,  y: 800,  size: 60, o: 0.32, delay: 0.6 },
  { Icon: Code2,         x: 200,  y: 880,  size: 44, o: 0.30, delay: 2.6 },
  { Icon: BookOpen,      x: 850,  y: 760,  size: 50, o: 0.30, delay: 1.2 },
  { Icon: Github,        x: 480,  y: 780,  size: 56, o: 0.45, delay: 0.2 },
  { Icon: Cloud,         x: 1030, y: 850,  size: 58, o: 0.40, delay: 1.4 },
  { Icon: Terminal,      x: 720,  y: 920,  size: 48, tint: "#9cdcfe", o: 0.45, delay: 2.2 },
  { Icon: UserCheck,     x: 1320, y: 580,  size: 56, o: 0.30, delay: 0.5 },
  { Icon: Boxes,         x: 1260, y: 680,  size: 64, o: 0.32, delay: 1.8 },
  { Icon: Brain,         x: 1480, y: 260,  size: 72, tint: "#ffb86b", o: 0.45, delay: 0.9 },
  { Icon: Cpu,           x: 1560, y: 380,  size: 56, o: 0.32, delay: 1.5 },
  { Icon: Workflow,      x: 1620, y: 760,  size: 58, o: 0.30, delay: 2.4 },
  { Icon: Server,        x: 1720, y: 880,  size: 50, o: 0.34, delay: 0.7 },
  { Icon: Container,     x: 1820, y: 540,  size: 50, o: 0.30, delay: 1.0 },
  { Icon: Braces,        x: 1820, y: 260,  size: 50, o: 0.34, delay: 1.7 },
  { Icon: FileCode2,     x: 100,  y: 240,  size: 50, o: 0.30, delay: 2.1 },
  { Icon: GitMerge,      x: 1140, y: 360,  size: 44, o: 0.28, delay: 1.3 },
  { Icon: Package,       x: 60,   y: 480,  size: 52, o: 0.28, delay: 2.5 },
  // Brand anchors
  { Icon: JetBrainsMark, x: 1700, y: 160,  size: 78, tint: "#fffadc", o: 0.40, delay: 0.3 },
  { Icon: AwsMark,       x: 1620, y: 980,  size: 96, tint: "#ffb86b", o: 0.45, delay: 1.1 },
  { Icon: AzureMark,     x: 220,  y: 160,  size: 78, tint: "#9cdcfe", o: 0.45, delay: 0.9 },
  { Icon: OpenAiMark,    x: 1380, y: 920,  size: 70, tint: "#cdebe0", o: 0.45, delay: 2.3 },
];

interface Props {
  /** Global opacity multiplier (default 1). Pass 0.6 over busy backgrounds. */
  intensity?: number;
}

export function CodeJourneyDecor({ intensity = 1 }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      aria-hidden
      data-print-hide
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    >
      <style>{`
        @keyframes code-decor-drift {
          0%   { transform: translate3d(0,0,0); }
          50%  { transform: translate3d(0,-6px,0); }
          100% { transform: translate3d(0,0,0); }
        }
      `}</style>
      {MARKS.map((m, i) => {
        const opacity = Math.min(0.6, (m.o ?? 0.32) * intensity);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: m.x - m.size / 2,
              top: m.y - m.size / 2,
              width: m.size,
              height: m.size,
              color: m.tint ?? "rgba(255,255,255,0.9)",
              opacity,
              animation: reduceMotion
                ? undefined
                : `code-decor-drift 8s ease-in-out ${m.delay ?? 0}s infinite`,
              filter: "drop-shadow(0 2px 14px rgba(0,0,0,0.35))",
            }}
          >
            <m.Icon width="100%" height="100%" strokeWidth={1.4} />
          </div>
        );
      })}
    </div>
  );
}

/** Heuristic auto-enable: cover/center slides with coding-themed text. */
export function shouldAutoEnableCodeDecor(text: string | undefined): boolean {
  if (!text) return false;
  return /\b(code|coding|coder|coders|ai|llm|cli|terminal|dev|developer|engineer|stack|github|cloud)\b/i.test(text);
}
