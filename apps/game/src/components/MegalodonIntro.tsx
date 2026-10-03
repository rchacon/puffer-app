import { stripRootSvgDimensions } from "./vendoredSvg";
import rawMegalodonIcon from "../assets/megalodon-icon.svg?raw";

// Its source's root <svg> carries width="800px" height="800px" alongside
// its viewBox="0 0 512 512" -- see vendoredSvg.ts for why that has to come
// out before nesting this inside the wrapper below.
const megalodonIcon = stripRootSvgDimensions(rawMegalodonIcon);

// Title-card flourish shown right before a Megalodon (and every time the
// cycle comes back around to it) game begins -- the first
// genuine "boss fight," see AGENTS.md. Same technique as KrakenIntro.tsx:
// a big, mostly-transparent vendored silhouette (this one an open shark
// jaw, teeth and all -- from SVG Repo, see src/assets/megalodon-icon.svg
// for source/license) behind the title line, already solid black so a
// dark overlay is what lets the silhouette read.
export function MegalodonIntro() {
  return (
    <div className="megalodon-intro" role="alert">
      <svg
        className="megalodon-intro__icon"
        viewBox="0 0 512 512"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: megalodonIcon }}
      />
      <p className="megalodon-intro__text">You're going to need a bigger boat.</p>
    </div>
  );
}
