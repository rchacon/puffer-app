// Which threat the puffer fish faces each playthrough. Purely visual/thematic
// -- TOTAL_ROUNDS, getOutcome and pufferScale in outcome.ts never change with
// the level; only what's drawn in BattleScene and the result-screen wording do.

export type PredatorKind =
  | "shark"
  | "swordfish"
  | "footballshark"
  | "grandpashark"
  | "seaserpent"
  | "eel"
  | "piranha"
  | "anglerfish"
  | "catfish"
  | "sharkprincess"
  | "megalodon"
  | "dunkleosteus"
  | "mosasaurus"
  | "bloop"
  | "amargasaurus"
  | "kraken";

/** Per-instance position jitter -- same shape as (and structurally
 *  compatible with) components/predators/index.ts's own `SchoolOffset`,
 *  redeclared here instead of imported so this file stays component-free
 *  game logic (see AGENTS.md's "src/game/" layout note). */
export interface PredatorOffset {
  dx: number;
  dy: number;
  scale: number;
}

export interface PredatorLevel {
  /**
   * 1-indexed position in `PREDATOR_LEVELS` -- derived from array order
   * (see the `.map()` below `PREDATOR_LEVEL_ENTRIES`), never hand-written
   * on an entry. Inserting/reordering a level is then just moving its
   * object in the array; nothing else needs renumbering.
   */
  level: number;
  /** Primary kind -- drives the approach curve lookup, ShipWreck/Kraken
   *  check, and (for a mixed-kind level like the Shark Princess's escort)
   *  is the one `kinds` doesn't need to repeat for every instance. */
  kind: PredatorKind;
  /** How many instances BattleScene renders (only >1 for a school -- the
   *  two-shark level, the Shark Princess's escort, the grandpa/football
   *  shark pair, and the piranha/eel schools below; everything else is a
   *  solo predator). */
  count: number;
  /**
   * Per-instance kind override, same length as `count`, for a level that
   * mixes creatures instead of rendering `count` copies of `kind` (the
   * Shark Princess's two escort sharks, the grandpa/football shark pair).
   * Omit for every plain same-kind
   * school; BattleScene falls back to `count` copies of `kind` when this
   * isn't set.
   */
  kinds?: PredatorKind[];
  /**
   * Per-instance position/scale override, same length as `count`, for a
   * level that wants different relative sizing/prominence between its
   * instances instead of `getSchoolOffsets(count)`'s generic same-size
   * formation (the Shark Princess kept large and up front, her escort
   * sharks smaller and behind her). Array order is also draw order --
   * later entries render on top. Omit to use the generic formation.
   */
  offsets?: PredatorOffset[];
  /** Ready-to-use sentence subject, e.g. "The shark", "The two sharks". */
  label: string;
  /**
   * Skip rendering Coral/Kelp for this level (BattleScene draws them
   * outright, not just dimmed like the rest of the seabed). Four
   * different reasons so far, one per level below: the Anglerfish is
   * photosynthetic reef life, and neither grows this deep past where any
   * sunlight reaches; the Bloop and Dunkleosteus just read better against
   * open, uncluttered seabed at the scale they're drawn; the Amargasaurus
   * level is a shallow freshwater lake, not a reef, so neither grows
   * there at all. Omit (falsy) for every level that keeps the normal
   * reef.
   */
  skipsReefDecor?: boolean;
}

// 1-indexed position (`PredatorLevel.level`) is computed below from
// array order, not written per-entry -- see that field's own doc
// comment for why. Order here is play order.
const PREDATOR_LEVEL_ENTRIES: Omit<PredatorLevel, "level">[] = [
  { kind: "shark", count: 1, label: "The shark" },
  { kind: "shark", count: 2, label: "The two sharks" },
  { kind: "sharkprincess", count: 1, label: "The Shark Princess" },
  {
    kind: "sharkprincess",
    count: 3,
    // Order is also draw order (later = on top): the two brothers first
    // (smaller, tucked behind), the Princess last -- same position/scale
    // (dx=0, dy=0, scale=1) as her solo level-3 appearance, not just
    // "full size" in the abstract, so the two actually look identical in
    // size. The brothers are small and spread further apart than the
    // first attempt at this: at a bigger scale/tighter spacing they
    // overlapped her enough to make her read as smaller than she actually
    // is, even though her own scale was already 1 -- the occlusion was
    // the problem, not her size.
    kinds: ["shark", "shark", "sharkprincess"],
    offsets: [
      { dx: 24, dy: -44, scale: 0.4 },
      { dx: 20, dy: 56, scale: 0.4 },
      { dx: 0, dy: 0, scale: 1 },
    ],
    label: "The Shark Princess and her two brothers",
  },
  { kind: "swordfish", count: 1, label: "The swordfish" },
  { kind: "footballshark", count: 1, label: "The football shark" },
  { kind: "grandpashark", count: 1, label: "The grandpa shark" },
  {
    kind: "grandpashark",
    count: 2,
    // A same-size pair, so the generic getSchoolOffsets(2) formation fits
    // as-is (no `offsets` override, unlike the Princess's escort above).
    // Grandpa is drawn last, on top, as the level's named lead.
    kinds: ["footballshark", "grandpashark"],
    label: "The grandpa shark and the football shark",
  },
  {
    kind: "dunkleosteus",
    count: 1,
    label: "The Dunkleosteus",
    skipsReefDecor: true,
  },
  { kind: "seaserpent", count: 1, label: "The sea serpent" },
  { kind: "mosasaurus", count: 1, label: "The Mosasaurus" },
  { kind: "piranha", count: 7, label: "The seven piranhas" },
  { kind: "megalodon", count: 1, label: "The Megalodon" }, // boss fight
  { kind: "eel", count: 3, label: "The three electric eels" },
  { kind: "anglerfish", count: 1, label: "The anglerfish", skipsReefDecor: true },
  { kind: "bloop", count: 1, label: "The Bloop", skipsReefDecor: true }, // boss fight
  { kind: "amargasaurus", count: 1, label: "The Amargasaurus", skipsReefDecor: true },
  { kind: "kraken", count: 1, label: "The Kraken" }, // final boss fight
];

export const PREDATOR_LEVELS: PredatorLevel[] = PREDATOR_LEVEL_ENTRIES.map((p, i) => ({
  ...p,
  level: i + 1,
}));

/**
 * Resolve the predator for the `playCount`-th game started this session
 * (1 = the very first game). Cycles back to level 1 after the Kraken.
 */
export function getPredatorLevel(playCount: number): PredatorLevel {
  const idx = (Math.max(1, Math.trunc(playCount)) - 1) % PREDATOR_LEVELS.length;
  return PREDATOR_LEVELS[idx];
}

/**
 * The kind to render at each of `predator.count` instance positions --
 * `predator.kinds` if this level mixes creatures, else `count` copies of
 * `predator.kind`. BattleScene indexes this in lockstep with
 * `getSchoolOffsets(predator.count)`.
 */
export function getInstanceKinds(predator: PredatorLevel): PredatorKind[] {
  return predator.kinds ?? Array(predator.count).fill(predator.kind);
}
