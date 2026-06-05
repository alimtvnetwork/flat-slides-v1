/**
 * Presenter Inspector (B22) — standalone speaker view.
 *
 * Step 2 scaffold: renders a minimal placeholder so the routes resolve.
 * Full layout (current slide + next slide + notes + timer) lands in Step 3.
 * See `docs/slides/spec/presenter-inspector.spec.md`.
 */
export interface PresenterInspectorProps {
  slideId: string;
  step?: string;
}

export function PresenterInspector({ slideId, step }: PresenterInspectorProps) {
  return (
    <main
      aria-label="Presenter inspector"
      className="min-h-screen w-full bg-neutral-950 p-8 text-white/90"
    >
      <header className="text-sm uppercase tracking-widest text-white/50">
        Presenter Inspector
      </header>
      <p className="mt-4 text-2xl">
        Slide {slideId}
        {step ? ` · Step ${step}` : ""}
      </p>
      <p className="mt-2 text-sm text-white/50">
        Layout, notes, and timer land in Step 3.
      </p>
    </main>
  );
}
