import amargasaurusBg from "../assets/amargasaurus-background.png";
import { SHORE_HORIZON_Y } from "./BattleScene";

// The saved source's own width and the feet's (ground-contact line's)
// y-position within it -- see the sizing comment below for how these
// feed into the actual display width/height/y.
const SRC_WIDTH = 360;
const SRC_HEIGHT = 235;
const SRC_FEET_Y = 224;
const DISPLAY_WIDTH = 80;
const SCALE = DISPLAY_WIDTH / SRC_WIDTH;

// The Amargasaurus level's distant scenery: a second Amargasaurus,
// further up the shore, bent down drinking from the lake -- static (it
// never approaches; the close-up one in predators/Amargasaurus.tsx is
// the actual threat) and positioned in scene-absolute coordinates,
// same convention as
// ShipWreck.tsx/FishingBoat.tsx. Only rendered for this one level (see
// BattleScene.tsx's `isShore` branch), sitting right at the horizon line
// between the land above and the shallow water below -- the "one creature
// drinking peacefully in the background, another one much closer and
// bearing down" framing is what's meant to sell the depth/parallax effect
// this whole level is built around.
//
// User-provided raster art (see AGENTS.md), processed the same way as the
// foreground creature: real alpha, cropped to content, downscaled to
// 360x235, palette-quantized. Already drawn head/neck-down toward the
// ground (nose at roughly (20, 885) of the 1507x985 crop this started
// from -- no rotation needed here, unlike the foreground creature, since
// this photo's own downward angle already reads as "drinking" once small
// and distant).
//
// Sized/positioned so its feet (the ground-contact line, roughly
// SRC_FEET_Y of the saved SRC_WIDTHxSRC_HEIGHT file) land right on the
// scene's horizon -- found by the same coordinate-grid overlay technique
// used throughout, then solved for the image's own top-left corner:
// display scale DISPLAY_WIDTH/SRC_WIDTH, horizon at SHORE_HORIZON_Y
// (BattleScene.tsx's own constant, not a re-derived copy of it), so the
// top edge sits at SHORE_HORIZON_Y minus (SRC_FEET_Y * that same scale).
export function AmargasaurusBackground() {
  return (
    <image
      className="amargasaurus-bg"
      href={amargasaurusBg}
      x={180}
      y={SHORE_HORIZON_Y - SRC_FEET_Y * SCALE}
      width={DISPLAY_WIDTH}
      height={SRC_HEIGHT * SCALE}
      opacity={0.92}
    />
  );
}
