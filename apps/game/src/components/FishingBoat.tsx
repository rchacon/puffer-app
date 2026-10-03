// A small white fishing boat, wrecked and resting on the seabed -- a nod
// to the Orca (the boat in Jaws, which doesn't survive the movie),
// background scenery for the Megalodon's boss level. Same technique and
// scene-absolute-coordinates convention as ShipWreck.tsx (the Kraken's
// own wreck), just smaller and white/weathered rather than brown/wood --
// this one's a modest fishing boat, not a galleon. Positioned where the
// Megalodon's approach will eventually cover it -- fine for it to vanish
// behind the boss rather than staying visible the whole fight, the same
// "it's ok, it's just that big" spirit as the rest of this level.
export function FishingBoat() {
  return (
    <g className="fishing-boat" opacity={0.9}>
      {/* Snapped mast, leaning */}
      <path
        d="M305 178 L299 133 L303 132 L311 177 Z"
        fill="#d8d2c4"
        stroke="#8a8577"
        strokeWidth={1}
      />
      {/* Hull, capsized on its side -- keel up */}
      <path
        d="M270 185 Q 274 165 308 162 Q 344 163 352 182 Q 353 189 340 190 Q 300 195 278 191 Q 269 189 270 185 Z"
        fill="#e9e4d8"
        stroke="#8a8577"
        strokeWidth={2}
      />
      {/* Hull-plank shading lines */}
      <path
        d="M280 178 Q 310 172 344 180"
        fill="none"
        stroke="#b8b2a0"
        strokeWidth={1.4}
        opacity={0.8}
      />
      <path
        d="M276 186 Q 308 182 348 187"
        fill="none"
        stroke="#b8b2a0"
        strokeWidth={1.4}
        opacity={0.8}
      />
      {/* A faded stripe, the only spot of color left on her */}
      <path
        d="M282 172 Q 310 167 340 173"
        fill="none"
        stroke="#c1443a"
        strokeWidth={2}
        opacity={0.55}
      />
      {/* Splintered hole in the hull */}
      <path
        d="M316 174 L323 172 L326 178 L320 182 L314 180 Z"
        fill="#2a3a42"
        opacity={0.85}
      />
    </g>
  );
}
