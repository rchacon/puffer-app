// Plain JS (not .ts) so scripts/generate-audio.mjs -- a zero-dependency Node
// script with no build step -- can import it directly, same as the app code.
// See textUtils.d.mts alongside for the type declaration TypeScript needs.

/**
 * Lowercase just the first letter, for mid-sentence use ("The Kraken" -> "the Kraken").
 * @param {string} label
 * @returns {string}
 */
export function toMidSentence(label) {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * A predator's own `label` (e.g. "The Shark Princess and her two
 * brothers") turned into a filename-safe, stable key ("the-shark-princess-
 * and-her-two-brothers") -- used for its defeat/victory audio clips
 * instead of its numeric level, so those filenames don't need renaming
 * every time levels get reordered (see AGENTS.md). Labels are already
 * unique per level (they're spoken text, duplicates would be a bug on
 * their own), so this is a safe key without adding a separate field.
 * @param {string} label
 * @returns {string}
 */
export function slugify(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
