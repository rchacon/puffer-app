import bloopSpectrogram from "../assets/bloop-spectrogram.jpg";

// Title-card flourish shown right before a Bloop (and every time the
// cycle comes back around to it) game begins -- see AGENTS.md. Unlike
// the Kraken/Megalodon's vendored creature-silhouette icon, the visual here
// is the actual NOAA spectrogram of the real recording (public domain, a
// US federal government work -- see AGENTS.md for provenance), since the
// point of this boss is the real thing, not a drawn stand-in for it. No
// spoken voice line either, for the same reason: App.tsx plays the
// recording itself instead (BOSS_INTROS.bloop has no voiceCue).
//
// The small caption line under the title is the same "this is real, not
// drawn/synthesized" point made explicit in words -- "summer 1997" rather
// than a specific day since that's what NOAA's own page actually says
// (pmel.noaa.gov/acoustics/sounds/bloop.html gives no exact date, just
// "recorded in the summer of 1997"); a made-up day would undercut the
// whole "this part is real" point of adding it.
export function BloopIntro() {
  return (
    <div className="bloop-intro" role="alert">
      <img className="bloop-intro__spectrogram" src={bloopSpectrogram} alt="" aria-hidden="true" />
      <p className="bloop-intro__text">The loudest sound ever heard in the ocean.</p>
      {/* Forced onto two lines (not just relying on the text wrapping
          naturally) so "summer 1997" reliably lands lower on the
          spectrogram, over its more reddish band -- the yellow caption
          text was hard to read against the yellow band it sat on before. */}
      <p className="bloop-intro__caption">
        Recorded by NOAA
        <br />
        summer 1997
      </p>
    </div>
  );
}
