import type { ComponentType } from "react";
import type { PredatorKind } from "../../game/predators";
import { Shark } from "../Shark";
import { Swordfish } from "./Swordfish";
import { FootballShark } from "./FootballShark";
import { GrandpaShark } from "./GrandpaShark";
import { SeaSerpent } from "./SeaSerpent";
import { Eel } from "./Eel";
import { Piranha } from "./Piranha";
import { Anglerfish } from "./Anglerfish";
import { TapahCatfish } from "./TapahCatfish";
import { SharkPrincess } from "./SharkPrincess";
import { Megalodon } from "./Megalodon";
import { Dunkleosteus } from "./Dunkleosteus";
import { Mosasaurus } from "./Mosasaurus";
import { Bloop } from "./Bloop";
import { Amargasaurus } from "./Amargasaurus";
import { Kraken } from "./Kraken";

export const PREDATOR_COMPONENTS: Record<PredatorKind, ComponentType> = {
  shark: Shark,
  swordfish: Swordfish,
  footballshark: FootballShark,
  grandpashark: GrandpaShark,
  seaserpent: SeaSerpent,
  eel: Eel,
  piranha: Piranha,
  anglerfish: Anglerfish,
  catfish: TapahCatfish,
  sharkprincess: SharkPrincess,
  megalodon: Megalodon,
  dunkleosteus: Dunkleosteus,
  mosasaurus: Mosasaurus,
  bloop: Bloop,
  amargasaurus: Amargasaurus,
  kraken: Kraken,
};

export interface SchoolOffset {
  dx: number;
  dy: number;
  scale: number;
}

/**
 * Per-instance position jitter for a "school" of `count` predators (any
 * level with `count > 1` -- not hardcoded to specific level numbers here,
 * since those keep shifting as levels get reordered; check
 * `PREDATOR_LEVELS` for which levels currently qualify), applied relative
 * to the shared approach position so the group retreats/flees together on
 * an outcome while keeping its formation. The Shark Princess's escort
 * is the one exception -- it supplies its own
 * `PredatorLevel.offsets` instead of using this table, since it wants
 * different relative sizing between its instances, not the uniform sizing
 * every entry here gives a school of same-kind creatures.
 */
const SCHOOL_OFFSETS: Record<number, SchoolOffset[]> = {
  1: [{ dx: 0, dy: 0, scale: 1 }],
  2: [
    { dx: 9, dy: -21, scale: 0.92 },
    { dx: -15, dy: 21, scale: 0.92 },
  ],
  // Tuned live against the electric eel level (the only current count-3
  // user) -- deliberately wider/smaller than 4's own numbers below despite
  // having fewer instances, since the eel art reads well at a distance and
  // the goal here was keeping every instance's mouth close to the
  // school's shared vertical center (so none of them reads as less of a
  // threat by sitting far above/below the puffer's own height), not
  // following 1/2/4/6/7's tighter-as-count-grows spacing trend.
  3: [
    { dx: 24, dy: -40, scale: 0.62 },
    { dx: -22, dy: 0, scale: 0.62 },
    { dx: 20, dy: 40, scale: 0.62 },
  ],
  4: [
    { dx: 18, dy: -32, scale: 0.72 },
    { dx: -12, dy: -9, scale: 0.72 },
    { dx: 15, dy: 15, scale: 0.72 },
    { dx: -9, dy: 37, scale: 0.72 },
  ],
  // 6 and 7 continue the same trend as 1-4: wider vertical spread, smaller
  // scale, dx alternating sign for a staggered (not single-file) look.
  6: [
    { dx: 16, dy: -55, scale: 0.55 },
    { dx: -14, dy: -33, scale: 0.55 },
    { dx: 12, dy: -11, scale: 0.55 },
    { dx: -10, dy: 11, scale: 0.55 },
    { dx: 14, dy: 33, scale: 0.55 },
    { dx: -12, dy: 55, scale: 0.55 },
  ],
  7: [
    { dx: 18, dy: -60, scale: 0.5 },
    { dx: -16, dy: -40, scale: 0.5 },
    { dx: 14, dy: -20, scale: 0.5 },
    { dx: -8, dy: 0, scale: 0.5 },
    { dx: 15, dy: 20, scale: 0.5 },
    { dx: -13, dy: 40, scale: 0.5 },
    { dx: 10, dy: 60, scale: 0.5 },
  ],
};

export function getSchoolOffsets(count: number): SchoolOffset[] {
  return SCHOOL_OFFSETS[count] ?? SCHOOL_OFFSETS[1];
}
