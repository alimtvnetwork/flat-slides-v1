import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Download,
  Focus,
  Image as ImageIcon,
  Palette,
  PenLine,
  RotateCcw,
  Settings as SettingsIcon,
  Sparkles,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  exportDeck,
  exportSlide,
  parseDeckJson,
  parseSlideJson,
  pickJsonFile,
} from "@/lib/slides/io";
// Inline-loaded LLM spec sample deck (see docs/slides/spec/llm-json-guideline.md).
import sampleDeckJson from "../../../docs/slides/spec/sample-deck.json?raw";

import { useAnnotations } from "./annotations-store";
import { useChrome } from "./chrome-store";
import { useDeck } from "./store";
import { DEFAULT_THEME_ID, THEMES } from "./themes";
import type { TransitionKind } from "./types";

const TRANSITIONS: TransitionKind[] = ["camera-zoom", "morph", "fade", "eaten"];

const PALETTE_PRESETS = ["#101010", "#000000", "#1d1d1d", "#0c2340", "#1b0d1f", "#f5f0e6"];

export function SettingsDrawer({
  open,
  onClose,
  currentSlideId,
}: {
  open: boolean;
  onClose: () => void;
  currentSlideId?: string;
}) {
  const deck = useDeck((s) => s.deck);
  const themeId = useDeck((s) => s.themeId);
  const setSettings = useDeck((s) => s.setSettings);
  const setThemeId = useDeck((s) => s.setThemeId);
  const setDeck = useDeck((s) => s.setDeck);
  const upsertSlide = useDeck((s) => s.upsertSlide);
  const resetDeck = useDeck((s) => s.resetDeck);
  const settings = deck.settings;
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleImportDeck = async () => {
    const text = await pickJsonFile();
    if (!text) return;
    const r = parseDeckJson(text);
    if (!r.ok) return toast.error(`Import failed:\n${r.error}`, { duration: 8000 });
    setDeck(r.value);
    toast.success(`Imported deck "${r.value.title}" (${r.value.slides.length} slides)`);
  };

  const handleImportSlide = async () => {
    const text = await pickJsonFile();
    if (!text) return;
    const r = parseSlideJson(text);
    if (!r.ok) return toast.error(`Import failed:\n${r.error}`, { duration: 8000 });
    upsertSlide(r.value);
    toast.success(`Imported slide "${r.value.id}"`);
  };

  const handleLoadSpecSample = () => {
    const r = parseDeckJson(sampleDeckJson);
    if (!r.ok) return toast.error(`Spec sample failed to parse:\n${r.error}`, { duration: 8000 });
    setDeck(r.value);
    toast.success(`Loaded spec sample deck (${r.value.slides.length} slides)`);
  };


  const handleExportSlide = () => {
    const target = deck.slides.find((s) => s.id === currentSlideId) ?? deck.slides[0];
    if (!target) return toast.error("No slide to export");
    exportSlide(target);
    toast.success(`Exported ${target.id}.slide.json`);
  };

  return (
    <div className="fixed inset-0 z-50 flex" data-app-chrome>
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-[400px] bg-neutral-950 p-6 text-neutral-200 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <SettingsIcon size={16} className="text-neutral-400" /> Settings
          </h2>
          <button onClick={onClose} aria-label="Close settings" className="inline-flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <X size={14} />
          </button>
        </div>

        {/* Theme */}
        <section className="mb-6 space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <Palette size={12} /> Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`flex flex-col items-stretch gap-1 rounded p-2 text-left text-xs ring-1 transition ${
                  (themeId ?? DEFAULT_THEME_ID) === t.id
                    ? "ring-white"
                    : "ring-neutral-800 hover:ring-neutral-600"
                }`}
                style={{ background: t.bg, color: t.fg }}
              >
                <span className="font-semibold">{t.name}</span>
                <span className="flex gap-1">
                  <span className="h-3 w-3 rounded-sm" style={{ background: t.fg }} />
                  <span className="h-3 w-3 rounded-sm" style={{ background: t.muted }} />
                  <span className="h-3 w-3 rounded-sm" style={{ background: t.hl }} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Background color */}
        <section className="mb-6 space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <ImageIcon size={12} /> Background
          </label>
          <div className="flex gap-2">
            {(["color", "image"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSettings({ backgroundMode: mode })}
                className={`flex-1 rounded px-3 py-1 text-sm capitalize ${
                  settings.backgroundMode === mode
                    ? "bg-neutral-700 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => setSettings({ backgroundColor: e.target.value })}
            className="h-10 w-full rounded bg-neutral-800"
          />
          <div className="flex flex-wrap gap-1">
            {PALETTE_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setSettings({ backgroundColor: c })}
                title={c}
                className="h-7 w-7 rounded ring-1 ring-neutral-700 hover:ring-white"
                style={{ background: c }}
              />
            ))}
          </div>
        </section>

        <section className="mb-6 space-y-2">
          <label className="text-xs uppercase tracking-wider text-neutral-400">
            Darken ({settings.darken}%)
          </label>
          <input
            type="range" min={0} max={100} value={settings.darken}
            onChange={(e) => setSettings({ darken: Number(e.target.value) })}
            className="w-full"
          />
          <label className="text-xs uppercase tracking-wider text-neutral-400">
            Blur ({settings.blur}px)
          </label>
          <input
            type="range" min={0} max={20} value={settings.blur}
            onChange={(e) => setSettings({ blur: Number(e.target.value) })}
            className="w-full"
          />
        </section>

        <section className="mb-6 space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <ArrowLeftRight size={12} /> Transition
          </label>
          <select
            value={settings.transition}
            onChange={(e) => setSettings({ transition: e.target.value as TransitionKind })}
            className="w-full rounded bg-neutral-800 px-2 py-1 text-sm"
          >
            {TRANSITIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </section>

        <section className="mb-6 space-y-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <Volume2 size={13} className="text-neutral-400" />
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => setSettings({ soundEnabled: e.target.checked })}
            />
            Whoosh sound
          </label>
          <input
            type="range" min={0} max={1} step={0.05} value={settings.volume}
            onChange={(e) => setSettings({ volume: Number(e.target.value) })}
            className="w-full"
            disabled={!settings.soundEnabled}
          />
        </section>

        {/* Import / Export */}
        <section className="space-y-2 border-t border-neutral-800 pt-4">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <Upload size={12} /> Import / Export
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleImportDeck}
              className="inline-flex items-center justify-center gap-1.5 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
            >
              <Upload size={13} /> Import deck
            </button>
            <button
              onClick={() => exportDeck(deck)}
              className="inline-flex items-center justify-center gap-1.5 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
            >
              <Download size={13} /> Export deck
            </button>
            <button
              onClick={handleImportSlide}
              className="inline-flex items-center justify-center gap-1.5 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
            >
              <Upload size={13} /> Import slide
            </button>
            <button
              onClick={handleExportSlide}
              className="inline-flex items-center justify-center gap-1.5 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
            >
              <Download size={13} /> Export slide
            </button>
            <button
              onClick={handleLoadSpecSample}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
              title="Load docs/slides/spec/sample-deck.json"
            >
              <Sparkles size={13} /> Try spec sample deck
            </button>
            <button
              onClick={() => {
                resetDeck();
                toast.success("Reset to sample deck");
              }}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
            >
              <RotateCcw size={13} /> Reset sample deck
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            See the{" "}
            <Link to="/slides/spec" className="underline decoration-neutral-600 underline-offset-2 hover:text-neutral-300">
              JSON spec
            </Link>{" "}
            any LLM can write.
          </p>
          <input ref={fileRef} type="file" className="hidden" accept="application/json" />
        </section>

        {/* Presenter tools */}
        <section className="mb-6 space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <PenLine size={12} /> Presenter tools
          </label>
          <button
            type="button"
            onClick={() => { useChrome.getState().toggleFocusEditor(); onClose(); }}
            className="inline-flex w-full items-center gap-2 rounded bg-neutral-800 px-3 py-2 text-left text-sm hover:bg-neutral-700"
          >
            <Focus size={13} /> Edit focus regions <span className="ml-auto text-neutral-500">(F)</span>
          </button>
          <label className="mt-2 flex items-center justify-between gap-3 rounded bg-neutral-900 px-3 py-2 text-sm">
            <span>
              Persist annotations across reloads
              <span className="block text-[11px] text-neutral-500">Stores ink strokes in this browser.</span>
            </span>
            <input
              type="checkbox"
              checked={useAnnotations((s) => s.persistStrokes)}
              onChange={(e) => useAnnotations.getState().setPersist(e.target.checked)}
            />
          </label>
        </section>
      </aside>
    </div>
  );
}
