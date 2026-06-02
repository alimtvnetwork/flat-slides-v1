import { SlideLayout } from "./SlideLayout";

/** Reproduction of spec/01-sample.webp — "Project Glasswing". */
export function SampleGlasswing() {
  return (
    <SlideLayout background="#101010">
      <div className="flex h-full w-full items-center justify-center">
        <h1 className="slide-display slide-title-lg text-center" style={{ color: "#F4EFE4" }}>
          Project
          <br />
          Glasswing
        </h1>
      </div>
    </SlideLayout>
  );
}

/** Reproduction of spec/02-sample.webp — "Don't make me Think". */
export function SampleDontMakeMeThink() {
  return (
    <SlideLayout background="#000000">
      <div className="flex h-full w-full flex-col items-center justify-center gap-[36px]">
        <p className="slide-heading text-white text-center" style={{ fontSize: 110, fontWeight: 600 }}>
          Don&rsquo;t make me
        </p>
        <div className="relative">
          <span
            className="hl-pill slide-heading"
            style={{ fontSize: 200, lineHeight: 1, padding: "0.18em 0.7em" }}
          >
            Think
          </span>
          {/* Pointer cursor mark */}
          <svg
            viewBox="0 0 64 80"
            className="absolute"
            style={{ width: 120, right: 90, bottom: -70 }}
            aria-hidden
          >
            <path
              d="M16 8c0-3 5-3 5 0v30l4-4c2-2 6 0 5 3l-2 6 6-1c3 0 5 3 3 6l-3 4 4 1c3 1 3 5 0 7l-12 7c-6 3-13 1-17-5L4 50c-2-3 0-7 3-7l9 1V8z"
              fill="white"
              stroke="#101010"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </SlideLayout>
  );
}

/** Reproduction of spec/03-sample.jpg — "Sajida Proposal" with fake app chrome. */
export function SampleSajidaProposal() {
  return (
    <SlideLayout background="#1d1d1d">
      {/* Fake top app chrome */}
      <div className="absolute inset-x-0 top-0 h-[58px] bg-[#262626] flex items-center px-4 gap-4 text-[#cfcfcf]" style={{ fontSize: 18 }}>
        <span className="rounded-md bg-[#3a3a3a] px-3 py-1">Untitled •</span>
        <span className="opacity-60">+</span>
        <span className="ml-6">File</span>
        <span>Edit</span>
        <span>View</span>
        <span className="ml-auto flex gap-3 opacity-70">
          <span>H1</span><span>•</span><span>B</span><span>I</span><span>S</span><span>🔗</span><span>⊞</span>
        </span>
      </div>
      {/* Body */}
      <div className="absolute inset-0 top-[58px] bottom-[64px] flex items-center">
        <div className="w-[45%] pl-[120px]">
          <h1 className="slide-heading" style={{ fontSize: 130, fontWeight: 300, lineHeight: 1.05, color: "#EDEDED" }}>
            Sajida
            <br />
            Proposal
          </h1>
        </div>
        <div className="w-[55%] flex justify-center">
          <div
            className="bg-[#2a2520] flex items-center justify-center text-[#888]"
            style={{
              width: 560,
              height: 600,
              borderRadius: "42% 42% 38% 38% / 38% 38% 42% 42%",
              boxShadow: "inset 0 -30px 60px rgba(255,140,0,0.18), 0 30px 80px rgba(0,0,0,0.5)",
            }}
          >
            <span className="slide-caption">presenter photo</span>
          </div>
        </div>
      </div>
      {/* Fake bottom brand bar */}
      <div className="absolute inset-x-0 bottom-0 h-[64px] bg-black flex items-center justify-between px-6 text-white" style={{ fontSize: 26, fontWeight: 700 }}>
        <span>R<span className="hl">i</span>seup<span className="hl">Asia</span></span>
        <span>R<span className="hl">i</span>seup<span className="hl">Pro</span></span>
      </div>
    </SlideLayout>
  );
}
