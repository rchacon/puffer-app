import sharkPrincessArt from "../../assets/shark-princess.png";

// Level 3 (previously a recolored Shark playing the orca, see git history)
// -- a cheerful crowned whale shark, provided by the user as a large raster
// illustration with a white background (src/assets/shark-princess.png is
// the processed result: background removed, cropped to content,
// downscaled; see AGENTS.md for details and why it isn't the original
// file). Imported as a URL (not `?raw` like Kraken.tsx) so Vite emits it as
// its own cacheable file instead of inlining a ~300KB base64 string into
// the JS bundle.
// Sized 1.5x its original footprint -- she's a whale shark (the largest
// fish species alive), and the original 108-wide box was actually smaller
// than the plain Shark's 159, which undersold that. Same "reuses the
// unmodified regular Shark's approach" gameplay treatment as before this
// change (no special-casing in BattleScene.tsx): a school-of-2 test at
// the same scale (Megalodon reusing Shark's own art, resized similarly)
// worked fine there, so this hasn't needed the extra approach-curve
// treatment the much-larger Mosasaurus required.
export function SharkPrincess() {
  return (
    <g className="shark-princess">
      <image
        href={sharkPrincessArt}
        x={-81}
        y={-45}
        width={162}
        height={91}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}
