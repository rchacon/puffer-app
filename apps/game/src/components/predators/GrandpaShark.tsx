import grandpaSharkArt from "../../assets/grandpa-shark.png";

// See predators.ts
// (PREDATOR_LEVEL_ENTRIES) and AGENTS.md for provenance. A plain
// predator, not a boss fight -- no BOSS_INTROS entry, just a normal
// approaching predator like Shark/Piranha/Anglerfish, following the
// shared default linear approach with no PREDATOR_APPROACH override.
//
// Source hit the same fake-transparency trap as the football shark's
// own source (no alpha channel at all, a flat grey checkerboard baked
// into opaque pixels), fixed the same way -- flood-fill from the
// border, matching both near-neutral-grey checker tones. See AGENTS.md
// for the full provenance/optimization notes.
//
// Unlike every other toothed predator, its mouth is mostly hidden
// behind the newspaper it's reading -- there's no clean pair of front
// fang tips to anchor on. Anchored at the leftmost point of the whole
// composition instead (the newspaper's own top-left corner, roughly
// (0, 86) in the saved 320x187 file, same technique as the Swordfish's
// bill tip), so the puffer meets the paper's edge at closest approach
// rather than a mouth that isn't actually the visual "front" of this
// one. At this component's own display scale (159/320), that's
// (0, 42), hence the <image>'s x/y below: it lands at local (0, 0).
export function GrandpaShark() {
  return (
    <g className="grandpashark">
      <image href={grandpaSharkArt} x={0} y={-42} width={159} height={93} />
    </g>
  );
}
