import krakenArtwork from "../../assets/kraken.svg?raw";

// The level-10 finale deliberately breaks from every other creature's flat
// cartoon style: a detailed, public-domain illustration (see
// src/assets/kraken.svg for source/license) embedded as-is via
// dangerouslySetInnerHTML. Unlike the other creatures this one isn't drawn
// in profile with a clear nose-left "front" -- it's a radial "attacking from
// above" pose. Used at its native orientation (no mirror/rotate): of the
// options tried, this is the one that reads as facing the puffer.
//
// Sized 1.5x its original footprint (was 150 wide; an earlier pass tried
// 1.3x, this pushes further) to feel more like the final boss -- x/y are
// scaled by the same factor so the art stays centered the same way
// relative to the shared approach position, not just grown from a
// corner. At this size its tentacle tips do run off the top/right edges
// of the scene at every approach distance (checked round-by-round,
// including the closest, sharkX=150) -- left as-is rather than shrunk
// back down or repositioned to avoid it: reads as the creature simply
// being too big for the frame to contain, not as a mistake.
export function Kraken() {
  return (
    <g className="kraken">
      <svg
        x={-112.5}
        y={-102}
        width={225}
        height={225}
        viewBox="0 0 600 600"
        dangerouslySetInnerHTML={{ __html: krakenArtwork }}
      />
    </g>
  );
}
