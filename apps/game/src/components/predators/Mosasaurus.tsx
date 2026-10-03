import mosasaurusArt from "../../assets/mosasaurus.png";

// The Mosasaurus -- a raster illustration (not vendored/licensed;
// user-provided, see AGENTS.md), imported as a URL (not `?raw`) so Vite
// emits it as its own cacheable file instead of inlining a base64 string
// into the JS bundle. Already drawn nose-left in its native orientation.
//
// Deliberately drawn bigger than every other predator (Shark is 159 wide) --
// it's the last stop before the Kraken finale and is meant to look
// imposing. BattleScene compensates in the approach curve, not by shrinking
// this back down (see the MOSASAURUS_APPROACH comment there).
//
// x/y center the image on the local origin (-width/2, -height/2), same
// convention as every other predator (Shark, Piranha, SharkPrincess...) --
// each one's art was cropped tight to its own content, so centering the
// box puts roughly the right amount of open jaw at the shared final
// contact position (sharkX=150) for a believable bite. This was
// previously x={-130}, off-center by 30 units, which put the puffer under
// the Mosasaurus's mid-body/flippers at that position instead of its
// mouth -- caught by /code-review actually rendering the final frame
// rather than by inspection.
export function Mosasaurus() {
  return (
    <g className="mosasaurus">
      <image
        href={mosasaurusArt}
        x={-100}
        y={-48.5}
        width={200}
        height={97}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}
