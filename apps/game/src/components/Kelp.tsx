import { stripRootSvgDimensions } from "./vendoredSvg";
import rawKelpArtwork from "../assets/kelp.svg?raw";

// This source has no width/height on its root <svg> to begin with, so
// stripping is a no-op here -- done anyway for consistency with every
// other vendored asset, see vendoredSvg.ts.
const kelpArtwork = stripRootSvgDimensions(rawKelpArtwork);

// A kelp frond next to the rocks -- background scenery, positioned in
// scene-absolute coordinates (not around an origin like the predators/
// Puffer, since it never moves or scales). Vendored real vector art
// ("kelpforest.svg" via OpenClipart, public domain -- its own
// <cc:license> metadata block confirms this, no specific author credited
// beyond the Openclipart publisher; unlike the Puffer/rock/coral SVG Repo
// assets, whose license page can't be automatically re-verified, see
// AGENTS.md). Renders only once, so unlike Piranha/Shark or the two Rocks
// it doesn't need scopeIds.
//
// Placed to the right of Coral, safely right of the Puffer's own widest
// reach at high score (see Rocks.tsx for that reach's math) -- tall
// scenery like this wants to extend up well above the Puffer's vertical
// range, so it can't dodge the overlap by staying low the way the small
// Rock does, only by staying horizontally clear.
//
// Its own artwork has a fair amount of empty viewBox space below its
// drawn shadow (unlike Coral/Rock's, which each fill almost their entire
// box) -- naively bottom-aligning the box to the sand left a visible gap
// of water between the shadow and the sand surface. y accounts for that
// gap so the *shadow*, not the box edge, is what's sunk into the seabed
// `<path>`'s own curve at this x (solved the same way Rocks.tsx documents:
// the curve simplifies to a linear x(t), and this x falls on the second
// `T` segment, whose implicit reflected control point is (300,200)) --
// by a different amount than Coral's own sink, not perfectly matched, for
// a bit of natural variation between the two.
export function Kelp() {
  return (
    <g className="kelp" opacity={0.92}>
      <svg
        x={180}
        y={155}
        width={48}
        height={48}
        viewBox="0 0 250 250"
        dangerouslySetInnerHTML={{ __html: kelpArtwork }}
      />
    </g>
  );
}
