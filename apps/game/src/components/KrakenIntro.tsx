import krakenIcon from "../assets/kraken-icon.svg?raw";

// Title-card flourish shown right before a Kraken game begins.
// The background icon is vendored from SVG Repo -- see
// src/assets/kraken-icon.svg for source/license. It's already solid black;
// the dark overlay behind it is what lets you make out the silhouette.
export function KrakenIntro() {
  return (
    <div className="kraken-intro" role="alert">
      <svg
        className="kraken-intro__icon"
        viewBox="0 0 128 128"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: krakenIcon }}
      />
      <p className="kraken-intro__text">RELEASE THE KRAKEN!</p>
    </div>
  );
}
