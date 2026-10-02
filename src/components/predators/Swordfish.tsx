import swordfishArt from "../../assets/swordfish.png";

// See predators.ts (PREDATOR_LEVEL_ENTRIES) and AGENTS.md for provenance.
// A plain predator, not a boss fight -- no BOSS_INTROS entry, just a
// normal approaching predator like Shark/Piranha/Anglerfish, following
// the shared default linear approach with no PREDATOR_APPROACH override.
//
// Source: a cartoon stock illustration, cropped to content and
// downscaled to 320x146 -- about 2x this component's own display size
// below, deliberately kept shark-scale rather than the bigger 600px-wide
// source a boss-fight predator gets (see AGENTS.md for the full
// provenance/optimization notes). Real alpha throughout, no watermark.
//
// No visible teeth, so its bill tip stands in for the usual bite point
// -- found via the usual coordinate-grid overlay technique at roughly
// (0, 61) in the saved 320x146 file. At this component's own display
// scale (159/320), that's (0, 30), hence the <image>'s x/y below: it
// lands at local (0, 0), the same shared reference point every other
// predator's mouth lands on at the closest approach.
export function Swordfish() {
  return (
    <g className="swordfish">
      <image href={swordfishArt} x={0} y={-30} width={159} height={73} />
    </g>
  );
}
