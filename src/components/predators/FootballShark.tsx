import footballSharkArt from "../../assets/football-shark.png";

// See predators.ts
// (PREDATOR_LEVEL_ENTRIES) and AGENTS.md for provenance. A plain
// predator, not a boss fight -- no BOSS_INTROS entry, just a normal
// approaching predator like Shark/Piranha/Anglerfish, following the
// shared default linear approach with no PREDATOR_APPROACH override.
//
// Source hit the same fake-transparency trap as several predators
// before it, but a plainer version of it: no alpha channel at all
// (`im.mode == "RGB"`), a flat two-tone grey checkerboard baked into
// fully opaque pixels. Fixed the same way as always -- flood-fill from
// the border, matching both near-neutral-grey checker tones -- except
// this art's own football helmet is *also* white/grey, so a global
// color replace would have punched holes in it; flood-filling only
// pixels actually reachable from the canvas border (not merely
// grey-colored) left the enclosed helmet untouched. See AGENTS.md for
// the full provenance/optimization notes.
//
// The bite point (roughly the midpoint between the two front fang
// tips, same convention as every other toothed predator) was found via
// the usual coordinate-grid overlay technique at roughly (19, 111) in
// the saved 320x187 file. At this component's own display scale
// (159/320), that's (9, 55), hence the <image>'s x/y below: it lands
// at local (0, 0), the same shared reference point every other
// predator's mouth lands on at the closest approach.
export function FootballShark() {
  return (
    <g className="footballshark">
      <image href={footballSharkArt} x={-9} y={-55} width={159} height={93} />
    </g>
  );
}
