import { stripRootSvgDimensions } from "./vendoredSvg";
import rawCoralArtwork from "../assets/coral.svg?raw";

// Its source's root <svg> carries width="800px" height="800px" alongside
// its viewBox (as `height="..." width="..."`, same attribute order as
// Puffer's own copy of the same bug, the opposite of Rock's --
// stripRootSvgDimensions doesn't care about order either way, it matches
// each attribute independently) -- see vendoredSvg.ts for why those have
// to come out before nesting this inside the wrapper below.
const coralArtwork = stripRootSvgDimensions(rawCoralArtwork);

// A branch of coral next to the Rocks/Kelp -- background scenery,
// positioned in scene-absolute coordinates (not around an origin like the
// predators/Puffer, since it never moves or scales). Vendored real vector
// art from SVG Repo, same bot-detection-checkpoint provenance caveat as
// the Puffer/Rock/kraken-icon (see AGENTS.md). Its source id was the same
// generic "Layer_1" the Puffer and Shark SVGs also happen to use (an SVG
// Repo "Mixer Tools" default, apparently) -- harmless in practice since
// none of the three ever reference their own id via `url(...)`, but
// renamed to "coral-layer" by hand anyway rather than adding a third
// literal duplicate id to the DOM. Renders only once, so unlike
// Piranha/Shark or the two Rocks it doesn't need scopeIds.
//
// Placed just past the Puffer's own widest reach at high score
// horizontally (see Rocks.tsx for that reach's math), same as Kelp --
// tried tucking it in low next to the small Rock instead (dodging the
// Puffer vertically, the same trick the small Rock uses), but unlike that
// rock this artwork's own visible content fills almost all the way to its
// box's bottom edge (no empty margin to spare), so sitting it low enough
// to duck under the Puffer's reach buried most of the coral in the sand,
// reading as sunk/cut-off by the frame rather than resting on top of it.
// Sunk partway into the sand rather than sitting flush on its surface
// (like the Rocks -- see Rocks.tsx for their own, deeper sink) -- a
// believable amount of embedding, not the exact curve line.
export function Coral() {
  return (
    <g className="coral">
      <svg
        x={140}
        y={159}
        width={34}
        height={34}
        viewBox="0 0 511.997 511.997"
        dangerouslySetInnerHTML={{ __html: coralArtwork }}
      />
    </g>
  );
}
