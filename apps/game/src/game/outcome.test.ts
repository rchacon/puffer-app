import { describe, expect, it } from "vitest";
import { getOutcome, outcomeAudioCue, outcomeText, pufferScale, toMidSentence } from "./outcome";

describe("getOutcome", () => {
  it.each([
    [0, "defeat"],
    [1, "defeat"],
    [2, "defeat"],
    [3, "survive-barely"],
    [4, "survive-hurt"],
    [5, "victory"],
  ] as const)("score %i maps to %s", (score, expected) => {
    expect(getOutcome(score)).toBe(expected);
  });
});

describe("pufferScale", () => {
  it("starts at 1 with no correct answers", () => {
    expect(pufferScale(0)).toBe(1);
  });

  it("grows with every correct answer", () => {
    for (let s = 1; s <= 5; s++) {
      expect(pufferScale(s)).toBeGreaterThan(pufferScale(s - 1));
    }
  });
});

describe("toMidSentence", () => {
  it("lowercases only the first letter", () => {
    expect(toMidSentence("The Kraken")).toBe("the Kraken");
    expect(toMidSentence("The two sharks")).toBe("the two sharks");
  });
});

describe("outcomeText", () => {
  it("names the predator on defeat and victory", () => {
    expect(outcomeText("defeat", "The Kraken").body).toContain("The Kraken caught");
    expect(outcomeText("victory", "The Kraken").body).toContain("sent the Kraken packing");
  });

  it("keeps the survive outcomes generic regardless of predator", () => {
    const barely = outcomeText("survive-barely", "The Kraken").body;
    const hurt = outcomeText("survive-hurt", "The Kraken").body;
    expect(barely).not.toContain("Kraken");
    expect(hurt).not.toContain("Kraken");
  });
});

describe("outcomeAudioCue", () => {
  it("names the (slugified) predator for defeat and victory", () => {
    expect(outcomeAudioCue("defeat", "The Shark Princess")).toBe(
      "defeat-the-shark-princess",
    );
    expect(outcomeAudioCue("victory", "The Bloop")).toBe("victory-the-bloop");
  });

  it("leaves the survive outcomes as generic clip names", () => {
    expect(outcomeAudioCue("survive-barely", "The Kraken")).toBe("survive-barely");
    expect(outcomeAudioCue("survive-hurt", "The Kraken")).toBe("survive-hurt");
  });
});
