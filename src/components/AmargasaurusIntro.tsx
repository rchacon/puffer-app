import { stripRootSvgDimensions } from "./vendoredSvg";
import rawDinoParkIcon from "../assets/dino-park.svg?raw";

// Its source's root <svg> carries width="800px" height="800px" alongside
// its viewBox="0 0 512 512" -- see vendoredSvg.ts for why that has to come
// out before nesting this inside the wrapper below.
const dinoParkIcon = stripRootSvgDimensions(rawDinoParkIcon);

// Title-card flourish shown right before an Amargasaurus (and every time
// the cycle comes back around to it) game begins -- the fourth
// boss fight, following KrakenIntro/MegalodonIntro's exact technique (a
// big, mostly-transparent vendored silhouette behind the title line, dark
// overlay makes it readable). The silhouette (`src/assets/dino-park.svg`,
// a herd of dinosaurs) is user-provided, not vendored/licensed -- see
// AGENTS.md. Uses `.megalodon-intro`'s slow loom-in animation and quiet
// tone rather than the Kraken's violent shake -- this line is delivered
// with wonder, watching the herd, not shouted as a battle cry (the same
// "Sam Neill watching the gallimimus herd" moment the user's own request
// described -- see bossIntros.ts's BOSS_INTROS.amargasaurus for the music/voice
// side of that).
export function AmargasaurusIntro() {
  return (
    <div className="amargasaurus-intro" role="alert">
      <svg
        className="amargasaurus-intro__icon"
        viewBox="0 0 512 512"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: dinoParkIcon }}
      />
      <p className="amargasaurus-intro__text">They do move in herds.</p>
    </div>
  );
}
