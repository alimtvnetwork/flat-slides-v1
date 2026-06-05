import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  configureDeckMusic,
  resetDeckMusicPlayerForTest,
  setDeckMusicPlaying,
} from "./deckMusicPlayer";

type FakeAudio = Pick<HTMLAudioElement, "currentTime" | "loop" | "pause" | "play" | "preload" | "src" | "volume">;

function makeAudio(src = ""): FakeAudio {
  return { currentTime: 9, loop: false, pause: vi.fn(), play: vi.fn(() => Promise.resolve()), preload: "", src, volume: 1 };
}

describe("deck music player", () => {
  const created: FakeAudio[] = [];

  beforeEach(() => {
    const AudioMock = vi.fn((src?: string) => {
      const audio = makeAudio(src);
      created.push(audio);
      return audio;
    });
    vi.stubGlobal("Audio", AudioMock);
  });

  afterEach(() => {
    resetDeckMusicPlayerForTest();
    created.length = 0;
    vi.unstubAllGlobals();
  });

  it("uses one shared audio element for repeated configuration", () => {
    configureDeckMusic({ url: "/music/a.mp3" }, 0.4);
    configureDeckMusic({ url: "/music/a.mp3", loop: false }, 0.7);

    expect(created).toHaveLength(1);
    expect(created[0]?.src).toBe("/music/a.mp3");
    expect(created[0]?.loop).toBe(false);
    expect(created[0]?.volume).toBe(0.7);
  });

  it("stops before each play toggle", async () => {
    configureDeckMusic({ url: "/music/a.mp3" }, 0.4);
    setDeckMusicPlaying(true);
    setDeckMusicPlaying(true);

    const audio = created[0];
    expect(audio?.pause).toHaveBeenCalledTimes(2);
    expect(audio?.play).toHaveBeenCalledTimes(2);
    expect(audio?.currentTime).toBe(0);
  });
});