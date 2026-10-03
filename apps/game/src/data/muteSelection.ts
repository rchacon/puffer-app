// Remembers whether the player muted the background music, in localStorage.
// Same guarded-access reasoning as modeSelection.ts: private-mode browsers
// and disabled storage throw, and a stale/corrupt value should never break
// the game. Stored as "1"/"0"; anything else means "not muted" (music on).

const KEY = "puffer-panic:muted";

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {
    // storage unavailable -- the choice just won't persist
  }
}
