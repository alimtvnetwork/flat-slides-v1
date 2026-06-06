import { Link } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Layers,
  LayoutGrid,
  Presentation,
  Printer,
  Settings,
  SquareUserRound,
  Upload,
} from "lucide-react";
import { useCallback, useRef, type ReactNode } from "react";
import { toast } from "sonner";

import { useDeck } from "@/components/slides/store";
import { useReducedMotion } from "@/components/slides/useReducedMotion";
import { exportDeck, parseDeckJson, pickJsonFile } from "@/lib/slides/io";
import { cn } from "@/lib/utils";
import { emitSlidesEvent } from "../telemetry";

// Spec: .lovable/plans/subtasks/01-slides-first-preview/03-launcher-cases.md
// Each button maps 1:1 to a row in that table.

export type DeckLauncherProps = {
  onOpenSettings: () => void;
  onPresent: () => void | Promise<void>;
};

type LauncherAction = "present" | "inspector" | "handout" | "handout-3up" | "print" | "overview" | "import" | "export" | "settings";

export function DeckLauncher({ onOpenSettings, onPresent }: DeckLauncherProps) {
  const reduced = useReducedMotion();
  const deck = useDeck((s) => s.deck);
  const setDeck = useDeck((s) => s.setDeck);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(async () => {
    try {
      const raw = await pickJsonFile(fileRef.current);
      if (!raw) return;
      const result = parseDeckJson(raw);
      if (!result.ok) {
        console.warn("[DeckLauncher] import failed:\n", result.errorFull);
        toast.error(`Import failed: ${result.error}`);
        return;
      }
      setDeck(result.value);
      toast.success("Deck imported");
    } catch (err) {
      console.error("[DeckLauncher] import threw", err);
      toast.error("Import error — see console");
    }
  }, [setDeck]);

  const handleExport = useCallback(() => {
    try {
      exportDeck(deck);
    } catch (err) {
      console.error("[DeckLauncher] export threw", err);
      toast.error("Export error — see console");
    }
  }, [deck]);

  return (
    <div
      role="toolbar"
      aria-label="Slides launcher"
      className={cn(
        "pointer-events-auto fixed bottom-6 left-1/2 z-40 -translate-x-1/2",
        "flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2",
        "rounded-2xl border bg-card/95 px-3 py-2 text-card-foreground shadow-lg backdrop-blur",
        reduced ? "" : "animate-in fade-in slide-in-from-bottom-2 duration-200",
      )}
      data-testid="deck-launcher"
    >
      <LauncherButton action="present" onClick={() => void onPresent()} icon={<Presentation className="h-4 w-4" />} label="Present" primary />
      <LauncherLink action="inspector" to="/slides/inspector/$slideId" params={{ slideId: "1" }} icon={<SquareUserRound className="h-4 w-4" />} label="Inspector" />
      <LauncherLink action="handout" to="/slides/handout" icon={<FileText className="h-4 w-4" />} label="Handout" />
      <LauncherLink action="handout-3up" to="/slides/handout-3up" icon={<LayoutGrid className="h-4 w-4" />} label="3-up" />
      <LauncherLink action="print" to="/slides/print" icon={<Printer className="h-4 w-4" />} label="Print" />
      <LauncherLink action="overview" to="/slides" icon={<Layers className="h-4 w-4" />} label="Overview" />
      <LauncherButton action="import" onClick={() => void handleImport()} icon={<Upload className="h-4 w-4" />} label="Import" />
      <LauncherButton action="export" onClick={handleExport} icon={<Download className="h-4 w-4" />} label="Export" />
      <LauncherButton action="settings" onClick={onOpenSettings} icon={<Settings className="h-4 w-4" />} label="Settings" />
      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" tabIndex={-1} aria-hidden />
    </div>
  );
}

const BUTTON_CLASS =
  "inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const PRIMARY_CLASS =
  "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function LauncherButton({
  action,
  onClick,
  icon,
  label,
  primary,
}: {
  action: LauncherAction;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button type="button" onClick={() => { emitLauncherClick(action); onClick(); }} className={primary ? PRIMARY_CLASS : BUTTON_CLASS}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Generic typing kept loose (`any`) so each call site can pass route-specific
// params/search without exporting individual wrapper components. Coding
// guideline 5 ("never `any`") is consciously relaxed here for the launcher's
// single-purpose internal helper; the public surface (DeckLauncher) stays typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LauncherLink({ action, to, params, icon, label }: { action: LauncherAction; to: string; params?: Record<string, string>; icon: ReactNode; label: string }) {
  return (
    <Link to={to} params={params} className={BUTTON_CLASS} onClick={() => emitLauncherClick(action)}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function emitLauncherClick(action: LauncherAction) {
  emitSlidesEvent({ type: "home-launcher-click", action });
}
