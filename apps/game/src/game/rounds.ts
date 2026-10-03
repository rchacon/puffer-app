import { WORDS } from "../data/words";

/** Fewest words a player may pick and still start a game. */
export const MIN_WORDS = 3;

export interface Round {
  target: string;
  options: string[];
  correctIndex: number;
}

function shuffle<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build one round for `target`, drawing two distractors from `pool`. */
export function buildRound(pool: readonly string[], target: string): Round {
  const others = pool.filter((w) => w !== target);
  // Prefer distractors with the same letter count so the choice is a real
  // reading task, then fall back to any remaining word.
  const preferred = shuffle(others.filter((w) => w.length === target.length));
  const rest = shuffle(others.filter((w) => w.length !== target.length));

  const distractors: string[] = [];
  for (const w of [...preferred, ...rest]) {
    if (distractors.length === 2) break;
    if (!distractors.includes(w)) distractors.push(w);
  }

  const options = shuffle([target, ...distractors]);
  return { target, options, correctIndex: options.indexOf(target) };
}

/**
 * Pick `count` target words from `pool`. With a pool of `count` or more this
 * returns distinct words; with a smaller pool words repeat, but never twice in
 * a row.
 */
function pickTargets(pool: readonly string[], count: number): string[] {
  const targets: string[] = [];
  let bag: string[] = [];
  while (targets.length < count) {
    if (bag.length === 0) bag = shuffle(pool);
    const candidate = bag.pop() as string;
    if (candidate === targets[targets.length - 1] && bag.length > 0) {
      // Would repeat the previous target -- take the next card instead and
      // drop this one back into the bag.
      const next = bag.pop() as string;
      bag.unshift(candidate);
      targets.push(next);
    } else {
      targets.push(candidate);
    }
  }
  return targets;
}

/** Build `count` rounds whose targets are drawn from `pool`. */
export function buildRounds(count = 5, pool: readonly string[] = WORDS): Round[] {
  const source = pool.length >= MIN_WORDS ? pool : WORDS;
  return pickTargets(source, count).map((target) => buildRound(source, target));
}
