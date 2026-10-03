import eelArt from "../../assets/electric-eel.png";
import eelGlowArt from "../../assets/electric-eel-glow.png";

// The electric eel (school of 3) -- a raster illustration (not
// vendored/licensed; user-provided, see AGENTS.md), replacing the old
// hand-drawn S-curve. Already drawn nose-left in its native orientation,
// same convention as every other creature here, so no mirroring needed.
// Imported as a URL (not `?raw`) so Vite emits it as its own cacheable
// file instead of inlining a base64 string into the JS bundle.
//
// x/y center the image on the local origin, same convention as every
// other raster predator (Mosasaurus, Anglerfish...) -- the art was cropped
// tight to its own content first, so centering the box puts the head/mouth
// near the shared left edge every other creature's nose lands on.
const IMAGE_PROPS = { x: -95, y: -47.5, width: 190, height: 95 };

export function Eel() {
  return (
    <g className="eel">
      <image href={eelArt} {...IMAGE_PROPS} />
      {/* electric-eel-glow.png isolates just the body art's own yellow
          "lightning" marks (the dorsal zigzag + spots, see AGENTS.md for
          how) -- same size/position as the body art above so it lines up
          pixel-for-pixel, layered on top and pulsed (blurred + faded in
          and out, see .eel__glow in index.css) to read as current running
          through them rather than a static illustration. */}
      <image href={eelGlowArt} {...IMAGE_PROPS} className="eel__glow" />
    </g>
  );
}
