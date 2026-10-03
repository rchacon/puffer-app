import { toMidSentence, slugify } from "../shared/textUtils.mjs";

export const TOTAL_ROUNDS = 5;

export type Outcome = "defeat" | "survive-barely" | "survive-hurt" | "victory";

/** Map a final score (0..5) to the end-of-game outcome. */
export function getOutcome(score: number): Outcome {
  if (score >= 5) return "victory";
  if (score === 4) return "survive-hurt";
  if (score === 3) return "survive-barely";
  return "defeat";
}

/**
 * Puffer fish scale as a function of correct answers so far. Used both while
 * playing (it grows on each correct answer) and to size the final animation.
 */
export function pufferScale(score: number): number {
  return 1 + 0.24 * score;
}

// Re-exported so existing importers (ResultScreen, outcome.test.ts) don't
// need to reach into src/shared themselves -- outcome.ts stays the one
// place game text logic is imported from. The implementation lives in
// src/shared/textUtils.mjs so scripts/generate-audio.mjs can share it too,
// instead of a hand-duplicated copy that only a comment kept in sync.
export { toMidSentence };

/**
 * `predator` is the current level's subject phrase (see predators.ts),
 * e.g. "The shark" or "The two sharks" -- ready to drop into a sentence.
 * Only defeat/victory mention it; the survive outcomes only talk about the
 * puffer fish either way.
 */
export function outcomeText(outcome: Outcome, predator: string): { title: string; body: string } {
  switch (outcome) {
    case "defeat":
      return {
        title: "Chomp!",
        body: `${predator} caught the puffer fish this time. Try again!`,
      };
    case "survive-barely":
      return {
        title: "Phew — barely!",
        body: "The puffer fish took a big hit but wriggled away just in time.",
      };
    case "survive-hurt":
      return {
        title: "Close one!",
        body: "The puffer fish got away with only a little scratch.",
      };
    case "victory":
      return {
        title: "PUFFER POWER!",
        body: `The puffer fish puffed up huge and sent ${toMidSentence(predator)} packing!`,
      };
  }
}

/**
 * Which public/audio clip to play for the end-of-game outcome. defeat/victory
 * are predator-specific (see scripts/generate-audio.mjs, which generates
 * defeat-<slug>.mp3 / victory-<slug>.mp3 for every row in predators.ts's
 * PREDATOR_LEVELS, with text matching outcomeText above) so the voice names
 * the actual predator instead of always saying "the shark". Keyed by the
 * predator's own `label` (slugified), not its numeric level, so these
 * filenames don't need renaming every time levels get reordered -- see
 * AGENTS.md. The survive outcomes stay generic -- their text never mentions
 * the predator.
 */
export function outcomeAudioCue(outcome: Outcome, label: string): string {
  if (outcome === "defeat") return `defeat-${slugify(label)}`;
  if (outcome === "victory") return `victory-${slugify(label)}`;
  return outcome;
}
