// Remembers which sight words the player chose to practise, in localStorage.
// Every access is guarded: private-mode browsers and disabled storage throw,
// and a stale/corrupt value should never break the start screen.

const KEY = "puffer-panic:selected-words";

/**
 * The saved selection, filtered to words that still exist in `allWords`.
 * Falls back to the full list when nothing is stored, the value is unreadable,
 * or nothing valid survives the filter.
 */
export function loadSelection(allWords: string[]): string[] {
  // Always hand back a fresh array -- the result becomes React state and must
  // never be an alias of the caller's word-bank constant.
  const fallback = () => [...allWords];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback();
    const known = new Set(allWords);
    const valid = parsed.filter((w): w is string => typeof w === "string" && known.has(w));
    return valid.length > 0 ? valid : fallback();
  } catch {
    return fallback();
  }
}

export function saveSelection(words: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(words));
  } catch {
    // storage unavailable -- selection just won't persist
  }
}
