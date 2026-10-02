import seaSerpentArt from "../../assets/sea-serpent.png";

// See predators.ts
// (PREDATOR_LEVEL_ENTRIES) and AGENTS.md for provenance. A plain
// predator, not a boss fight -- no BOSS_INTROS entry, just a normal
// approaching predator like Shark/Piranha/Anglerfish, following the
// shared default linear approach with no PREDATOR_APPROACH override.
//
// Source hit the same fake-transparency trap as several predators
// before it (`im.mode == "RGB"`, a checkerboard baked into opaque
// pixels), fixed the same way -- flood-fill from the border matching
// both near-neutral-grey checker tones -- plus one extra pass this
// time: a few dozen isolated 2-3px dust specks in the "background"
// were never connected to the border (off-tone enough to break the
// flood-fill's path through them), so left over as stray opaque dots
// after the main fill. Cleaned up by finding every remaining opaque
// connected component and dropping every one except the largest (the
// serpent itself). See AGENTS.md for the full provenance/optimization
// notes, including why this one kept a 128-color palette instead of
// the 64 several plainer predators use -- this art's painterly
// gradient shading (not flat cel-shading like most predators) showed
// early banding at lower color counts.
//
// The bite point (roughly the midpoint between the two front fang
// tips, same convention as every other toothed predator) was found via
// the usual coordinate-grid overlay technique at roughly (13, 75) in
// the saved 360x169 file. At this component's own display scale
// (180/360), that's (7, 38), hence the <image>'s x/y below: it lands
// at local (0, 0), the same shared reference point every other
// predator's mouth lands on at the closest approach.
export function SeaSerpent() {
  return (
    <g className="seaserpent">
      <image href={seaSerpentArt} x={-7} y={-38} width={180} height={85} />
    </g>
  );
}
