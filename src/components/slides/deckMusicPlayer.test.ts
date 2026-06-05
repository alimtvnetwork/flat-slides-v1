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
    const AudioMock = vi.fn(function AudioStub(this: FakeAudio, src?: string) {
      Object.assign(this, makeAudio(src));
      created.push(this);
    });
    vi.stubGlobal("Audio", AudioMock);
  });

  afterEach(() => {
    resetDeckMusicPlayerForTest();
    created.length = 0;
    vi.unstubAllGlobals();
  });

  it("uses one shared audio element for repeated configuration", () => {
    configureDeckMusic({ url: "/music/a.mp3" }, 40);
    configureDeckMusic({ url: "/music/a.mp3", loop: false }, 70);

    expect(created).toHaveLength(1);
    expect(created[0]?.src).toBe("/music/a.mp3");
    expect(created[0]?.loop).toBe(false);
    expect(created[0]?.volume).toBe(0.7);
  });

  it("converts settings musicVolume percent into audio gain", () => {
    configureDeckMusic({ url: "/music/a.mp3" }, 25);

    expect(created[0]?.volume).toBe(0.25);
  });

  it("stops before each play toggle", async () => {
    configureDeckMusic({ url: "/music/a.mp3" }, 40);
    await setDeckMusicPlaying(true);
    await setDeckMusicPlaying(true);

    const audio = created[0];
    expect(audio?.pause).toHaveBeenCalledTimes(2);
    expect(audio?.play).toHaveBeenCalledTimes(2);
    expect(audio?.currentTime).toBe(0);
  });

  it("reports autoplay block on NotAllowedError", async () => {
    const err = Object.assign(new Error("blocked"), { name: "NotAllowedError" });
    configureDeckMusic({ url: "/music/a.mp3" }, 40);
    const audio = created[0] as FakeAudio;
    (audio.play as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err);
    const result = await setDeckMusicPlaying(true);
    expect(result).toEqual({ ok: false, blocked: true });
  });
});