import { useId } from "react";
import anglerfishArt from "../../assets/anglerfish.png";

// Local coordinates of the esca -- the glowing lure bulb dangling off the
// anglerfish's head in anglerfish.png -- after the same scale/centering
// math the <image> below gets from preserveAspectRatio="xMidYMid meet"
// (scale = min(140/220, 88/139), height-constrained, centered in the
// x-axis's small leftover margin). Found the same way as Megalodon's
// nose/gills: flood-fill the source PNG for its brightest yellow pixels
// (the bulb, distinct from the dorsal spines' smaller yellow tips and the
// eye's pale cream) and take the bounding box's center.
const LURE_X = -61;
const LURE_Y = -15;

// The Anglerfish -- a vendored illustration (see AGENTS.md for
// provenance/processing), replacing the old hand-drawn version. Already
// drawn nose-left in its native orientation, same convention as every
// creature here, so no mirroring needed. Imported as a URL (not `?raw`)
// so Vite emits it as its own cacheable file instead of inlining a
// base64 string into the JS bundle.
export function Anglerfish() {
  // The flat art itself isn't lit -- see AGENTS.md for why a bioluminescent
  // glow is drawn on top instead of baked into the PNG. Scoped per-instance
  // like Rocks'/Piranha's vendored ids, even though this level only ever
  // renders one Anglerfish, so a future school of them wouldn't collide.
  const glowId = useId();

  return (
    <g className="anglerfish">
      {/* Named separately from the group above so index.css can dim just
          the body (see .scene--anglerfish .anglerfish__body) without also
          dimming the lure-glow group below -- the glow is the whole point
          of the murk, so it stays at full brightness while the fish itself
          sinks into a silhouette. */}
      <image
        className="anglerfish__body"
        href={anglerfishArt}
        x={-70}
        y={-44}
        width={140}
        height={88}
        preserveAspectRatio="xMidYMid meet"
      />
      <defs>
        <filter id={glowId} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* Soft blurred halo plus a small hot core, both pulsing together --
          see .anglerfish__lure-glow in index.css. */}
      <g className="anglerfish__lure-glow">
        <circle cx={LURE_X} cy={LURE_Y} r={7} fill="#ffe58a" filter={`url(#${glowId})`} />
        <circle cx={LURE_X} cy={LURE_Y} r={2.2} fill="#fffdf0" />
      </g>
    </g>
  );
}
