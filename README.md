# Puffer Power

A tiny reading game for early elementary kids. A friendly voice asks **"Which one
spells &lt;word&gt;?"** and three flash cards show 1&ndash;4 letter sight words. Pick the
right card to help a puffer fish survive a circling shark.

## How it plays

- **5 rounds.** Every round the shark swims one step closer to the puffer fish.
- **Correct answer:** the puffer fish grows.
- **Wrong answer:** the puffer fish stays the same size (the shark still closes in).
- **After round 5:**
  | Correct | Ending |
  | --- | --- |
  | 0&ndash;2 | The shark eats the puffer fish. |
  | 3 | The puffer fish survives &mdash; barely (heavy damage). |
  | 4 | The puffer fish survives with a scratch. |
  | 5 | The puffer fish puffs up and defeats the shark. |

## Develop

An npm-workspaces monorepo: the game lives in `apps/game/` (paths below are
relative to it). The root `package.json` proxies these scripts to it.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # game logic + a render smoke test
npm run build      # type-check + production bundle
npm run screenshot # drive the running dev server, save screens to screenshots/
```

Add `?debug=1` to the URL for an overlay that jumps straight to each ending.

`npm run screenshot` needs the dev server running and a Chrome/Chromium binary
on `PATH` (or `CHROME_BIN`). `scripts/screenshot.mjs` has no dependencies &mdash;
it drives headless Chrome over the DevTools Protocol and captures every screen
(start, a round, the answer reveal, and all four endings). It's a manual
"does it look right" tool, not part of CI.

## Audio

Spoken clips live in `public/audio/` and are committed, so the app works offline.
To regenerate them (e.g. after editing the word list in `src/data/words.ts`):

```bash
npm run audio:gen
```

The script (`scripts/generate-audio.mjs`) has no dependencies &mdash; it fetches MP3s
from the free Google Translate TTS endpoint. It needs network access when you run
it, not at runtime.

## Tech

Vite + React + TypeScript. The shark and puffer fish are inline SVG animated with
CSS (no animation library). State lives in `src/game/useGame.ts`.
