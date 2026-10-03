import { useScopedSvg } from "../scopeIds";
import { stripRootSvgDimensions } from "../vendoredSvg";
import rawMegalodonArtwork from "../../assets/megalodon.svg?raw";

// This source has no width/height on its root <svg> to begin with, so
// stripping is a no-op here -- done anyway for consistency with every
// other vendored asset, see vendoredSvg.ts.
const megalodonArtwork = stripRootSvgDimensions(rawMegalodonArtwork);

// The Megalodon -- the first genuine "boss fight" (see
// MegalodonIntro.tsx and AGENTS.md for the intro/music side of that).
// Used to just reuse Shark's vendored art scaled 1.5x and darkened via CSS
// filter (an "it's just a bigger ancient shark" shortcut); now its own
// vendored real vector art instead, drawn at a scale no other predator
// gets close to.
//
// Deliberately drawn so big that its full body -- let alone the tail --
// never fits on screen: only the area from its nose back to about its
// gills does, "that's all that will fit" being the actual design goal,
// not a bug to fix. Its source viewBox is 3.50597 2.41606 1036.54 413.809
// (nose at the left edge, gills roughly a further 226 units in, found by
// rendering the source with a labeled coordinate grid overlaid and
// reading the gill slits' position off of it -- see AGENTS.md). At this
// scale (1.5x) and offset, the nose lands right at the shared final
// contact position (sharkX=150) same as every other predator, and the
// gills land just past the right edge of the 400-wide scene viewBox --
// "we just see tip of nose to gills, that's all that fits," not the
// whole head. Renders only once (never a school), so unlike Shark/
// Piranha this doesn't need scopeIds for the *count* reason those need
// it -- but its own single-letter gradient/filter ids (id="a", id="b", ...)
// are exactly the kind of generic, easily-collided ids that scopeIds
// exists for, so it still goes through useScopedSvg() defensively, in
// case a future asset happens to reuse the same short ids.
export function Megalodon() {
  const scopedArtwork = useScopedSvg(megalodonArtwork);

  return (
    <g className="megalodon">
      <svg
        x={-70}
        y={-314}
        width={1555}
        height={621}
        viewBox="3.50597 2.41606 1036.54 413.809"
        dangerouslySetInnerHTML={{ __html: scopedArtwork }}
      />
    </g>
  );
}
