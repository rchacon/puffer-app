import { useScopedSvg } from "./scopeIds";
import { stripRootSvgDimensions } from "./vendoredSvg";
import rawSharkArtwork from "../assets/shark.svg?raw";

// This source's width/height happen to already equal its own viewBox
// numbers, so stripping them is a no-op here -- done anyway for
// consistency with every other vendored asset, see vendoredSvg.ts.
const sharkArtwork = stripRootSvgDimensions(rawSharkArtwork);

// Shark drawn around the origin, nose pointing left (toward the puffer
// fish). A vendored illustration (recolored to a great white: grey back,
// white belly, thinned outline -- see AGENTS.md for provenance and details)
// rather than hand-drawn, embedded the same way as Kraken.tsx: `?raw` +
// dangerouslySetInnerHTML. Its internal ids get scoped per-instance (see
// scopeIds.ts) since the two-shark level renders two of these at once
// (a school);
// Megalodon reuses this same artwork via a CSS filter to darken it (see
// that file) rather than fill-prop overrides, since this art's colors are
// baked into the file instead of being simple shape fills.
export function Shark() {
  const scopedArtwork = useScopedSvg(sharkArtwork);

  return (
    <g className="shark">
      <svg
        x={-79.5}
        y={-36}
        width={159}
        height={72}
        viewBox="0 0 1462.5 662.5"
        dangerouslySetInnerHTML={{ __html: scopedArtwork }}
      />
    </g>
  );
}
