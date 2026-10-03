import rawPufferArtwork from "../assets/pufferfish.svg?raw";
import { stripRootSvgDimensions } from "./vendoredSvg";

// The source's own root <svg> carries width="800px" height="800px"
// alongside its viewBox -- see vendoredSvg.ts for why that has to come out
// before nesting this inside the wrapper below.
const strippedPufferArtwork = stripRootSvgDimensions(rawPufferArtwork);

// A friendlier face than the source draws on its own: a white eye glint,
// and its neutral/frown mouth actually replaced by a smile (not just a
// smile added alongside it -- the two read as a mustache-and-mouth combo
// otherwise). The pupil itself is a plain, standalone, easily-editable
// `<path>` (a circle at 456,172 r=16, the very last element in the file) --
// the glint is just added on top of it rather than restyling it directly,
// since drawing a new shape is simpler than round-tripping through the
// path's own `d` attribute for what's a purely additive effect anyway. The
// mouth is a different story: unlike the pupil, it has no standalone path
// of its own -- it's fused into the file's one giant compound outline path
// (three subpaths total in that one `d` string: the main silhouette, one
// small fin-shading detail, and a ~4800-character remainder covering the
// mouth, gill lines, etc., joined by connecting bridges, not cleanly
// separable). With no "mouth path" to delete, an opaque patch in the
// source's own flat local fill color (#FFD77D, confirmed by sampling a
// rendered preview -- solid, not part of a gradient, so a flat patch has
// no visible seam) is drawn first to cover the original mouth, then the
// smile on top of that patch.
//
// Coordinates are in the source's own viewBox (0 0 512.001 512.001),
// found by rendering the source with a temporary labeled coordinate grid
// overlaid (10-unit spacing) and reading the pupil/mouth positions off of
// it directly -- pixel-measuring a plain screenshot and converting back to
// viewBox units (via the polka-dot grid's known spacing) turned out
// unreliable: a dot happened to sit close enough to the true pupil to be
// mistaken for it, and the mouth patch sized from that estimate missed
// the actual mouth shape entirely on the first attempt. Appended into the
// *source's own* nested `<svg>` (by string-inserting before its closing
// tag) rather than added as sibling JSX, so they share that inner
// coordinate space directly without needing their own positioned wrapper.
const FRIENDLY_FACE =
  '<ellipse cx="468" cy="232" rx="29" ry="14" fill="#FFD77D"/>' +
  '<circle cx="446" cy="180" r="7" fill="#ffffff"/>' +
  '<path d="M440,226 Q468,246 496,224" fill="none" stroke="#1a1a1a" ' +
  'stroke-width="8" stroke-linecap="round"/>';
const CLOSING_SVG_TAG = /<\/svg>\s*$/;
if (!CLOSING_SVG_TAG.test(strippedPufferArtwork)) {
  // Fail loudly at load time rather than silently shipping the source's
  // original frown/no-glint face -- if pufferfish.svg is ever re-vendored
  // in a form this no longer matches (a trailing comment, a second nested
  // <svg>, ...), better to break the build than lose the friendly face
  // with no visible error.
  throw new Error("Puffer.tsx: pufferfish.svg's closing </svg> tag not found");
}
const pufferArtwork = strippedPufferArtwork.replace(
  CLOSING_SVG_TAG,
  `${FRIENDLY_FACE}</svg>`,
);

// Puffer fish, embedded around the origin -- a vendored illustration (see
// AGENTS.md for provenance) rather than hand-drawn like the previous spiky
// version. Already drawn facing right (toward the predator) in its native
// orientation, same convention as every creature here. Renders only once
// (never a school), so unlike Shark/Piranha this doesn't need scopeIds --
// its one internal id (`Layer_1`) is never duplicated on screen.
export function Puffer() {
  return (
    <g className="puffer">
      <svg
        x={-18}
        y={-18}
        width={36}
        height={36}
        viewBox="0 0 512.001 512.001"
        dangerouslySetInnerHTML={{ __html: pufferArtwork }}
      />
    </g>
  );
}
