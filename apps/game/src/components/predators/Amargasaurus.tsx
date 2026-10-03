import amargasaurusArt from "../../assets/amargasaurus-foreground.png";

// The Amargasaurus's threat -- unlike the rest of BattleScene.tsx's
// shallow-lake scene (see AGENTS.md), this one approaches the puffer
// the same plain linear way every other predator does, just with a
// shorter final stretch (see BattleScene.tsx's own
// `PREDATOR_APPROACH.amargasaurus`).
// An earlier revision kept it stationary and had it dip deeper into the
// water each round instead (see AGENTS.md for that whole detour) --
// reverted once the source art itself changed: this photo's neck is
// already curved sharply downward on its own, so the "leaning down for a
// drink" read doesn't need a custom animation to manufacture it, and a
// normal approach reads as a real threat the way a stationary one
// didn't.
//
// User-provided raster art (not vendored/licensed, see AGENTS.md), real
// alpha already (no flood-fill fake-transparency trap), cropped to
// content, downscaled to 700px wide, palette-quantized (checked for
// banding on the throat/neck shading; none). A full-body version (head,
// body, legs) briefly replaced this close-up head/neck crop -- see
// AGENTS.md -- but was reverted: dealing with the legs' own ground
// placement wasn't worth it for this one predator, and the close-up's
// "no visible feet" is a non-issue once nothing is floating in frame.
// This crop does need a shorter final approach to read well at its
// closest, though (see the `PREDATOR_APPROACH` entry it now has), so
// the trade isn't entirely free.
//
// The nose tip sits at roughly (15, 695) in the saved 700x816 file --
// found via the usual coordinate-grid overlay technique. At this
// component's own display scale (200/700), that's (4, 199), hence the
// <image>'s x/y below: the nose lands at local (0, 0), the same shared
// reference point every other predator's mouth lands on at the closest
// approach.
export function Amargasaurus() {
  return (
    <g className="amargasaurus">
      <image href={amargasaurusArt} x={-4} y={-199} width={200} height={233} />
    </g>
  );
}
