import { describe, expect, it } from "vitest";
import { buildRound, buildRounds } from "./rounds";
import { WORDS } from "../data/words";

function assertWellFormed(rounds: ReturnType<typeof buildRounds>, pool: string[]) {
  for (const round of rounds) {
    expect(round.options).toHaveLength(3);
    expect(new Set(round.options).size).toBe(3);
    expect(round.options).toContain(round.target);
    expect(round.options[round.correctIndex]).toBe(round.target);
    for (const option of round.options) expect(pool).toContain(option);
  }
}

describe("buildRounds", () => {
  it("creates the requested number of rounds", () => {
    expect(buildRounds(5)).toHaveLength(5);
  });

  it("uses distinct target words when the pool is large enough", () => {
    const targets = buildRounds(5).map((r) => r.target);
    expect(new Set(targets).size).toBe(5);
  });

  it("gives each round 3 unique known options with the target at correctIndex", () => {
    assertWellFormed(buildRounds(5), WORDS);
  });

  it("still builds 5 rounds from a 3-word pool, without repeating a target back to back", () => {
    const pool = ["cat", "dog", "run"];
    for (let attempt = 0; attempt < 40; attempt++) {
      const rounds = buildRounds(5, pool);
      expect(rounds).toHaveLength(5);
      assertWellFormed(rounds, pool);
      for (let i = 1; i < rounds.length; i++) {
        expect(rounds[i].target).not.toBe(rounds[i - 1].target);
      }
    }
  });

  it("works with a 4-word pool too", () => {
    const pool = ["this", "that", "play", "jump"];
    const rounds = buildRounds(5, pool);
    expect(rounds).toHaveLength(5);
    assertWellFormed(rounds, pool);
  });

  it("falls back to the full bank when given fewer than the minimum", () => {
    const rounds = buildRounds(5, ["cat", "dog"]);
    expect(rounds).toHaveLength(5);
    assertWellFormed(rounds, WORDS);
  });
});

describe("buildRound", () => {
  it("prefers distractors with the same letter count when available", () => {
    const pool = ["cat", "dog", "run", "big", "a", "I"];
    const round = buildRound(pool, "cat");
    for (const option of round.options) {
      expect(option).toHaveLength(3);
    }
  });
});
