import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGame } from "./useGame";

describe("useGame outcome audio", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("plays the predator-specific victory cue on a perfect game", () => {
    const audioSpy = vi.spyOn(window, "Audio");
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.start(["cat", "dog", "run", "big", "red"], "The seven piranhas");
    });

    for (let i = 0; i < 5; i++) {
      const round = result.current.state.rounds[result.current.state.roundIndex];
      act(() => {
        result.current.answer(round.correctIndex);
        vi.advanceTimersByTime(1600);
      });
    }

    expect(result.current.state.phase).toBe("result");
    const srcs = audioSpy.mock.calls.map((args) => String(args[0]));
    expect(srcs.some((s) => s.endsWith("/audio/victory-the-seven-piranhas.mp3"))).toBe(
      true,
    );
    expect(srcs.some((s) => /\/audio\/defeat-[a-z-]+\.mp3$/.test(s))).toBe(false);
  });

  it("plays the predator-specific defeat cue on a shutout, and defaults to the shark without one", () => {
    const audioSpy = vi.spyOn(window, "Audio");
    const { result } = renderHook(() => useGame());

    act(() => {
      // no label passed -> defaults to "The shark"
      result.current.start(["cat", "dog", "run", "big", "red"]);
    });

    for (let i = 0; i < 5; i++) {
      const round = result.current.state.rounds[result.current.state.roundIndex];
      const wrongIndex = (round.correctIndex + 1) % round.options.length;
      act(() => {
        result.current.answer(wrongIndex);
        vi.advanceTimersByTime(1600);
      });
    }

    expect(result.current.state.phase).toBe("result");
    const srcs = audioSpy.mock.calls.map((args) => String(args[0]));
    expect(srcs.some((s) => s.endsWith("/audio/defeat-the-shark.mp3"))).toBe(true);
  });

  it("debugOutcome uses the predator from the most recent start()", () => {
    const audioSpy = vi.spyOn(window, "Audio");
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.start(["cat", "dog", "run"], "The Shark Princess and her two brothers");
      result.current.debugOutcome(5);
    });

    const srcs = audioSpy.mock.calls.map((args) => String(args[0]));
    expect(
      srcs.some((s) =>
        s.endsWith("/audio/victory-the-shark-princess-and-her-two-brothers.mp3"),
      ),
    ).toBe(true);
  });
});

describe("useGame answerTyped", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("spelling every round correctly reaches the same victory cue path as answer()", () => {
    const audioSpy = vi.spyOn(window, "Audio");
    const { result } = renderHook(() => useGame());

    // A pool/label not reused by any other test in this file -- player.ts
    // caches Audio elements by src, so reusing a combination another test
    // already played would mean this predator's clip was already
    // constructed and wouldn't show up again in *this* test's own spy.
    act(() => {
      result.current.start(["see", "you", "can", "not", "get"], "The anglerfish");
    });

    for (let i = 0; i < 5; i++) {
      const round = result.current.state.rounds[result.current.state.roundIndex];
      act(() => {
        result.current.answerTyped(round.target);
        vi.advanceTimersByTime(1600);
      });
    }

    expect(result.current.state.phase).toBe("result");
    const srcs = audioSpy.mock.calls.map((args) => String(args[0]));
    expect(srcs.some((s) => s.endsWith("/audio/victory-the-anglerfish.mp3"))).toBe(true);
  });

  it("spelling wrong reaches the reveal phase with lastCorrect false and pickedIndex -1", () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.start(["cat", "dog", "run"]);
    });

    const round = result.current.state.rounds[0];
    const wrong = "z".repeat(round.target.length);
    act(() => {
      result.current.answerTyped(wrong);
    });

    expect(result.current.state.phase).toBe("reveal");
    expect(result.current.state.lastCorrect).toBe(false);
    expect(result.current.state.pickedIndex).toBe(-1);
  });

  it("is case-insensitive", () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.start(["cat", "dog", "run"]);
    });

    const round = result.current.state.rounds[0];
    act(() => {
      result.current.answerTyped(round.target.toUpperCase());
    });

    expect(result.current.state.lastCorrect).toBe(true);
  });

  it("no-ops on a length mismatch", () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.start(["cat", "dog", "run"]);
    });

    const round = result.current.state.rounds[0];
    act(() => {
      result.current.answerTyped(round.target + "x");
    });

    expect(result.current.state.phase).toBe("playing");
  });

  it("no-ops outside the playing phase", () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.start(["cat", "dog", "run"]);
    });

    const round = result.current.state.rounds[0];
    act(() => {
      result.current.answerTyped(round.target);
    });
    expect(result.current.state.phase).toBe("reveal");

    // A stray second call while already in reveal must be a no-op, not
    // double-score the round.
    const scoreDuringReveal = result.current.state.score;
    act(() => {
      result.current.answerTyped(round.target);
    });
    expect(result.current.state.score).toBe(scoreDuringReveal);
  });
});
