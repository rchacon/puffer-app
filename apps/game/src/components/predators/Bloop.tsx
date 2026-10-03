import bloopArt from "../../assets/bloop.png";

// The Bloop's boss fight -- a raster illustration (not vendored/licensed;
// user-provided, see AGENTS.md), imported as a URL (not `?raw`) so Vite
// emits it as its own cacheable file. Already drawn nose-left, no
// mirroring needed.
//
// Unlike every other predator, this one is sized to its own vertical
// extent, not the usual "however wide the source art is": height=180
// fits inside the scene's 200-unit height with a little margin at
// PREDATOR_Y=94 (94-90=4 to 94+90=184), so no part of it is ever cropped
// top-to-bottom -- only left-right, the same way every other predator's
// wider-than-tall art always has been. Horizontally it's still anchored
// on the eye (found the same way as before: flood-fill the source PNG's
// checkerboard background -- same fake-transparency trap as
// SharkPrincess/Mosasaurus/Anglerfish before it -- crop to content, then
// locate the pupil, a solid near-black blob distinct from the mouth
// interior's dark navy, via the same coordinate-hunting technique used
// for Megalodon's nose/gills) at this local origin, same shared
// reference point every other creature's mouth lands on at the closest
// approach.
export function Bloop() {
  return (
    <g className="bloop">
      <image href={bloopArt} x={-98} y={-90} width={375} height={180} />
    </g>
  );
}
