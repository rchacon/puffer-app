import { useScopedSvg } from "./scopeIds";
import { stripRootSvgDimensions } from "./vendoredSvg";
import rawRockArtwork from "../assets/rock.svg?raw";

// Its source's root <svg> carries width="800px" height="800px" alongside
// its viewBox -- stripRootSvgDimensions strips those before this gets
// nested inside the two sized wrappers below (see vendoredSvg.ts for why).
const rockArtwork = stripRootSvgDimensions(rawRockArtwork);

// Two rocks resting on the seabed -- background scenery, positioned in
// scene-absolute coordinates (not around an origin like the predators/
// Puffer, since they never move or scale). Vendored real vector art (a
// detailed shaded boulder, "🪨" Rock from the Noto Emoji set via SVG Repo,
// same bot-detection-checkpoint provenance caveat as the Puffer/kraken-icon
// -- see AGENTS.md) rather than the hand-drawn flat-ellipse rocks this
// replaced. The same artwork rendered twice at once, at two different
// sizes (one bigger) side by side, so its gradient ids need scoping per
// instance just like Piranha/Shark's schools -- two separate
// `useScopedSvg` calls, one per instance, rather than one call reused
// twice (each call consumes its own `useId()` slot, so the two results
// are already uniquely suffixed against each other).
//
// Sized to sit tall and prominent on the sand -- the big rock's top edge
// (y=148) is well within the Puffer's own reach at high score
// (pufferScale(5)=2.2, Puffer.tsx's local box extends to y=+18, so at
// PUFFER_Y=116 its bottom edge can reach 116+18*2.2=155.6, plus the idle
// `bob` keyframe's +3px, for 158.6), so it's kept clear *horizontally*
// instead: pinned to the left edge (x=0-52), safely left of the Puffer's
// own widest reach at that same high score (56.4-135.6), rather than
// pushed down/shrunk to dodge it vertically (tried first, but that made
// the rocks look small and half-buried instead of resting on top of the
// sand). The small rock, further right and lower, doesn't need to dodge
// anything -- its y-range (166-200) is already below the Puffer's max
// reach (158.6), so it can't overlap regardless of x. Both are also kept
// well clear of the Kraken's ShipWreck (roughly x=250-390) either way.
export function Rocks() {
  const bigRock = useScopedSvg(rockArtwork);
  const smallRock = useScopedSvg(rockArtwork);

  return (
    <g className="rocks">
      <svg
        x={0}
        y={148}
        width={52}
        height={52}
        viewBox="0 0 128 128"
        dangerouslySetInnerHTML={{ __html: bigRock }}
      />
      <svg
        x={58}
        y={166}
        width={34}
        height={34}
        viewBox="0 0 128 128"
        dangerouslySetInnerHTML={{ __html: smallRock }}
      />
    </g>
  );
}
