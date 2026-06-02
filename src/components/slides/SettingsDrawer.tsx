import { useDeck } from "./store";
import type { TransitionKind } from "./types";

const TRANSITIONS: TransitionKind[] = ["camera-zoom", "morph", "fade", "eaten"];

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useDeck((s) => s.deck.settings);
  const setSettings = useDeck((s) => s.setSettings);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-[360px] bg-neutral-950 p-6 text-neutral-200 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">✕</button>
        </div>

        <section className="mb-6 space-y-2">
          <label className="text-xs uppercase tracking-wider text-neutral-400">Background</label>
          <div className="flex gap-2">
            {(["color", "image"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSettings({ backgroundMode: mode })}
                className={`flex-1 rounded px-3 py-1 text-sm ${
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
        </section>

        <section className="mb-6 space-y-2">
          <label className="text-xs uppercase tracking-wider text-neutral-400">Darken ({settings.darken}%)</label>
          <input
            type="range" min={0} max={100} value={settings.darken}
            onChange={(e) => setSettings({ darken: Number(e.target.value) })}
            className="w-full"
          />
          <label className="text-xs uppercase tracking-wider text-neutral-400">Blur ({settings.blur}px)</label>
          <input
            type="range" min={0} max={20} value={settings.blur}
            onChange={(e) => setSettings({ blur: Number(e.target.value) })}
            className="w-full"
          />
        </section>

        <section className="mb-6 space-y-2">
          <label className="text-xs uppercase tracking-wider text-neutral-400">Transition</label>
          <select
            value={settings.transition}
            onChange={(e) => setSettings({ transition: e.target.value as TransitionKind })}
            className="w-full rounded bg-neutral-800 px-2 py-1 text-sm"
          >
            {TRANSITIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </section>

        <section className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
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
      </aside>
    </div>
  );
}
