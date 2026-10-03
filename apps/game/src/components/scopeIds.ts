import { useId, useMemo } from "react";

const ID_ATTR = /\bid="([^"]+)"/g;

/**
 * Vendored SVGs with internal <defs>/gradients/filters (like kraken.svg or
 * shark-princess.svg) get their ids hand-prefixed when there's only ever
 * one on screen (see kraken.svg's "kraken-" prefix). Some creatures are
 * different: they're rendered `count` times at once (a school, see
 * getSchoolOffsets -- Piranha and, since it's vendored art too, Shark), so
 * the SAME raw markup -- and the SAME ids -- get injected into the DOM
 * several times simultaneously. A static prefix baked into the file
 * wouldn't help there; every instance needs its OWN unique ids so
 * `url(#...)` references can't resolve to a sibling instance's
 * gradient/filter definition instead of its own (duplicate ids are invalid
 * HTML/SVG, and which element "wins" a fragment lookup isn't something
 * worth relying on across browsers).
 *
 * Only handles the forms an Inkscape/Illustrator export actually uses:
 * double-quoted `id="..."`, `url(#...)`, and `(xlink:)href="#..."`. Won't
 * catch single-quoted attributes, an id referenced from a `<style>` block,
 * or a SMIL `begin="other.click"`-style reference -- check for those before
 * reusing this on a differently-authored source file.
 */
export function scopeIds(svg: string, suffix: string): string {
  const ids = [...new Set(Array.from(svg.matchAll(ID_ATTR), (m) => m[1]))];
  if (ids.length === 0) return svg;

  // One regex pass over the ORIGINAL string, not N sequential full-string
  // replaceAll calls -- String.replace with a global regex never rescans
  // its own output, so the rename is atomic. Doing this as sequential
  // replaceAll calls could merge two originally-distinct ids into one if
  // some id happened to equal another id + "-" + suffix: renaming the
  // first would collide with the second, and the second's own (later)
  // rename would then apply to both at once.
  const alt = ids.map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pattern = new RegExp(`id="(${alt})"|url\\(#(${alt})\\)|((?:xlink:)?href="#)(${alt})"`, "g");
  return svg.replace(pattern, (_match, idMatch, urlMatch, hrefPrefix, hrefMatch) => {
    if (idMatch !== undefined) return `id="${idMatch}-${suffix}"`;
    if (urlMatch !== undefined) return `url(#${urlMatch}-${suffix})`;
    return `${hrefPrefix}${hrefMatch}-${suffix}"`;
  });
}

/** Rewrites `svg`'s ids to be unique to this component instance, memoized. */
export function useScopedSvg(svg: string): string {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return useMemo(() => scopeIds(svg, uid), [svg, uid]);
}
