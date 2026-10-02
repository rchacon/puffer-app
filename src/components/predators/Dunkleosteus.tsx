import dunkleosteusArt from "../../assets/dunkleosteus.png";

// See predators.ts
// (PREDATOR_LEVEL_ENTRIES) and AGENTS.md for provenance. A real (if
// long-extinct) armored fish, Dunkleosteus, not a boss fight -- no
// BOSS_INTROS entry, just a normal approaching predator like
// Shark/Piranha/Anglerfish, following the shared default linear approach
// with no PREDATOR_APPROACH override.
//
// Third source image for this level (see AGENTS.md for the first two --
// one watermarked and never used, one used briefly but photorealistic
// and visually inconsistent with every other predator's flat cel-shaded
// look). This one is "a slightly less scary/realistic version," per the
// user's own request, and -- unlike the photorealistic one -- matches
// the game's usual cartoon style, so it's the one actually kept. Hit
// the same fake-transparency trap as several predators before it
// (`im.mode == "RGB"`, a two-tone checkerboard baked into opaque
// pixels), fixed the same way (flood-fill from the border, matching
// both checker tones -- a strict near-neutral-grey test, since the
// fish's own body has a subtle blue cast even at its lightest that a
// looser threshold would risk catching). Cropped to content, downscaled
// to 600px wide, palette-quantized (128 colors, Floyd-Steinberg
// dither) -- checked for banding on the body's own spot pattern first;
// none, same flat cel-shading reason as every other quantized predator.
// ~1.6MB down to ~30KB, smaller than the photorealistic version despite
// the same dimensions, since flat cel-shaded art has far fewer distinct
// colors for the palette to spend its budget on.
//
// The bite point -- roughly the midpoint between the two front fang
// tips, at approximately (12, 162) in the saved 600x298 file -- found
// via the usual coordinate-grid overlay technique. At this component's
// own display scale (180/600), that's (4, 49), hence the <image>'s x/y
// below: it lands at local (0, 0), the same shared reference point
// every other predator's mouth lands on at the closest approach.
export function Dunkleosteus() {
  return (
    <g className="dunkleosteus">
      <image href={dunkleosteusArt} x={-4} y={-49} width={180} height={89} />
    </g>
  );
}
