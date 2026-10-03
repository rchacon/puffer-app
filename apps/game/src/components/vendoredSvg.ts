const ROOT_SVG_TAG = /<svg\b[^>]*>/;
const DIMENSION_ATTR = /\s(?:width|height|x|y)=(?:"[^"]*"|'[^']*')/g;

/**
 * Strips `width`/`height`/`x`/`y` from a vendored SVG's own root
 * `<svg ...>` tag (only the first one -- nested `<svg>`s, if any, are left
 * alone), keeping its `viewBox`. Needed before nesting the raw markup
 * inside another sized `<svg>` via `dangerouslySetInnerHTML` (the pattern
 * every vendored creature/Puffer uses): a nested `<svg>` establishes its
 * own independent viewport, so if the source's own tag *also* declares
 * absolute width/height, those apply on top of -- not instead of -- the
 * outer wrapper's viewBox scaling, rendering content oversized and
 * silently clipped by the nested tag's default `overflow: hidden`. `x`/`y`
 * are meaningless on a standalone root `<svg>` (browsers ignore them
 * there) but do take effect once nested like this, so they're stripped
 * too even though no vendored source here has needed that yet.
 *
 * Safe to apply unconditionally to every vendored SVG, not just ones known
 * to have the problem: a source whose width/height happen to already
 * equal its own viewBox numbers in the same (unitless) units --
 * `shark.svg`, for instance -- is unaffected by removing them, since
 * `viewBox` alone is enough to size it correctly once wrapped.
 *
 * Only handles double- or single-quoted attributes on that one tag, the
 * forms every vendored source here actually uses (same caveat as
 * `scopeIds.ts`) -- won't catch e.g. an unquoted `width=800` or one
 * reasserted via an inline `style="width:...`. Check for those before
 * trusting this on a differently-authored source file.
 *
 * This bit twice before existing: the Mosasaurus's PhyloPic silhouette
 * (`pt` units) and the Puffer's `pufferfish.svg` (`px` units), both fixed
 * by hand-deleting the attributes from the vendored file itself, with only
 * a comment warning the next vendored asset might need the same fix. This
 * makes that automatic instead of relying on remembering to check.
 */
export function stripRootSvgDimensions(svg: string): string {
  return svg.replace(ROOT_SVG_TAG, (tag) => tag.replace(DIMENSION_ATTR, ""));
}
