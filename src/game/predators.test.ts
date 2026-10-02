import { describe, expect, it } from "vitest";
import { getInstanceKinds, getPredatorLevel, PREDATOR_LEVELS } from "./predators";
import { getSchoolOffsets, PREDATOR_COMPONENTS } from "../components/predators";

describe("getPredatorLevel", () => {
  it("returns level 1 through the last level for playCount 1..N", () => {
    for (let i = 1; i <= PREDATOR_LEVELS.length; i++) {
      expect(getPredatorLevel(i).level).toBe(i);
    }
  });

  it("cycles back to level 1 after the Kraken", () => {
    const n = PREDATOR_LEVELS.length;
    expect(getPredatorLevel(n + 1).level).toBe(1);
    expect(getPredatorLevel(n * 2).level).toBe(n);
    expect(getPredatorLevel(n * 2 + 1).level).toBe(1);
  });

  it("treats 0 or negative playCount as the first game", () => {
    expect(getPredatorLevel(0).level).toBe(1);
    expect(getPredatorLevel(-5).level).toBe(1);
  });
});

describe("PREDATOR_LEVELS", () => {
  it("numbers every level 1..N in array order", () => {
    // `level` is derived from array position (see predators.ts), so this
    // is really pinning that derivation, not a hardcoded expectation --
    // stays correct no matter how many levels there are or how they're
    // ordered.
    expect(PREDATOR_LEVELS.map((p) => p.level)).toEqual(
      PREDATOR_LEVELS.map((_, i) => i + 1),
    );
  });

  it("only the school levels have more than one instance", () => {
    // Named by label, not level number -- these schools' *positions*
    // shift as levels get reordered, but which ones are schools at all
    // doesn't, so this stays correct across a reorder without editing.
    const schoolLabels = new Set([
      "The two sharks",
      "The Shark Princess and her two brothers",
      "The grandpa shark and the football shark",
      "The seven piranhas",
      "The three electric eels",
    ]);
    for (const p of PREDATOR_LEVELS) {
      expect(p.count > 1).toBe(schoolLabels.has(p.label));
    }
  });

  it("every kind has a matching illustration component", () => {
    for (const p of PREDATOR_LEVELS) {
      expect(PREDATOR_COMPONENTS[p.kind]).toBeTypeOf("function");
    }
  });

  it("every level's count has a matching school offset entry", () => {
    // getSchoolOffsets() silently falls back to SCHOOL_OFFSETS[1] for any
    // count it doesn't recognize -- which would render every instance of a
    // school stacked on top of each other instead of failing loudly. This
    // catches a new/edited level whose count outgrew the offset table.
    for (const p of PREDATOR_LEVELS) {
      expect(getSchoolOffsets(p.count)).toHaveLength(p.count);
    }
  });

  it("every level's instance kinds match its count and have a component", () => {
    // getInstanceKinds() is what BattleScene actually indexes alongside
    // getSchoolOffsets() -- a `kinds` array shorter/longer than `count`
    // (or naming a kind with no illustration) would render the wrong
    // creature, or none, at some position rather than failing loudly.
    for (const p of PREDATOR_LEVELS) {
      const kinds = getInstanceKinds(p);
      expect(kinds).toHaveLength(p.count);
      for (const kind of kinds) {
        expect(PREDATOR_COMPONENTS[kind]).toBeTypeOf("function");
      }
    }
  });

  it("every level's custom offsets (if any) match its count", () => {
    // Mirrors the school-offset-length check above, for the levels that
    // opt out of the generic getSchoolOffsets() formation via their own
    // `offsets` -- BattleScene indexes this by position too, so a
    // mismatched length would leave some instance without a position.
    for (const p of PREDATOR_LEVELS) {
      if (p.offsets) expect(p.offsets).toHaveLength(p.count);
    }
  });

  it("the Shark Princess's escort level keeps her bigger and drawn on top", () => {
    // BattleScene draws `offsets` in array order, later on top -- and
    // indexes `kinds` in lockstep with it. This pins both assumptions
    // together so reordering one without the other doesn't silently draw
    // a brother shark on top at full size instead of the Princess.
    // Found by label, not level number -- her escort's *position* shifts
    // as levels get reordered, but her label doesn't.
    const escort = PREDATOR_LEVELS.find(
      (p) => p.label === "The Shark Princess and her two brothers",
    );
    expect(escort).toBeDefined();
    expect(getInstanceKinds(escort!)).toEqual(["shark", "shark", "sharkprincess"]);
    const offsets = escort!.offsets ?? getSchoolOffsets(escort!.count);
    expect(offsets.at(-1)!.scale).toBeGreaterThan(offsets[0].scale);
    expect(offsets.at(-1)!.scale).toBeGreaterThan(offsets[1].scale);
  });
});
