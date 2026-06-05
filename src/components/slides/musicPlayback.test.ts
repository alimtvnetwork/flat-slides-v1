import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CROSSFADE_MS,
  configureDeckMusic,
  resetDeckMusicPlayerForTest,
  setDeckMusicPlaying,
} from "./deckMusicPlayer";

type FakeAudio = Pick<HTMLAudioElement, "currentTime" | "loop" | "pause" | "play" | "preload" | "src" | "volume">;

const created: FakeAudio[] = [];

function makeAudio(src = ""): FakeAudio {
  return {
    currentTime: 0,
    loop: false,
    pause: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    preload: "",
    src,
    volume: 1,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  created.length = 0;
  const AudioMock = vi.fn(function AudioStub(this: FakeAudio, src?: string) {
    Object.assign(this, makeAudio(src));
    created.push(this);
  });
  vi.stubGlobal("Audio", AudioMock);
});

afterEach(() => {
  resetDeckMusicPlayerForTest();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("per-slide music override + crossfade", () => {
  it("crossfades to a new URL within CROSSFADE_MS while playing", async () => {
    configureDeckMusic({ url: "/music/deck.mp3" }, 50);
    await setDeckMusicPlaying(true);
    const deck = created[0];

    configureDeckMusic({ url: "/music/slide.mp3" }, 50);
    expect(created).toHaveLength(2);
    const slide = created[1];
    expect(slide.volume).toBe(0);
    expect(slide.play).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(CROSSFADE_MS);
    expect(deck.pause).toHaveBeenCalled();
    expect(slide.volume).toBeCloseTo(0.5);
  });

  it("does not crossfade when not currently playing", () => {
    configureDeckMusic({ url: "/music/deck.mp3" }, 80);
    configureDeckMusic({ url: "/music/slide.mp3" }, 80);

    expect(created).toHaveLength(2);
    expect(created[1].play).not.toHaveBeenCalled();
    expect(created[1].volume).toBe(0.8);
  });

  it("reverts to deck music when override clears (still playing)", async () => {
    configureDeckMusic({ url: "/music/deck.mp3" }, 40);
    await setDeckMusicPlaying(true);

    configureDeckMusic({ url: "/music/slide.mp3" }, 40);
    vi.advanceTimersByTime(CROSSFADE_MS);

    configureDeckMusic({ url: "/music/deck.mp3" }, 40);
    expect(created).toHaveLength(3);
    expect(created[2].src).toBe("/music/deck.mp3");
    expect(created[2].play).toHaveBeenCalled();
  });
});
