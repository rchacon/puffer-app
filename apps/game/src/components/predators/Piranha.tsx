import { useScopedSvg } from "../scopeIds";
import { stripRootSvgDimensions } from "../vendoredSvg";
import rawPiranhaArtwork from "../../assets/piranha.svg?raw";

// This source has no width/height on its root <svg> to begin with, so
// stripping is a no-op here -- done anyway for consistency with every
// other vendored asset, see vendoredSvg.ts.
const piranhaArtwork = stripRootSvgDimensions(rawPiranhaArtwork);

// The piranha school -- a vendored illustration, not hand-drawn
// like Eel/Anglerfish/TapahCatfish/Mosasaurus. Recolored from its original
// teal palette to a grey body + red belly (a red-bellied piranha,
// Pygocentrus nattereri) -- see AGENTS.md for the source, license, and how
// the belly patch was added. Already drawn nose-left in its native
// orientation, same as every other creature here.
export function Piranha() {
  const scopedArtwork = useScopedSvg(piranhaArtwork);

  return (
    <g className="piranha">
      <svg
        x={-78}
        y={-29}
        width={117}
        height={58.5}
        viewBox="0 0 500 250"
        dangerouslySetInnerHTML={{ __html: scopedArtwork }}
      />
    </g>
  );
}
