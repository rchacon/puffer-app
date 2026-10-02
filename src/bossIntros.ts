import type { ComponentType } from "react";
import type { PredatorKind } from "./game/predators";
import krakenMusic from "./assets/kraken-music.wav";
import megalodonMusic from "./assets/megalodon-music.wav";
import bloopSound from "./assets/bloop-sound.wav";
import amargasaurusMusic from "./assets/amargasaurus-music.wav";
import { KrakenIntro } from "./components/KrakenIntro";
import { MegalodonIntro } from "./components/MegalodonIntro";
import { BloopIntro } from "./components/BloopIntro";
import { AmargasaurusIntro } from "./components/AmargasaurusIntro";

export interface BossIntro {
  Component: ComponentType;
  /** Omitted for a boss whose intro doesn't need a spoken line -- the
   *  Bloop plays its own real recording instead (see `music` there). */
  voiceCue?: string;
  music?: { url: string; volume: number };
  durationMs: number;
}

// Title-card flourish played before round 1 of a boss-fight level (one
// with `isBossFight: true` in predators.ts), and every time the cycle
// comes back around to it. Which levels are boss fights lives only on
// those entries; this table just holds each boss kind's own intro card,
// voice line and music sting, keyed by kind so a future boss adds a row
// here, not another copy of the intro/timer/guard flow in App.tsx's
// handleStart. predators.test.ts checks every boss-fight level has a row.
export const BOSS_INTROS: Partial<Record<PredatorKind, BossIntro>> = {
  kraken: {
    Component: KrakenIntro,
    voiceCue: "release-the-kraken",
    // Trimmed to 2s with a fade-out baked in (see src/assets/kraken-music.wav's
    // provenance in AGENTS.md) -- quieter than full volume so the voice line
    // stays clear on top of it.
    music: { url: krakenMusic, volume: 0.55 },
    durationMs: 2100,
  },
  megalodon: {
    Component: MegalodonIntro,
    voiceCue: "bigger-boat",
    // See src/assets/megalodon-music.wav's provenance in AGENTS.md --
    // same "quieter than full volume, voice line stays clear on top"
    // reasoning as the Kraken's own music.
    music: { url: megalodonMusic, volume: 0.6 },
    durationMs: 2400,
  },
  bloop: {
    Component: BloopIntro,
    // No voiceCue -- the actual NOAA recording (see AGENTS.md for
    // provenance) plays instead of a synthesized line, at full volume
    // since it's the point of this boss, not background ambience under
    // one. durationMs covers its own ~4.7s (trimmed, fades baked in) plus
    // a beat of margin after the fade-out finishes.
    music: { url: bloopSound, volume: 0.9 },
    durationMs: 4900,
  },
  amargasaurus: {
    Component: AmargasaurusIntro,
    voiceCue: "move-in-herds",
    // See src/assets/amargasaurus-music.wav's provenance in AGENTS.md --
    // same "quieter than full volume, voice line stays clear on top"
    // reasoning as the Kraken's/Megalodon's own music. durationMs covers
    // its own trimmed ~2.6s (fades baked in) rather than the voice
    // line's shorter ~2s, so the music's own fade-out finishes instead
    // of getting cut off mid-swell.
    music: { url: amargasaurusMusic, volume: 0.55 },
    durationMs: 2700,
  },
};
