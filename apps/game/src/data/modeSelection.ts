// Remembers which mode the player chose (tap-the-card vs. spell-it-out), in
// localStorage. Every access is guarded: private-mode browsers and disabled
// storage throw, and a stale/corrupt value should never break the start
// screen -- same reasoning as wordSelection.ts, just for a scalar instead of
// a filtered array, so no JSON encoding is needed.

export type Mode = "easy" | "hard";

const KEY = "puffer-panic:mode";
const DEFAULT_MODE: Mode = "easy";

function isMode(value: unknown): value is Mode {
  return value === "easy" || value === "hard";
}

export function loadMode(): Mode {
  try {
    const raw = localStorage.getItem(KEY);
    return isMode(raw) ? raw : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function saveMode(mode: Mode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // storage unavailable -- mode just won't persist
  }
}
