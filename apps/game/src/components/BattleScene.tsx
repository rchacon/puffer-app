import type { Outcome } from "../game/outcome";
import type { PredatorKind, PredatorLevel } from "../game/predators";
import { getInstanceKinds } from "../game/predators";
import { AmargasaurusBackground } from "./AmargasaurusBackground";
import { Coral } from "./Coral";
import { FishingBoat } from "./FishingBoat";
import { Kelp } from "./Kelp";
import { Puffer } from "./Puffer";
import { Rocks } from "./Rocks";
import { ShipWreck } from "./ShipWreck";
import { PREDATOR_COMPONENTS, getSchoolOffsets } from "./predators";

interface Props {
  sharkProgress: number; // 0..1 -- approach progress
  pufferScale: number;
  outcome: Outcome | null;
  predator: PredatorLevel;
}

const PUFFER_X = 96;
const PUFFER_Y = 116;
const PREDATOR_Y = 94;

// Where the Amargasaurus level's land meets its shallow water -- see
// `isShore` below and AmargasaurusBackground.tsx, which solves its own
// vertical placement against this same line. Exported so that file
// derives its own y/height from this constant directly instead of a
// hand-copied number that would silently drift out of sync if this ever
// moves.
export const SHORE_HORIZON_Y = 70;

const DEFAULT_START_X = 350;

// Per-kind overrides to the shared linear approach -- everything not listed
// here just uses DEFAULT_START_X and travels in a straight line. A lookup
// keyed by kind instead of another `predator.kind === "..."` branch each
// time a predator needs special-casing (this is already the second one,
// after the Kraken's shipwreck check above): easier to see every exception
// in one place, and to tell at a glance whether a given kind has one.
interface PredatorApproach {
  startX: number;
  /** Reshapes 0..1 sharkProgress before the shared linear position math. */
  ease?: (t: number) => number;
}

// Mosasaurus is deliberately drawn much bigger than every other predator
// (see Mosasaurus.tsx) and starts much farther off the right edge -- a
// plain linear approach at that scale makes each round-to-round step a big,
// fast-looking jump (the bigger the runway, the bigger each equal-progress
// slice of it is). A single smooth power curve keeps every step small and
// only closes most of the distance on the very last one -- unlike a
// hand-tuned multi-point checkpoint table (an earlier approach here), this
// has no seams between differently-sloped segments for consecutive steps to
// look inconsistent across, so it doesn't have the mobile "jumpiness" that
// table caused.
//
// A pure cube (progress**3) pushes round 1's move down to a couple of
// pixels -- imperceptible, reads as not moving at all. Blending in a small
// linear component (progress*0.2 + progress**3*0.8) keeps that first move
// visible (the linear term's slope is nonzero at t=0, unlike the cube's)
// while the cube term still dominates for the rest of the approach, so
// later rounds still build up gradually and contact still lands on the
// final reveal, not sooner.
const PREDATOR_APPROACH: Partial<Record<PredatorKind, PredatorApproach>> = {
  mosasaurus: {
    startX: 460,
    ease: (t) => 0.2 * t + 0.8 * t ** 3,
  },
  // At the shared default's full closest approach (sharkX=150), this
  // close-up head/neck crop (see Amargasaurus.tsx) read as a
  // "disembodied neck" on a real device -- there isn't a body/legs in
  // frame to anchor it as a whole creature the way every other predator
  // has. Capping `ease` at 0.75 instead of the usual 1 stops the shared
  // `sharkX = startX - approachProgress*(startX-150)` formula short of
  // its normal endpoint: `startX` (still the plain default, 350) minus
  // 75% of the usual 200-unit closing distance lands the final round at
  // sharkX=200 instead of 150 -- close enough to read as a real threat,
  // without covering the last 50 units that made it crop too tight.
  amargasaurus: {
    startX: DEFAULT_START_X,
    ease: (t) => t * 0.75,
  },
  // The opposite tweak from the Amargasaurus above: per explicit request,
  // this one should end up *closer* than the shared default's usual
  // closest approach (sharkX=150) by the final round. `ease(t) = t*1.1`
  // overshoots past 1 at t=1, so the shared `sharkX = startX -
  // approachProgress*(startX-150)` formula lands past its normal
  // endpoint: 350 - 1.1*(350-150) = 130 instead of 150. Barely changes
  // early rounds (t is small there, so t*1.1 is close to t*1), only
  // visibly diverges as progress nears 1 -- same reason a smaller
  // `startX` alone wouldn't have worked: that only moves round 1's
  // starting point, not round 5's endpoint, which the shared formula
  // always drives to exactly `startX - 1*(startX-150) = 150` regardless
  // of `startX` unless `ease` itself pushes past 1. (A first pass used
  // `t*1.2`, landing at 110 -- close enough to actually overlap the
  // puffer once seen at the true final-round position, not just a
  // mid-round snapshot; dialed back to 1.1.)
  dunkleosteus: {
    startX: DEFAULT_START_X,
    ease: (t) => t * 1.1,
  },
};

export function BattleScene({ sharkProgress, pufferScale, outcome, predator }: Props) {
  const approach = PREDATOR_APPROACH[predator.kind];
  const startX = approach?.startX ?? DEFAULT_START_X;
  const approachProgress = approach?.ease ? approach.ease(sharkProgress) : sharkProgress;
  const sharkX = startX - approachProgress * (startX - 150);
  // The Anglerfish is a deep-sea ambush hunter -- its whole gimmick is
  // luring prey in the dark, which the shallow, sunlit sea gradient every
  // other level shares undercuts. Darkening the water/seabed just for this
  // level, rather than a CSS filter over the whole scene, leaves room to
  // dim the Puffer and the Anglerfish's own body separately (see
  // .scene--anglerfish in index.css) while exempting the lure's glow (see
  // Anglerfish.tsx) from that dimming -- a single scene-wide filter
  // couldn't tell the glow apart from the rest of the Anglerfish it's
  // layered on top of.
  const isMurky = predator.kind === "anglerfish";
  // The Amargasaurus level is a deliberate departure from every ocean
  // level before it -- the Puffer's swept into shallow water at a
  // lakeshore, with land (and a second, distant Amargasaurus drinking)
  // visible above the waterline instead of open sea in every direction.
  // Same per-kind backdrop-swap pattern as `isMurky` above: this rect
  // fill and the seabed-decoration skip below both key off it instead of
  // a scattered `predator.kind === "amargasaurus"` check each time.
  const isShore = predator.kind === "amargasaurus";
  // Coral and Kelp are skipped outright (not just dimmed like the rest
  // of the seabed) for some levels -- see `PredatorLevel.skipsReefDecor`'s
  // own doc comment in predators.ts for the per-level reasons. Read
  // straight from the level data rather than re-deriving it from
  // `isMurky`/`isShore`/a `predator.kind` check here, so a future level
  // that wants this only needs to set the flag in predators.ts, not also
  // touch this component.
  const skipsReefDecor = predator.skipsReefDecor ?? false;
  const className = [
    "scene",
    outcome && `scene--${outcome}`,
    isMurky && "scene--anglerfish",
  ]
    .filter(Boolean)
    .join(" ");
  const offsets = predator.offsets ?? getSchoolOffsets(predator.count);
  const instanceKinds = getInstanceKinds(predator);

  // Built once, placed either before or after the puffer below depending
  // on kind -- see the draw-order comment at its call site.
  const predatorGroup = (
    <g className="scene__predator" transform={`translate(${sharkX} ${PREDATOR_Y})`}>
      {offsets.map((o, i) => {
        const Creature = PREDATOR_COMPONENTS[instanceKinds[i] ?? predator.kind];
        return (
          <g key={i} transform={`translate(${o.dx} ${o.dy}) scale(${o.scale})`}>
            <g className="scene__predator-bob">
              <Creature />
            </g>
          </g>
        );
      })}
    </g>
  );

  return (
    <div className={className}>
      <svg
        className="scene__svg"
        viewBox="0 0 400 200"
        role="img"
        aria-label={`${predator.label} swimming toward a puffer fish`}
      >
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#37b0dd" />
            <stop offset="1" stopColor="#0a3a63" />
          </linearGradient>
          {/* Anglerfish-only backdrop -- same idea as #sea, considerably
              darker/deeper so the level reads as murky abyss instead of a
              sunlit reef (see the isMurky comment above). */}
          <linearGradient id="seaMurky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0e2537" />
            <stop offset="1" stopColor="#020810" />
          </linearGradient>
          {/* Amargasaurus-only backdrop -- a shallow lake, not the open
              ocean every other level swims in. A bright sky above the
              horizon (id="lakeSky") and a much lighter, shallower water
              gradient below it (id="lakeWater") than #sea's deep-blue
              falloff -- there's a visible sandy bottom close by, not miles
              of open water. */}
          <linearGradient id="lakeSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bfe6f5" />
            <stop offset="1" stopColor="#e8f3d9" />
          </linearGradient>
          <linearGradient id="lakeWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fd4c8" />
            <stop offset="1" stopColor="#1f7a8c" />
          </linearGradient>
          {/* Recolors the Kraken's mostly-grey vendored art purple (see
              .kraken in index.css for why: sepia injects chroma a plain
              hue-rotate can't). Built from the same primitives the CSS
              `filter: sepia(1) saturate(3) hue-rotate(220deg) brightness(0.64)`
              shorthand expands to, but spelled out explicitly with
              color-interpolation-filters="sRGB" forced -- reported as
              rendering grey instead of purple on iOS Safari/Chrome (same
              WebKit engine), which strongly suggests that combo was
              landing in linearRGB there instead. Chaining 4 shorthand
              filter functions on near-zero-chroma source art is fragile
              even when color space matches: there's very little chroma
              for rounding differences between engines to work with. This
              removes the ambiguity outright instead of guessing further --
              unverified on a real device, since none is available here. */}
          <filter id="krakenPurple" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.393 0.769 0.189 0 0
                      0.349 0.686 0.168 0 0
                      0.272 0.534 0.131 0 0
                      0     0     0     1 0"
            />
            <feColorMatrix type="saturate" values="3" />
            <feColorMatrix type="hueRotate" values="220" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.64" />
              <feFuncG type="linear" slope="0.64" />
              <feFuncB type="linear" slope="0.64" />
            </feComponentTransfer>
          </filter>
        </defs>

        {isShore ? (
          <>
            <rect width="400" height={SHORE_HORIZON_Y} fill="url(#lakeSky)" />
            {/* Two overlapping hill layers, not one -- a flat single
                horizon read as a cutout backdrop with nothing behind it.
                The far hill is paler/flatter (more sky-tinted, standing
                further back); the near one is smaller, richer, and its
                base slightly overlaps the horizon into the water below,
                giving the shoreline itself some depth instead of a
                perfectly straight line -- the layered "things visible at
                different depths above the water" look the user asked for
                (their own Mario Wonder background comparison). */}
            <path
              d="M0 52 Q 90 30 180 46 T 400 40 V70 H0 Z"
              fill="#a9c98f"
              opacity="0.75"
            />
            <rect
              y={SHORE_HORIZON_Y}
              width="400"
              height={200 - SHORE_HORIZON_Y}
              fill="url(#lakeWater)"
            />
            {/* The near hill is drawn after the water rect, not before --
                its base extends 2 units past SHORE_HORIZON_Y on purpose
                (see the comment above), and an opaque rect drawn on top
                of it would paint over that overlap entirely, undoing the
                one thing it's there for. */}
            <path
              d="M0 66 Q 70 50 160 60 T 340 58 L 400 64 V72 H0 Z"
              fill="#7fae5f"
            />
            {/* Drawn after the water (and the near hill), not before --
                its feet sit a couple of units below the horizon line (see
                AmargasaurusBackground.tsx), which would otherwise get
                clipped by the opaque water fill. */}
            <AmargasaurusBackground />
          </>
        ) : (
          <rect width="400" height="200" fill={isMurky ? "url(#seaMurky)" : "url(#sea)"} />
        )}
        {/* Dimmed as one group, rather than each piece separately, so the
            seabed sinks into the murk together instead of any one piece
            (the sand's warm tan especially) still popping against it. */}
        <g opacity={isMurky ? 0.4 : 1}>
          <path
            d="M0 186 Q 100 172 200 186 T 400 184 V200 H0 Z"
            fill="#d9b988"
            opacity="0.85"
          />
          <Rocks />
          {!skipsReefDecor && (
            <>
              <Coral />
              <Kelp />
            </>
          )}
        </g>
        {predator.kind === "kraken" && <ShipWreck />}
        {predator.kind === "megalodon" && <FishingBoat />}

        <g className="scene__bubbles" fill="#c7ecff" opacity="0.5">
          <circle cx="58" cy="60" r="3" />
          <circle cx="128" cy="42" r="2" />
          <circle cx="92" cy="150" r="2.5" />
          <circle cx="300" cy="120" r="2.5" />
          <circle cx="20" cy="110" r="2" />
          <circle cx="175" cy="95" r="1.8" />
          <circle cx="200" cy="30" r="2" />
          <circle cx="350" cy="60" r="2.5" />
        </g>

        {outcome === "victory" && (
          <g
            className="scene__burst"
            transform={`translate(${PUFFER_X} ${PUFFER_Y})`}
            fill="#ffd447"
          >
            <g className="scene__burst-spin">
              <path d="M0 -60 L9 -20 L0 -34 L-9 -20 Z" />
              <path d="M60 0 L20 9 L34 0 L20 -9 Z" />
              <path d="M-60 0 L-20 -9 L-34 0 L-20 9 Z" />
              <path d="M0 60 L-9 20 L0 34 L9 20 Z" />
              <path d="M42 -42 L18 -12 L30 -30 L12 -18 Z" />
              <path d="M-42 42 L-18 12 L-30 30 L-12 18 Z" />
            </g>
          </g>
        )}

        {/* Draw order matters here: whichever renders second sits on top.
            Every other predator draws on top of the puffer (puffer first
            below), same as it's always been. The Bloop is the one
            exception -- it draws first/behind instead, so as it closes in
            and its wide-open mouth overlaps the puffer's own position, the
            puffer stays visible sitting inside/against the dark mouth
            interior instead of getting covered by the jaw -- the effect of
            swimming into the mouth, not just being chased by it. */}
        {predator.kind === "bloop" && predatorGroup}

        <g
          className="scene__puffer"
          transform={`translate(${PUFFER_X} ${PUFFER_Y}) scale(${pufferScale})`}
        >
          <g className="scene__puffer-bob">
            <Puffer />
          </g>
        </g>

        {predator.kind !== "bloop" && predatorGroup}
      </svg>
    </div>
  );
}
