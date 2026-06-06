import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Download,
  Focus,
  Image as ImageIcon,
  Palette,
  PenLine,
  Printer,
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
import { MAX_MUSIC_VOLUME, MIN_MUSIC_VOLUME, MUSIC_VOLUME_STEP } from "@/lib/slides/musicVolume";
// Inline-loaded LLM spec (see docs/slides/spec/llm-json-guideline.md).
import sampleDeckJson from "../../../docs/slides/spec/sample-deck.json?raw";
import llmGuidelineMd from "../../../docs/slides/spec/llm-json-guideline.md?raw";

import { useAnnotations } from "./annotations-store";
import { nextBackgroundSettings } from "./backgroundMode";
import { devResetCachedDeck } from "./devResetDeck";
import { DevSlidesEventsPanel } from "./DevSlidesEventsPanel";
import { useChrome } from "./chrome-store";
import { EXPORT_PAPERS, exportUrl, type ExportPaper } from "./exportPaper";
import { getDefaultDeckSettings } from "./settingsPersistence";
import { useDeck } from "./store";
import { DEFAULT_THEME_ID, THEMES } from "./themes";
import type { TransitionKind } from "./types";

const TRANSITIONS: TransitionKind[] = ["fade", "camera-zoom"];

const PALETTE_PRESETS = ["#101010", "#000000", "#1d1d1d", "#0c2340", "#1b0d1f", "#f5f0e6"];
const EXPORT_PAPER_LABELS: Record<ExportPaper, string> = { wide: "Wide", letter: "Letter", a4: "A4" };
const EXPORT_OPTIONS = [
  { label: "Deck PDF", path: "/slides/print" },
  { label: "Speaker handout", path: "/slides/handout" },
  { label: "3-up handout", path: "/slides/handout-3up" },
];

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
  const isTopJumperHidden = useChrome((s) => s.topJumperHidden);
  const isDotPaginationVisible = useChrome((s) => s.dotPaginationVisible);
  const isSlideNumberBadgeVisible = useChrome((s) => s.slideNumberBadgeVisible);
  const setTopJumperHidden = useChrome((s) => s.setTopJumperHidden);
  const setDotPaginationVisible = useChrome((s) => s.setDotPaginationVisible);
  const setSlideNumberBadgeVisible = useChrome((s) => s.setSlideNumberBadgeVisible);
  const camera = useChrome((s) => s.camera);
  const setCamera = useChrome((s) => s.setCamera);
  const cycleCameraSize = useChrome((s) => s.cycleCameraSize);
  const cycleCameraAnchor = useChrome((s) => s.cycleCameraAnchor);
  const cycleCameraShape = useChrome((s) => s.cycleCameraShape);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const goToFirstSlide = () => {
    try { void navigate({ to: "/slides/$slideId", params: { slideId: "1" } }); }
    catch { /* router may not be mounted in tests */ }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  const importErrorToast = (label: string, r: { error: string; errorFull: string; errorCount: number }) => {
    console.warn(`[slides:${label}] full validation error:\n${r.errorFull}`);
    toast.error(`${label}:\n${r.error}`, {
      duration: 10000,
      description: r.errorCount > 4 ? `${r.errorCount} issues — click Copy for full list` : undefined,
      action: {
        label: "Copy full error",
        onClick: () => navigator.clipboard?.writeText(r.errorFull).catch((e) => console.warn("clipboard write failed", e)),
      },
    });
  };

  const handleImportDeck = async () => {
    const text = await pickJsonFile(fileRef.current);
    if (!text) return;
    const r = parseDeckJson(text);
    if (!r.ok) return importErrorToast("Import failed", r);
    setDeck(r.value);
    goToFirstSlide();
    toast.success(`Imported deck "${r.value.title}" (${r.value.slides.length} slides)`);
  };

  const handleImportSlide = async () => {
    const text = await pickJsonFile(fileRef.current);
    if (!text) return;
    const r = parseSlideJson(text);
    if (!r.ok) return importErrorToast("Import failed", r);
    upsertSlide(r.value);
    toast.success(`Imported slide "${r.value.id}"`);
  };

  const handleLoadSpecSample = () => {
    const r = parseDeckJson(sampleDeckJson);
    if (!r.ok) return importErrorToast("Spec sample failed to parse", r);
    setDeck(r.value);
    goToFirstSlide();
    toast.success(`Loaded spec sample deck (${r.value.slides.length} slides)`);
  };


  const handleExportSlide = () => {
    const target = deck.slides.find((s) => s.id === currentSlideId) ?? deck.slides[0];
    if (!target) return toast.error("No slide to export");
    exportSlide(target);
    toast.success(`Exported ${target.id}.slide.json`);
  };

  const openExport = (path: string, paper: ExportPaper) => {
    window.open(exportUrl(path, paper), "_blank", "noopener,noreferrer");
  };

  const handleDownloadGuide = async () => {
    try {
      const { zipSync, strToU8 } = await import("fflate");
      const zipped = zipSync({
        "README.txt": strToU8(
          "Glasswing — LLM JSON deck guide\n\n" +
            "1. llm-json-guideline.md — full spec (slide types, RichText, highlights, images, focus regions).\n" +
            "2. sample-deck.json     — canonical deck JSON that validates against the spec.\n\n" +
            "Feed both files to your LLM, ask it to emit a deck.json that matches the schema, then Import via Settings.\n",
        ),
        "llm-json-guideline.md": strToU8(llmGuidelineMd),
        "sample-deck.json": strToU8(sampleDeckJson),
      });
      const blob = new Blob([zipped], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "glasswing-llm-guide.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Downloaded glasswing-llm-guide.zip");
    } catch (error) {
      console.error("[settings:guide] download failed", error);
      toast.error("Guide download failed — see console for details");
    }
  };


  return (
    <div
      className="fixed flex"
      style={{ zIndex: "var(--z-drawer)" as unknown as number }}
      data-presenter-frame-bound="true"
      data-app-chrome
    >
      <div className="flex-1 bg-transparent" onClick={onClose} />
      <aside className="w-[min(400px,var(--presenter-frame-width))] bg-neutral-950 p-6 text-neutral-200 overflow-y-auto">
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
            {(["color", "dark", "image"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSettings(nextBackgroundSettings(settings, mode))}
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
            onChange={(e) => setSettings({ backgroundMode: "color", backgroundColor: e.target.value })}
            className="h-10 w-full rounded bg-neutral-800"
          />
          <div className="flex flex-wrap gap-1">
            {PALETTE_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setSettings({ backgroundMode: "color", backgroundColor: c })}
                title={c}
                className="h-7 w-7 rounded ring-1 ring-neutral-700 hover:ring-white"
                style={{ background: c }}
              />
            ))}
          </div>
          {settings.backgroundMode === "image" ? (
            <input
              type="url"
              value={settings.backgroundImage ?? ""}
              onChange={(e) => setSettings({ backgroundMode: "image", backgroundImage: e.target.value.trim() })}
              onPaste={(e) => setSettings({ backgroundMode: "image", backgroundImage: e.clipboardData.getData("text").trim() })}
              placeholder="Paste image URL"
              className="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none ring-1 ring-neutral-700 placeholder:text-neutral-500 focus:ring-neutral-400"
            />
          ) : null}
        </section>

        <section className="mb-6 space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <PenLine size={12} /> Text color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.textColor ?? "#ffffff"}
              onChange={(e) => setSettings({ textColor: e.target.value })}
              className="h-10 w-20 rounded bg-neutral-800"
            />
            <button
              onClick={() => setSettings({ textColor: undefined })}
              className="flex-1 rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-300 hover:text-white"
            >
              Auto (theme)
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {["#ffffff", "#fafafa", "#e5e5e5", "#a3a3a3", "#101010", "#000000"].map((c) => (
              <button
                key={c}
                onClick={() => setSettings({ textColor: c })}
                title={c}
                className="h-7 w-7 rounded ring-1 ring-neutral-700 hover:ring-white"
                style={{ background: c }}
              />
            ))}
          </div>
        </section>

        <section className="mb-6 space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <PenLine size={12} /> Highlight color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.hlColor ?? "#ffd83a"}
              onChange={(e) => setSettings({ hlColor: e.target.value })}
              className="h-10 w-20 rounded bg-neutral-800"
            />
            <button
              onClick={() => setSettings({ hlColor: undefined })}
              className="flex-1 rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-300 hover:text-white"
            >
              Auto (theme)
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {["#ffd83a", "#fde047", "#fb923c", "#f472b6", "#a3e635", "#22d3ee"].map((c) => (
              <button
                key={c}
                onClick={() => setSettings({ hlColor: c })}
                title={c}
                className="h-7 w-7 rounded ring-1 ring-neutral-700 hover:ring-white"
                style={{ background: c }}
              />
            ))}
          </div>
        </section>

        <section className="mb-6 space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <Download size={12} /> LLM guide
          </label>
          <p className="text-xs text-neutral-500">
            Spec + sample deck. Feed both to ChatGPT/Claude/etc. and ask for a deck.json, then Import.
          </p>
          <button
            onClick={handleDownloadGuide}
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 ring-1 ring-neutral-700 hover:bg-neutral-700"
          >
            <Download size={14} /> Download guide (.zip)
          </button>
        </section>

        <section className="mb-6 space-y-3">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <SettingsIcon size={12} /> Visibility
          </label>
          <label className="flex items-center justify-between gap-3 rounded bg-neutral-900 px-3 py-2 text-sm">
            <span>Presenter top bar <span className="ml-1 text-neutral-500">(J)</span></span>
            <input type="checkbox" checked={!isTopJumperHidden} onChange={(e) => setTopJumperHidden(!e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded bg-neutral-900 px-3 py-2 text-sm">
            <span>Slide number badge</span>
            <input type="checkbox" checked={isSlideNumberBadgeVisible} onChange={(e) => setSlideNumberBadgeVisible(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded bg-neutral-900 px-3 py-2 text-sm">
            <span>Dot pagination</span>
            <input type="checkbox" checked={isDotPaginationVisible} onChange={(e) => setDotPaginationVisible(e.target.checked)} />
          </label>
          <div className="rounded bg-neutral-900 px-3 py-2 text-sm text-neutral-400">
            Controller indicator shows while the controller is expanded.
          </div>
        </section>

        <section className="mb-6 space-y-3">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <SettingsIcon size={12} /> Camera
          </label>
          <label className="flex items-center justify-between gap-3 rounded bg-neutral-900 px-3 py-2 text-sm">
            <span>Show camera</span>
            <input type="checkbox" checked={camera.visible} onChange={(e) => setCamera({ visible: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded bg-neutral-900 px-3 py-2 text-sm">
            <span>Only in fullscreen</span>
            <input type="checkbox" checked={camera.fullscreenOnly} onChange={(e) => setCamera({ fullscreenOnly: e.target.checked })} />
          </label>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {(["circle", "squircle", "rect"] as const).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => setCamera({ shape })}
                className={`rounded px-3 py-2 capitalize ring-1 ${camera.shape === shape ? "bg-neutral-700 text-white ring-neutral-400" : "bg-neutral-800 text-neutral-400 ring-neutral-700 hover:text-white"}`}
              >
                {shape}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={cycleCameraShape} className="rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700">Cycle shape</button>
            <button type="button" onClick={cycleCameraSize} className="rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700">Cycle size</button>
            <button type="button" onClick={cycleCameraAnchor} className="rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700">Move corner</button>
          </div>
          <div className="flex gap-2">
            {(["color", "image"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCamera({ backgroundMode: mode })}
                className={`flex-1 rounded px-3 py-1 text-sm capitalize ${camera.backgroundMode === mode ? "bg-neutral-700 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}
              >
                Camera {mode}
              </button>
            ))}
          </div>
          <input
            type="color"
            value={camera.backgroundColor}
            onChange={(e) => setCamera({ backgroundMode: "color", backgroundColor: e.target.value })}
            className="h-9 w-full rounded bg-neutral-800"
          />
          <input
            type="url"
            value={camera.backgroundImage}
            onChange={(e) => setCamera({ backgroundMode: "image", backgroundImage: e.target.value })}
            placeholder="https://… camera background image"
            className="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none ring-1 ring-neutral-700 placeholder:text-neutral-500 focus:ring-neutral-400"
          />
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
          <label className="text-xs uppercase tracking-wider text-neutral-400">
            Music volume ({settings.musicVolume}%)
          </label>
          <input
            type="range" min={MIN_MUSIC_VOLUME} max={MAX_MUSIC_VOLUME} step={MUSIC_VOLUME_STEP} value={settings.musicVolume}
            onChange={(e) => setSettings({ musicVolume: Number(e.target.value) })}
            className="w-full"
          />
          <button
            type="button"
            onClick={() => {
              setSettings(getDefaultDeckSettings());
              toast.success("Reset settings to defaults");
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
          >
            <RotateCcw size={13} /> Reset settings
          </button>
        </section>

        {/* Import / Export */}
        <section className="space-y-2 border-t border-neutral-800 pt-4">
          <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
            <Upload size={12} /> Import / Export
          </label>
          <p className="text-[11px] leading-snug text-neutral-500">
            Imported decks are stored in this browser only (<code className="font-mono text-neutral-400">localStorage: slides-deck-v1</code>). They do not sync across browsers or devices — re-export the JSON to share. Full contract: <code className="font-mono text-neutral-400">docs/slides/spec/import-export.spec.md</code>.
          </p>
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
            {EXPORT_OPTIONS.map((option) => (
              <div key={option.path} className="col-span-2 grid grid-cols-4 gap-1.5 rounded bg-neutral-900 p-1.5">
                <span className="flex items-center gap-1.5 px-2 text-sm text-neutral-300">
                  <Printer size={13} /> {option.label}
                </span>
                {EXPORT_PAPERS.map((paper) => (
                  <button
                    key={paper}
                    type="button"
                    onClick={() => openExport(option.path, paper)}
                    className="rounded bg-neutral-800 px-2 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
                    title={`Export ${option.label} as ${EXPORT_PAPER_LABELS[paper]} PDF`}
                  >
                    {EXPORT_PAPER_LABELS[paper]}
                  </button>
                ))}
              </div>
            ))}
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
          <input
            ref={fileRef}
            type="file"
            aria-hidden="true"
            tabIndex={-1}
            accept=".json,application/json"
            className="pointer-events-none fixed h-px w-px opacity-0"
          />
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

        {import.meta.env.DEV ? (
          <section className="mb-6 space-y-2">
            <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
              <RotateCcw size={12} /> Dev
            </label>
            <DevSlidesEventsPanel />
            <button
              type="button"
              data-testid="dev-reset-cached-deck"
              onClick={async () => {
                try {
                  await devResetCachedDeck();
                  toast.success("Cached deck cleared", { description: "Reloaded the default deck." });
                  onClose();
                } catch (err) {
                  console.error("[SettingsDrawer] devResetCachedDeck failed", err);
                  toast.error("Couldn't clear cached deck", { description: (err as Error)?.message });
                }
              }}
              className="inline-flex w-full items-center gap-2 rounded bg-neutral-800 px-3 py-2 text-left text-sm hover:bg-neutral-700"
            >
              <RotateCcw size={13} /> Reset cached deck
              <span className="ml-auto text-[11px] text-neutral-500">HMR fix (issue 018)</span>
            </button>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
