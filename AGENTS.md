# Puffer Power

A small sight-words reading game for early-elementary kids. A female voice asks
"Which one spells &lt;word&gt;?", three flash cards show 1&ndash;4 letter Dolch sight
words, and picking the right one over 5 rounds decides whether a puffer fish
survives a shark -- or, on a replay, something worse.

Vite + React + TypeScript. No CSS framework, no animation library, no state
library &mdash; a `useReducer` state machine and hand-written inline SVG.

## Layout

- `src/game/` &mdash; all logic, browser-free and unit-tested:
  - `rounds.ts` &mdash; `buildRounds(count, pool)` picks targets + 2 distractors
    each; also `MIN_WORDS`.
  - `outcome.ts` &mdash; `getOutcome(score)`, `pufferScale(score)`,
    `outcomeText(outcome, predatorLabel)`, `TOTAL_ROUNDS`.
  - `useGame.ts` &mdash; the `start | playing | reveal | result` state machine.
    `start(pool?)` takes the chosen word list. `answer(index)` (Easy Mode)
    and `answerTyped(word)` (Hard Mode) both resolve through one private
    `resolveAnswer` helper -- see "Game modes" below.
  - `predators.ts` &mdash; `PREDATOR_LEVELS` (one row per level, see that
    array's own length rather than a count restated here) and
    `getPredatorLevel(playCount)`; see "Predator escalation" below.
- `src/components/` &mdash; presentational. `BattleScene` owns the `<svg>` and
  renders whichever creature(s) `predators.ts` resolved, via
  `predators/index.ts`'s `PREDATOR_COMPONENTS` map, plus `Puffer` and
  (Amargasaurus's own level only) `AmargasaurusBackground`, static shore scenery rendered
  directly by `BattleScene` rather than through that map (see "Predator
  escalation" below); `CardRow` / `FlashCard` are Easy Mode's answers,
  `SpellInput` is Hard Mode's (see "Game modes" below); `WordPicker` is
  the start-screen word chooser and `ModeToggle` the Easy/Hard chooser
  next to it.
- `src/components/predators/` &mdash; one illustration per creature (same
  flat-SVG technique as `TapahCatfish.tsx`, currently unused -- `catfish`
  isn't in `PREDATOR_LEVELS`). `Shark.tsx` (one level up, in
  `src/components/`), `Kraken`, `SharkPrincess`, `Piranha`, `Mosasaurus`,
  `Megalodon`, `Anglerfish`, `Eel`, `Bloop` and `Amargasaurus` are
  vendored/user-provided raster or vector art rather than hand-drawn --
  see "Predator escalation" below.
  `Puffer.tsx` (also one level up -- the protagonist, not a
  `predators/` entry) is likewise now vendored vector art, not hand-drawn.
  `scopeIds.ts` is the shared id-uniquing helper `Shark`/`Piranha` both need
  (see there).
- `src/audio/player.ts` &mdash; plays clips from `public/audio/`, degrades to
  silence if a file is missing or autoplay is blocked. Also owns looping
  background-music elements (`startMusic`/`pauseMusic`/`stopMusic`, plus
  `preloadMusic` to warm a fetch ahead of time), driven by
  `useBackgroundMusic.ts`, sharing the same url-keyed cache/`element()`
  helper the one-shot clips above use (`{ loop: true }` sets the one
  difference) rather than a second near-identical cache &mdash; there are two
  distinct tracks in play at different times, but no risk of a url
  collision with a prompt/cue clip. `activeMusic` (whichever cached element
  is the current game's track) is kept in sync by both `startMusic` and
  `pauseMusic` (each takes `url` and re-resolves it), not just
  `startMusic`, so it can't go stale while e.g. muted skips ever calling
  `startMusic` for a newly-escalated level's track; `startMusic` pauses
  whatever `activeMusic` previously pointed to if it differs, so a previous
  game's different track can't keep playing underneath the new one.
  `App.tsx` plays one of two tracks on loop during every level's rounds,
  picked by `predator.kind`: the boss tracks' shared
  `src/assets/ebunny-ocean.mp3` for any kind in `BOSS_INTROS`, or
  `src/assets/skidnney-arcade-game-bgm.mp3` for every other (plain)
  predator's rounds (both user-provided, ~5.4MB/~3MB &mdash; provenance/license
  not verified for either, check before reusing). Starts once the round
  actually begins (after a boss intro's own sting ends, immediately for a
  plain predator) and stops on the result screen. `App.tsx` calls
  `preloadMusic` for the non-boss track unconditionally on mount (every
  session's first level is always a plain predator) but only preloads the
  boss track once `nextPredator.kind` is actually one &mdash; not
  unconditionally on every mount, so a player who never reaches a boss
  level doesn't pay for its ~5.4MB; `nextPredator` is already known for a
  whole game's length before that level itself starts, so this still has
  plenty of lead time once it does trigger. `MuteButton` (corner of the
  app, always visible) pauses whichever track is playing; the choice
  persists in
  `localStorage["puffer-panic:muted"]` (`src/data/muteSelection.ts`).
- `src/shared/` &mdash; plain `.mjs` (not `.ts`) helpers needed by both the app
  and a `scripts/*.mjs` tool, e.g. `textUtils.mjs`'s `toMidSentence` (used by
  `outcome.ts` and `generate-audio.mjs`) &mdash; a `.d.mts` alongside gives
  TypeScript its types. Avoids a hand-duplicated copy in the script that only
  a comment keeps in sync.
- `src/data/words.ts` &mdash; the word bank (one double-quoted literal per word).
- `src/data/wordSelection.ts` &mdash; load/save the chosen words in
  `localStorage["puffer-panic:selected-words"]`, falling back to the full bank.
- `src/data/modeSelection.ts` &mdash; load/save the chosen game mode in
  `localStorage["puffer-panic:mode"]`, falling back to `"easy"`.
- `public/audio/*.mp3` &mdash; committed voice clips.
- `public/favicon.svg` &mdash; synced by hand from `puffer-website`
  (`../puffer-website/public/favicon.svg`, the marketing site repo) so the
  game and the site share a mark. Re-copy it if that file changes there.
- `scripts/*.mjs` &mdash; zero-dependency Node tools (see Conventions).

## Commands

```bash
npm run dev         # http://localhost:5173
npm test            # vitest: game logic + one App render smoke, ~1s, no browser
npm run build       # tsc -b && vite build (+ postbuild writes dist/version.json)
npm run audio:gen   # regenerate public/audio/ (needs network)
npm run screenshot  # drive the running dev server, save screenshots/*.png
```

`?debug=1` on the URL adds an overlay that jumps straight to each ending.

## Checking what's deployed

`npm run build` writes `dist/version.json` (`{ commit, builtAt }`) via the
`postbuild` hook (`scripts/write-version.mjs`), deployed alongside `index.html`
at the site root, so a running copy can be identified with
`curl <site>/version.json`. The commit is a CI-injected SHA (`GITHUB_SHA` /
`AWS_COMMIT_ID`) when set, else `git rev-parse`, else `"unknown"`.

## Game rules (don't reverse-engineer these &mdash; change them here + in `outcome.ts`)

- Always 5 rounds. The shark advances one step every round regardless of the answer.
- Correct answer &rarr; puffer grows in place (`pufferScale = 1 + 0.24 * score`).
  Wrong answer &rarr; short "Oops.", correct card highlighted, no growth.
- Final score &rarr; ending: **0&ndash;2** eaten &middot; **3** survives, barely &middot;
  **4** survives, scratched &middot; **5** puffer defeats the shark.
- The start screen `WordPicker` chooses which words are in play (min `MIN_WORDS`
  = 3, default all). Still 5 rounds always: with a small pool `buildRounds`
  repeats target words but never twice in a row.

## Game modes

Two modes, chosen on the start screen via `ModeToggle` (an always-visible
Easy/Hard pill pair, `src/components/ModeToggle.tsx`) and persisted per
player in `localStorage["puffer-panic:mode"]` (`src/data/modeSelection.ts`,
`loadMode`/`saveMode`) -- like the word selection, **not** session-only like
predator escalation, since it's a standing preference about how someone
wants to play, not part of any one game's escalating difficulty.

- **Easy Mode** (the original, only mode before this) -- three flash cards
  (`CardRow`/`FlashCard`), tap the one that spells the target word.
- **Hard Mode** (`src/components/SpellInput.tsx`) -- spell the target word
  instead. Deliberately **not** a hand-built on-screen key grid: a real
  (visually hidden) text `<input>` does the actual typing, so it gets a
  physical keyboard's native key handling on desktop and the device's own
  software keyboard on phones/tablets for free -- backspace included --
  instead of reimplementing either. A row of blank tiles (one per letter of
  the target word) is the only thing actually shown; it fills in as the
  hidden input's value changes, and clicking/tapping a tile focuses that
  input (same "hidden input, styled element carries the look" technique
  `.wordpicker__chip` already uses for its checkboxes). Submitting is
  explicit -- a Check button (enabled once every tile is filled) or Enter on
  the input -- rather than auto-submitting the instant the last tile fills,
  so a kid can still backspace-correct a mis-tap even after typing the last
  letter, before committing. During the reveal, each tile colors green/red
  against the target the same way `.card--correct`/`.card--wrong` color the
  cards in Easy Mode, and -- mirroring how `CardRow` always highlights the
  correct card even on a wrong pick -- shows the correct spelling
  underneath if the attempt didn't fully match.

**This is a UI-only fork, not a rules change.** `Round` (`rounds.ts`) is
unchanged and still always carries `target`/`options`/`correctIndex`
regardless of mode -- Hard Mode's `SpellInput` just never reads `options`/
`correctIndex`. `outcome.ts`, scoring, `TOTAL_ROUNDS`, and the shark/puffer
escalation are all untouched; see "Game rules" above, which still fully
describes both modes. `useGame.ts`'s `answer(index)` (Easy) and
`answerTyped(word)` (Hard) both funnel into one private `resolveAnswer`
helper that does the actual scoring/cue/advance-or-finish work, so the two
entry points are provably equivalent past that point -- see
`useGame.test.ts`'s `answerTyped` tests, which assert the same
victory/defeat cue behavior `answer`'s own tests already cover.

Both modes reuse the existing `prompt-<word>.mp3` voice clips unchanged
(the spoken prompt is the same question either way -- "Which one spells
`<word>`?" reads a little oddly with no cards on screen in Hard Mode, but
the word itself is still said clearly, which is what actually matters) and
the existing `correct.mp3`/`wrong.mp3` cues via the shared `resolveAnswer`
tail -- no new audio was generated for Hard Mode.

Confirmed non-goals for v1, so they're not oversights: no per-letter audio
cue (only the existing correct/wrong cue on submit); no Wordle-style
key-memory coloring (there's no on-screen keyboard to color in the first
place).

## Predator escalation

Each game actually *started* this session (including the very first) bumps a
`playCount` in `App.tsx` and advances one step through `PREDATOR_LEVELS` in
`src/game/predators.ts` -- the first level is one shark, the last level
(currently the Kraken -- see `PREDATOR_LEVELS`) wraps back to the first.
**Visual/thematic only**: every level still plays
the same 5 rounds with the same scoring thresholds above; only what
`BattleScene` draws, the `ResultScreen` wording, and the defeat/victory voice
line change. The counter is **session-only** (a plain `useState`, not
persisted) -- unlike the word selection, reloading the page resets it to
the first level.

The Shark Princess's escort ("The Shark Princess and her two brothers")
is the one level that mixes creatures instead of rendering `count`
copies of one `kind` -- two `PredatorLevel` fields exist just for this:
`kinds` (per-instance kind, same length as `count`) and `offsets`
(per-instance position/scale, overriding the generic same-size
`getSchoolOffsets(count)` formation). Both are read by index in lockstep
in `BattleScene.tsx` (`getInstanceKinds(predator)` for the kind,
`predator.offsets ?? getSchoolOffsets(predator.count)` for the position),
and array order is also *draw* order -- later entries render on top. The
escort level uses that to give the Princess the exact same
`{dx: 0, dy: 0, scale: 1}` position/size her solo appearance ("The Shark
Princess") uses (not just "full size" in the abstract -- matching that
other entry's own numbers directly), drawn last (in front), with her two
brother sharks small (`scale: 0.4`) and spread well apart from her
(drawn first, behind her). Tucking them in low next to her at a bigger
scale, the first attempt at this, looked wrong once actually rendered
two different ways: reusing the generic 3-slot school formation
(`getSchoolOffsets(3)`) as-is made all three read as the same size; a
custom formation that still kept the brothers large and close (`scale:
0.55`, tight spacing) fixed that but let them visually overlap/crowd the
Princess enough that she read as smaller than her solo self, even
though her own `scale` was already `1` both times -- the occlusion was
the actual problem, not her size. `predators.test.ts` pins both the kind
order and the relative scale (finding the escort entry by its own label,
not a level number) so a future edit to either can't silently swap who's
in front.

The defeat/victory voice cue names the actual predator: `useGame.start(pool,
predatorLabel)` stashes the label in a ref purely so `outcomeAudioCue()` in
`outcome.ts` can pick `defeat-<slug>.mp3` / `victory-<slug>.mp3` at the end
(text matches `outcomeText()`, generated by `scripts/generate-audio.mjs` from
`PREDATOR_LEVELS`'s labels -- one pair of clips per level). Keyed
by the predator's own (slugified) `label`, not its numeric `level`, so these
filenames don't need renaming every time levels get reordered -- see the
"Reduce diff size on level reorders" section below. The survive outcomes
stay generic (`survive-barely.mp3`/`survive-hurt.mp3`) since their text
never mentions the predator either.

The Kraken (and every time the cycle wraps back to it) gets an
extra title-card flourish -- `App.tsx`'s `handleStart` detects it via
`nextPredator.kind`, shows `KrakenIntro`, and plays both
`release-the-kraken.mp3` (the voice line) and `src/assets/kraken-music.wav`
(a quieter background sting, via the generic `playUrl()` in
`audio/player.ts`) for ~2.1s before the round actually begins (`beginGame`).
The Kraken's own artwork (`src/components/predators/Kraken.tsx`) is a
vendored illustration, not hand-drawn like the others -- see that file's
header comment for why it isn't mirrored/rotated like you'd expect, and
for why it's sized 1.5x its original footprint (a later tweak, after the
Kraken already shipped, to make the final boss feel bigger -- tentacle
tips are left to run off the scene's edges at this size rather than
shrunk/repositioned to avoid it).

`ShipWreck.tsx` also got a later fix: its hull sat a few units above the
sand's own wavy curve, a gap easy to miss in isolation but visible once
actually playing (Rocks and the seabed sand sit at a fixed y, but the
sand curve dips/rises with x -- the wreck's original coordinates were
picked without checking against it at its specific x-range). Nudged the
whole group down 9 units, and dropped its group-wide 0.85 opacity, which
read as translucent/ghostly rather than "resting on the seabed."

`kraken-music.wav` is trimmed (with a baked-in fade-out, no real cut point
existed in the source -- see the RMS-envelope analysis this was picked from)
from "Heavy Concept A Bass Master" by cynicmusic, CC0, via OpenGameArt:
https://opengameart.org/content/dramatic-boss-encounter -- unlike the Kraken
SVG this lives in `src/assets/` and is played through a Vite asset import
(`import krakenMusic from "./assets/kraken-music.wav"`), not `public/audio/`,
since it isn't part of the TTS pipeline `generate-audio.mjs` covers.

`KrakenIntro` also shows a big black kraken emblem behind the text
(`.kraken-intro__icon`, `src/assets/kraken-icon.svg`) -- "Mode Standard
Kraken" from SVG Repo (svgrepo.com/svg/355417/mode-standard-kraken). SVG Repo
blocks automated fetches with a bot-detection checkpoint, so this was
downloaded by hand and its exact license wasn't independently re-verified --
check that page before reusing this icon anywhere beyond this one spot.

The Megalodon (and every time the cycle comes back around to it)
is the other boss fight, added well after the Kraken's -- `App.tsx`'s
`BOSS_INTROS` is a lookup keyed by `PredatorKind` (kraken and megalodon
both entries) rather than another hardcoded `if` in `handleStart`, so a
third boss just adds a row. `MegalodonIntro` follows `KrakenIntro`'s exact
technique (vendored silhouette behind a title line, dark overlay makes it
readable) but a different mood on purpose: `.megalodon-intro`'s deep
ocean blue-black background and the text's slow `megalodonLoom` scale-in
(vs. the Kraken's violent `krakenShake`) match a line delivered quietly
in dread, not screamed as a battle cry. The silhouette
(`src/assets/megalodon-icon.svg`, an open shark jaw) is vendored from SVG
Repo -- same bot-detection-checkpoint provenance caveat as
`kraken-icon.svg` above.

`megalodon-music.wav` is trimmed from "Oldschool Horror Theme" by
EmoPreben, CC0, via OpenGameArt:
https://opengameart.org/content/oldschool-horror-theme -- picked the same
way `kraken-music.wav` was (RMS-envelope analysis of the source to find
its loudest sustained ~2.3s stretch, here around the 64s mark, rather
than guessing), with a short fade-in/fade-out baked in. Imported the same
way too: lives in `src/assets/`, played via `playUrl()`, not part of the
`generate-audio.mjs` TTS pipeline. The voice line itself
(`"You're going to need a bigger boat."`, `bigger-boat.mp3`) *is* part of
that pipeline -- added as a `CUES` entry in `generate-audio.mjs` like
`release-the-kraken` -- but was generated as a one-off (the same
`fetchTts()` call the script itself makes) rather than by running a full
`npm run audio:gen`, to avoid regenerating and re-committing all 65
existing clips (mostly byte-different re-encodes of unchanged text, pure
TTS non-determinism -- see the "Reorder levels 5-8" commit) just to add
one new file.

The Megalodon's own artwork (`src/components/predators/Megalodon.tsx`)
used to just reuse `Shark`'s vendored art scaled 1.5x and darkened via a
`.megalodon` CSS filter (an "it's just a bigger ancient shark" shortcut);
it's now real vendored vector art of its own
(`src/assets/megalodon.svg`, user-provided -- no embedded license/author
metadata the way `piranha.svg`'s does, so treat it like the
Puffer/Rock/Coral SVG Repo assets and verify provenance before reusing it
elsewhere), drawn at a scale no other predator gets close to -- large enough that its full body, tail included, never fits
on screen; only the area from its nose back to about its gills does, and
that's the actual design goal, not a bug to work around ("I don't even
want to see the boss's full body... it's ok if we just see tip of nose
to gills, that's all that will fit"). Its nose/gill positions were found
by rendering the source with a labeled coordinate grid overlaid (the same
technique used for the Puffer's mouth-replacement patch) rather than
guessing: gills sit roughly 226 source-units in from the nose. Unlike the
Mosasaurus (see below, and issue #15 questioning whether that one ever
actually needed it), this doesn't need any `PREDATOR_APPROACH`
special-casing -- the plain shared linear approach already reads as a
dramatic, gradually-escalating reveal at this scale, verified
round-by-round via headless Chrome exactly the way the Mosasaurus's
curve was tuned/verified.

A small hand-drawn wrecked fishing boat (`src/components/FishingBoat.tsx`,
a nod to the Orca from *Jaws*) sits on the seabed for this level only,
same absolute-scene-coordinates technique as `ShipWreck.tsx` -- positioned
where the Megalodon's approach will eventually cover it, which is fine;
the whole point of a boss this size is that it can.

The Bloop is the third boss fight, inserted between the
Anglerfish and the Kraken (originally between the eels and the
Anglerfish -- levels 9 and 10 were swapped afterward, see the
levels-shift note at the end of this section). Its artwork (`src/components/predators/Bloop.tsx`,
`src/assets/bloop.png`, user-provided) hit the same fake-transparency trap
as SharkPrincess/Mosasaurus/Anglerfish before it (`im.mode == "RGB"`, the
checkerboard baked into opaque near-white pixels, not a real alpha
channel), fixed the same way (flood-fill from the border), then
palette-quantized to 128 colors with dithering like the Anglerfish/Eel
(checked for banding on the smoothest shaded area first; none, same flat
cel-shading reason as those two).

Went through two different framings before landing on the current one.
The first brief called for something even more extreme than the
Megalodon -- so huge that not even "nose to gills" fits, just a fraction
of the open jaw and one eye ("it's ok if a lot of the bloop is off frame,
most important is to see its eye"). At that scale (`width={1400}`, close
to 4x the Kraken's) even the *default* approach position put its mouth
over the puffer at round 1 -- anchoring on the eye instead of the
frontmost point (the pupil, a solid near-black blob found by
color-thresholding it apart from the mouth interior's own dark navy) left
~366 local units of open mouth overhanging further left than the anchor
itself, well past what the Megalodon's own huge scale ever has to account
for (its anchor *is* its frontmost point, nothing overhangs past it), and
needed a much larger `PREDATOR_APPROACH.startX` (650) to give that
overhang room to close in gradually rather than starting the round
already covering the puffer. That, in turn, made 505KB (the size after
the flood-fill/quantize pass above) worth shrinking further -- but 600px
turned out visibly blurry on a real device even though it read as sharp
in a development screenshot, and only 900px (~154KB) actually held up.

The second, current brief reversed course entirely: scale it down
dramatically instead, so the *whole* creature -- not just the eye and a
fraction of the jaw -- is visible, at least vertically (left-right
cropping is still fine, same as every other predator). `Bloop.tsx` is
now sized to its own vertical extent instead of "however wide the art
is": `height={180}` fits inside the scene's 200-unit height with a
little margin at `PREDATOR_Y=94` (94-90=4 to 94+90=184), so nothing is
ever cropped top-to-bottom. Horizontally it's still anchored on the eye
(the same pupil-detection coordinates as before, just rescaled) for
consistency with how every other predator's mouth/nose lands on the
shared approach point -- but at this much smaller size the "366-unit
overhang" problem the first framing had doesn't recur (the whole art is
only ~98 units wide behind that anchor now, in the same ballpark as
Piranha's or Shark's own nose offset), so the custom `PREDATOR_APPROACH`
entry from the first framing was removed; the plain default approach
reads fine. The smaller display size also meant the source image itself
could shrink back down without any of the blur the same 600px version
had at the old, much bigger display size -- confirmed the same way (an
actual in-game screenshot, not an isolated crop) before trusting it.
1.63MB down to ~85KB.

`BattleScene.tsx` also draws the Bloop in the opposite z-order from every
other predator: everyone else draws on top of the puffer (puffer first,
predator second, the default/unconditional order); the Bloop draws first,
underneath, via a `predatorGroup` built once and placed on whichever side
of the puffer's own `<g>` the kind calls for. As its wide-open mouth
closes in and overlaps the puffer's position, this keeps the puffer
visible sitting inside the dark mouth interior instead of the jaw simply
covering it -- reads as swimming into the mouth, not just being chased by
it. `Coral`/`Kelp` are also skipped for this level (same conditional that
already skips them for the Anglerfish's sunless abyss, extended to check
`predator.kind !== "bloop"` too) -- a different reason than the
Anglerfish's (this isn't about depth/sunlight), just a plainer seabed
reading better at the scale this one's drawn.

Unlike the Kraken/Megalodon, the Bloop's intro (`BloopIntro.tsx`) has no
spoken voice line -- `BOSS_INTROS.bloop` in `App.tsx` omits `voiceCue`
(now optional on the `BossIntro` type for exactly this) because the whole
point of this boss is the real 1997 NOAA hydrophone recording nicknamed
"the Bloop," not a synthesized line standing in for it. `bloop-sound.wav`
is that actual recording (trimmed to its two loudest ~4.7s of activity via
the same RMS-envelope-analysis technique as `kraken-music.wav`/
`megalodon-music.wav`, fades baked in), fetched directly from NOAA PMEL's
own Acoustics Program page (pmel.noaa.gov/acoustics/sounds/bloop.wav) --
a US federal government work, so public domain rather than the
CC0-via-OpenGameArt provenance the other two bosses' music has. It plays
through `BOSS_INTROS.bloop.music` (the same `playUrl()` mechanism as the
other bosses' background stings) at a much less "background" volume
(0.9, vs. their ~0.55-0.6), since here it's the whole point, not ambience
under a voice line.
`bloop-spectrogram.jpg` is likewise NOAA's own real spectrogram image of
this exact recording (pmel.noaa.gov/acoustics/spectrograms/bloop.jpg,
same public-domain provenance), cropped down to just the colorful
heatmap plot (color-thresholded to find its bounds) with the white
margins and axis labels trimmed off, since those read as a screenshot of
a web page rather than an intro visual. It's `BloopIntro`'s whole
background -- a real readout instead of the Kraken/Megalodon's vendored
creature-silhouette convention, since there's no "monster shape" to
silhouette here; the recording itself, and what it actually looked like
on a hydrophone, is the point.

Levels 9-11 (`predators.test.ts` pins the count at exactly 11 rows,
1-11, plus the `getPredatorLevel` cycle length) went through two rounds
of `defeat-<level>.mp3`/`victory-<level>.mp3` regeneration. First, the
Bloop's insertion: 9 said "The Bloop," 10 said the Anglerfish's own text
(shifted down from 9), and 11 was a wholly new pair for the Kraken
(shifted down from 10). Then levels 9 and 10 were swapped back (Bloop to
10, Anglerfish to 9, Kraken staying put at 11) -- a second, smaller
regeneration of just those two positions' text, back to what it said
before the Bloop was ever inserted. Same "regenerate only the shifted
positions, not a full `npm run audio:gen`" approach both times, per the
"Reorder levels 5-8" commit.

The Amargasaurus is the fourth boss fight, inserted between the
Bloop and the Kraken (shifting the Kraken from level 11 to 12 --
`predators.test.ts`'s level-count/cycle-length assertions and
`App.test.tsx`'s Kraken-intro tests both had to move from 10/11
playthroughs to 11/12). It's also the one deliberate departure from every
prior level's "ocean, predator swims at the puffer" formula: the Puffer's
swept into a shallow lake instead, with land and a second, harmless
Amargasaurus visible above the waterline -- the user's own reference point
was the layered background/foreground depth Mario Wonder uses for its own
scenery, not another approach-curve predator.

Two user-provided raster photos came with this level (not
vendored/licensed -- verify provenance before reusing elsewhere), both
already carrying real per-pixel alpha (confirmed via the alpha channel's
actual extrema, not the checkerboard preview) so neither needed the
flood-fill fake-transparency rescue the Anglerfish/Mosasaurus/Bloop
sources did. Both were cropped to content, downscaled, and
palette-quantized (`Image.quantize(colors=128, method=Image.FASTOCTREE,
dither=Image.FLOYDSTEINBERG)`, checked for banding on the smoothest
shaded area first; none, same flat cel-shading reason as every other
quantized predator) -- but saved as actual indexed-palette (`P`-mode) PNGs
this time, not quantized-then-flattened-back-to-`RGBA` like the earlier
predators were. A quantized image only has ~128 distinct colors either
way, but storing it as a real palette (one byte per pixel plus a small
color table) instead of full 32-bit-per-pixel truecolor is a further ~70%
off on top of the quantization itself -- worth applying the next time an
existing predator PNG gets touched, not just new ones.

`AmargasaurusBackground.tsx` is the static one -- a second Amargasaurus,
already bent down drinking, standing at the horizon line the whole game
(`src/assets/amargasaurus-background.png`, 360x235 downscaled, ~20KB).
Positioned in scene-absolute coordinates directly inside `BattleScene.tsx`
(same convention as `ShipWreck.tsx`/`FishingBoat.tsx`), not through the
`PREDATOR_COMPONENTS`/approach-curve machinery every actual predator goes
through, since it never needs to move or react to game state at all.

`Amargasaurus.tsx` (`src/components/predators/Amargasaurus.tsx`) is the
actual threat, and went through two redesigns before landing back on
every other predator's own plain convention. The first cut followed that
convention from the start: a close-up head/neck raster
(`amargasaurus-foreground.png`, an earlier source photo since replaced --
see below) nose-anchored and swimming in via the default `sharkX`
approach curve, mouth open as if lunging. The user rejected this shape of
animation, not just its tuning: *"i dont want the dino in foreground
swimming towards the fish. its standing in water (off in distance) and
you see its head submerge as if its drinking water."*

That meant the creature needed to stay in one place while still visibly
escalating round over round -- something none of the existing
`PREDATOR_APPROACH` entries did (they all reshape *how fast* `sharkX`
closes in, never whether it moves at all). Two changes made it possible:
`PREDATOR_APPROACH.amargasaurus = { startX: 300, ease: () => 0 }` (the
shared `sharkX` formula collapses to a constant when `ease` always
returns 0, pinning the group in place instead of sliding it toward 150),
and a `progress?: number` prop threaded through `PREDATOR_COMPONENTS`'s
shared type (`components/predators/index.ts`) and passed from
`BattleScene.tsx` into every `<Creature>` -- every predator but this one
ignored it. Inside the component, `progress` drove an outer `translate`
(the head sliding down from just above the waterline at round 1 to past
the predator anchor's own submerged depth by the last round), a small
extra `rotate`, and a gentle `scale` growth, in place of any horizontal
movement.

The user then swapped in a new source photo mid-redesign
(`amargasaurus-foreground.png`, replacing the original) with a much
sharper natural neck curve that already reads as "leaning down to drink"
on its own -- *"i thnk it might give the approach angle im going for."*
Re-processed the same way (crop/downscale-to-700px-wide/quantize, ~69KB),
re-found the nose tip via the usual coordinate-grid-overlay technique
against the new file. That new curve turned out to make the whole
stationary-dip mechanic unnecessary: *"the dino can approach horizonally
similar to other predators. the fact that the image contains a dino
looking downward might take away the need for a custom approach."*
`Amargasaurus.tsx` reverted to the plain nose-anchored-raster-plus-default-
approach shape every other predator uses (no `PREDATOR_APPROACH` entry,
no `progress` prop -- `PREDATOR_COMPONENTS`'s type reverted too, back to
a plain `ComponentType`), relying on the photo's own downward angle to
sell "leaning toward the water" as it swims in like everything else does.

The source photo itself changed one more time after that: the close-up
head/neck crop read as "a floating neck" once the plain approach closed
in and the frame/puffer cropped away everything else, nothing anchoring
it as a whole creature. `amargasaurus-foreground.png` briefly became a
full-body side view instead (head, body, legs) to fix that -- hit the
same fake-transparency trap as several predators before it along the
way, except this source's checkerboard used two distinct grey tones
rather than one, so the flood-fill's background-color test had to match
both (a range test on saturation and lightness, not a single fixed
threshold) or it left one tone's checker squares opaque -- but was
reverted back to the close-up crop shortly after: dealing with the
legs' own ground placement (see the now-removed sand-patch paragraph
this replaced) wasn't worth it for one predator. The actual fix for the
close-up crop's floating-neck problem turned out to be much simpler --
see the `PREDATOR_APPROACH.amargasaurus` entry below.

The boss intro (`AmargasaurusIntro.tsx`) follows Kraken/Megalodon's
silhouette-behind-title-line technique, using another user-provided asset
(`src/assets/dino-park.svg`, not sourced/licensed like the SVG Repo
icons -- verify provenance before reusing) and `.megalodon-intro`'s slow
loom-in rather than the Kraken's violent shake, matching a line delivered
with quiet wonder, not shouted. That line -- *"They do move in herds."*
-- and the whole intro's framing is the user's own Jurassic Park
reference (the Gallimimus-stampede beat), reused as a design touchstone
rather than any of the film's actual copyrighted lines/audio. The voice
line (`move-in-herds.mp3`) went through the same one-off-`fetchTts()`
pattern as `bigger-boat.mp3`/`release-the-kraken.mp3` -- added as a
`CUES` entry in `generate-audio.mjs` for future full regenerations, but
generated directly here to avoid re-rolling all the other clips' TTS
non-determinism just to add one file.

`amargasaurus-music.wav` went through three candidates before landing on
the current one, each trimmed the same way `kraken-music.wav`/
`megalodon-music.wav` were (RMS-envelope analysis to find the loudest
sustained stretch, fades baked in): first "A Legend Will Rise" by
CodeManu, CC0 via OpenGameArt
(opengameart.org/content/a-legend-will-rise-orchestral), a short
standalone "epic uplifter" cue -- replaced when the user asked for
something closer to a specific well-known film theme's mood. The second
candidate the user pointed at directly was a Pixabay track *titled*
after that film -- declined rather than used: a fan reinterpretation
named after a copyrighted score is a real infringement risk regardless
of Pixabay's own license terms (which only cover what the uploader
actually owns, not a melody they don't), so this was flagged back to the
user instead of downloaded. "Dawn of Time" by geoffharvey, also via
Pixabay (pixabay.com/music/modern-classical-dawn-of-time-369563) -- an
independent, Content-ID-registered composition (evolution/dinosaur/
nature themed, not named or modeled after any existing score) -- is the
current pick; downloaded by hand (Pixabay blocks automated fetches with
a bot-detection checkpoint like SVG Repo elsewhere in this doc) and
handed over as an unstaged file, same as every raster asset in this
project. First trimmed to a ~2.6s slice of its loudest sustained
plateau (around the 51s mark of its ~79s length, found via the same
RMS-envelope technique as `kraken-music.wav`/`megalodon-music.wav`) --
then re-trimmed from the very start of the track instead, per explicit
request, rather than that louder mid-track stretch. `durationMs` on
`BOSS_INTROS.amargasaurus` (2700) covers this clip's own ~2.6s length
rather than the shorter voice line's, so its fade-out finishes instead
of getting cut off mid-swell.

`BattleScene.tsx`'s `isShore` flag (true only for this kind, same
per-kind-backdrop-swap pattern as the Anglerfish's `isMurky`) swaps the
usual `#sea`/`#seaMurky` gradient for a bright `#lakeSky`/`#lakeWater`
pair split at a `SHORE_HORIZON_Y=70` line, adds two overlapping hill
`<path>`s above the waterline for a layered-depth look, and skips
`Coral`/`Kelp` (a shallow freshwater lake, not a reef -- same exclusion
reasoning as the Anglerfish/Bloop, third distinct reason on that same
conditional). The seabed sand curve and `Rocks` are kept as-is, doing
double duty as a lake bed/shoreline instead of an ocean floor.

Both Amargasaurus creatures briefly got their own small sand patch so
their feet planted on visible ground instead of sitting right at the
bare hill/water boundary -- a downward-bulging `<path>` under
`AmargasaurusBackground`, and one baked into `Amargasaurus.tsx` itself
so it would travel with the creature's own `sharkX` translate. Both were
removed again: the foreground one stopped mattering once that source
photo reverted to the close-up crop with no visible feet in frame (see
above), and the background one was reverted per explicit feedback --
*"no sand for background dino. the way it was before was good."* Worth
knowing if a future predator needs the same "feet planted on ground"
treatment: the technique (a `Z`-closed downward-bulge `<path>`, same
sand tone as the seabed) worked fine on its own terms, it just wasn't
what this particular level wanted.

The close-up head/neck crop's own "disembodied neck" problem (see
above) was fixed differently: `PREDATOR_APPROACH.amargasaurus` caps its
`ease` at `t * 0.75` instead of the usual 1, so the shared
`sharkX = startX - approachProgress*(startX-150)` formula never reaches
its normal endpoint -- final contact lands at sharkX=200 (75% of the
default 200-unit closing distance from `startX=350`) instead of 150.
*"maybe you can move the fish closer so the dino doesn't have to cover
as much ground"* -- read as "shorten the final approach" rather than
literally repositioning the Puffer (which is a shared, unconditional
constant every level relies on; changing it for just one level would
risk the Rocks-clearance tuning `AGENTS.md` notes elsewhere), capping
`ease` achieves the same effect from the predator's side instead: the
same close-up crop that read as a disembodied neck at the *default*
closest approach reads as a real threat 50 units short of it.

The `FootballShark` is inserted right before the Megalodon in play
order -- like the Dunkleosteus/Swordfish, it's a plain predator, not a
boss fight: no `BOSS_INTROS` entry, no `PREDATOR_APPROACH` override,
just the shared default linear approach. A cartoon shark restyled as an
American football (white laces down its back, a football helmet with a
strand of seaweed and a starfish tucked under it), user-provided.
`src/assets/football-shark.png` is a processed derivative: the source
had no alpha channel at all (`im.mode == "RGB"`), a flat two-tone grey
checkerboard baked into fully opaque pixels -- the plainest version of
the fake-transparency trap seen so far, fixed the usual way
(flood-fill from the border, matching both near-neutral-grey checker
tones), except this source's own helmet is *also* white/grey: flooding
only from pixels actually reachable from the canvas border (not a
global "replace grey" pass) left the enclosed helmet untouched since
it's never connected to the border. Cropped to content, downscaled to
320x187 -- like the Swordfish, kept shark-scale (159x93 in
`FootballShark.tsx`, matching the plain `Shark`'s own footprint) rather
than a boss-fight predator's bigger 600px-wide source. ~2MB down to
~80KB. The bite point (roughly the midpoint between the two front fang
tips, same convention as every other toothed predator) was found the
usual coordinate-grid-overlay way and anchored at the local origin.

The Dunkleosteus is inserted right after the Megalodon --
unlike the Amargasaurus/Bloop/Megalodon, it's a plain predator, not a
boss fight: no `BOSS_INTROS` entry, no intro card/music/voice line, just
a normal approaching creature like the Shark or Anglerfish, using the
shared default linear approach (with one tuning override -- see the
`PREDATOR_APPROACH.dunkleosteus` paragraph below).

The first source image dropped for this level never got used: boosting
the contrast on its "transparent" background revealed a faint tiled
circular watermark pattern baked into it -- the kind of repeating logo
stock sites (Freepik/Adobe Stock/Vecteezy-style) stamp on preview images
before an asset is actually purchased/licensed. Flagged back to the user
rather than processed -- Pixabay's own "Content License" caveat elsewhere
in this doc is about the underlying composition of a *licensed* track;
this was different, direct evidence the file itself likely wasn't a
licensed asset at all. The second source the user provided instead
checked out clean: every fully-transparent pixel sampled came back a
uniform `(0,0,0,0)` with no residue in the RGB channels under a zero
alpha, real transparency with nothing hidden in it.

That second source was also a different art style from every other
predator in the game -- a photorealistic/3D-rendered illustration rather
than the flat cel-shaded cartoon look everything else uses. Flagged to
the user as a one-line heads-up, then used as-is once given the
go-ahead -- a style call for the user to make, not a defect worth
blocking on. It didn't last, though: the user swapped in a third source
shortly after, "a slightly less scary/realistic version" -- back to the
game's usual flat cel-shaded look, so this is the one actually kept.
Hit the fake-transparency trap again on this one (`im.mode == "RGB"`,
a two-tone checkerboard baked into opaque pixels), fixed the same way
as always (flood-fill from the border, matching both checker tones --
a strict near-neutral-grey test here specifically, since the fish's own
body has a subtle blue cast even at its lightest that a looser
threshold would risk catching).

`src/assets/dunkleosteus.png` is the processed derivative of that third
source: cropped to content, downscaled to 600px wide, and
palette-quantized (128 colors, Floyd-Steinberg dither) -- checked for
banding on the body's own spot pattern first; none, same flat
cel-shading reason as every other quantized predator. ~1.6MB down to
~31KB, smaller than the photorealistic version's ~53KB at the same
dimensions despite an identical pipeline, since flat cel-shaded art has
far fewer distinct colors for the palette to spend its budget on. The
bite point (roughly the midpoint between the two front fang tips) was
found the usual coordinate-grid-overlay way and anchored at the local
origin like every other raster predator's mouth.

Also per explicit request, Coral and Kelp are skipped for this level
(the Dunkleosteus reads better against open, uncluttered seabed at the
scale it's drawn -- same reasoning as the Bloop), via `predators.ts`'s
`skipsReefDecor` field (see "Reducing diff size on predator-level
reorders" below for that field's own history).

`PREDATOR_APPROACH.dunkleosteus` overshoots the shared default's usual
closest approach, the opposite tweak from the Amargasaurus's own entry
above: `ease(t) = t*1.1` (still the plain default `startX=350`) pushes
past 1 at t=1, so the shared `sharkX = startX -
approachProgress*(startX-150)` formula lands past its normal 150
endpoint -- 350 - 1.1*200 = 130 instead. (A first pass used `t*1.2`,
landing at 110 -- close enough to actually overlap the puffer, so
dialed back once seen at the true final-round position, not just a
mid-round snapshot.) A smaller `startX` alone wouldn't have done this:
that only moves round 1's own starting point, not round 5's endpoint,
which the shared formula always drives to exactly
`startX - 1*(startX-150) = 150` regardless of `startX` unless `ease`
itself is what pushes past 1 -- the same mechanism the Amargasaurus's
`t*0.75` uses to stop *short* of 150, just aimed the other direction.

Adding this level only needed two brand-new audio clips
(`defeat-the-dunkleosteus.mp3`/`victory-the-dunkleosteus.mp3`, via a
one-off `fetchTts()` call) rather than regenerating or renaming anything
else -- a direct benefit of "Reducing diff size on predator-level
reorders" below, which this level's own original insertion (before that
refactor existed) was actually one of the two examples motivating in
the first place.

Level 3's `SharkPrincess` (`src/components/predators/SharkPrincess.tsx`) is a
cheerful crowned whale shark, user-provided (not sourced/licensed the way the
Kraken assets were -- verify provenance before reusing it anywhere else).
`src/assets/shark-princess.png` is a processed derivative, not whatever file
was last provided -- check git history before assuming the current one is
the original. Two things this asset has swung between are worth knowing if
it changes again:
- A true hand-authored vector redraw (small, infinitely crisp, embedded
  `?raw` like the Kraken) doesn't reliably look like a provided reference
  image -- it's a fresh illustration in the same spirit, not a trace of it.
- A "vector" that's actually a per-pixel trace of a raster source (every
  pixel/run of pixels encoded as its own tiny filled path,
  `shape-rendering="crispEdges"`) looks identical to the source but is
  *worse* than a plain raster on every axis: bigger file (a 768x512 trace
  ran 1.4MB, next to ~330KB for the equivalent PNG), no real vector benefit
  (doesn't scale cleanly -- hard pixel edges, no antialiasing), and it's
  still not really vector art despite the `.svg` extension.

  If a provided "SVG" balloons past a few hundred KB, it's almost certainly
  one of these two raster-in-disguise cases (this one, or the earlier
  base64-PNG-in-an-`<image>` wrapper) -- open it and check before assuming
  it's cheap to embed like the Kraken's real vector art.

Current version (restored from the first raster attempt, see git history --
the pixel-traced-then-rerasterized one above lost a little gradient detail
in the round trip and isn't what's in the repo): background flood-filled to
transparent from the original's image border inward (safe there since the
art never touched the canvas edge -- a naive "make white pixels transparent"
would have also punched holes in the shark's own legitimate white
belly/spots), cropped to content, and downscaled to 700px wide (~320KB,
comfortably covers the scene's realistic on-screen size at up to 3x device
pixel ratio; `.scene__svg` renders at `width: 100%` of a 720px-max-width
container). Imported as a URL, not `?raw`, so Vite emits it as its own
cacheable file instead of inlining a base64 string into the JS bundle.

Sized 1.5x its original footprint in `SharkPrincess.tsx` (162 wide, up
from 108) -- she's a whale shark, the largest fish species alive, and the
original box was actually smaller than the plain Shark's 159, undersold
for what she's meant to be. No special-casing needed in `BattleScene.tsx`
for this, unlike the much-larger Mosasaurus -- verified
round-by-round via headless Chrome that the shared linear approach still
reads fine at this size, no early-contact or off-screen-runway issues to
work around.

The `Swordfish` is inserted right before the electric eels in play
order -- like the Dunkleosteus, it's a plain predator, not a boss fight:
no `BOSS_INTROS` entry, no intro card/music/voice line, and no
`PREDATOR_APPROACH` override either, just the shared default linear
approach. `src/assets/swordfish.png` is a processed derivative of a
cartoon stock illustration: verified real alpha (corners genuinely
`(0,0,0,0)`, no watermark hiding in the RGB channel under the
transparent region -- see the Dunkleosteus section above for what that
trap and its fix both look like when a source *doesn't* check out clean)
before cropping to content and downscaling to 320x146. Deliberately kept
shark-scale rather than the bigger 600px-wide source a boss-fight
predator gets -- this one is drawn at 159x73 in `Swordfish.tsx`, about
2x the source's own resolution, matching the plain `Shark`'s own
~159x72 footprint rather than Dunkleosteus/Bloop's larger, more
dramatic presence. No visible teeth, so its bill tip stands in for the
usual bite point, found the usual coordinate-grid-overlay way and
anchored at the local origin like every other raster predator's mouth.

Adding this level only needed two brand-new audio clips
(`defeat-the-swordfish.mp3`/`victory-the-swordfish.mp3`, via a one-off
`npm run audio:gen` run with the incidental re-fetch diff on every other
clip discarded) and no renumbering anywhere else -- see "Reducing diff
size on predator-level reorders" below for why.

The `Eel` (school of 3, see `getSchoolOffsets`) is a raster
illustration, user-provided (not sourced/licensed the way the
Kraken/PhyloPic assets were -- verify provenance before reusing it
elsewhere), replacing the old hand-drawn S-curve. Unlike the
Anglerfish/Mosasaurus/SharkPrincess PNGs before it, this source
(1774x887) had **real per-pixel alpha transparency already** -- confirmed
by checking `im.mode`/the alpha channel's actual extrema (0 and 255, not
a flat 255), not just the visible checkerboard -- so no flood-fill
rescue was needed. Cropped to its alpha bounding box (plus a small pad),
downscaled to 285px wide (~50KB), then palette-quantized to 128 colors
with dithering (same `Image.quantize(..., method=Image.FASTOCTREE,
dither=Image.FLOYDSTEINBERG)` call as the Anglerfish, alpha re-attached
after) for another ~25% off, down to ~38.5KB total from the original
~937KB. Checked for banding at 3x zoom on the glowing dorsal stripe and
body shading first; found none, same reason as the Anglerfish -- flat
cartoon cel-shading, not a smooth photographic gradient. Imported as a
URL, not `?raw`, so Vite emits it as its own cacheable file. Already
drawn nose-left; centering the image on the local origin (same
convention as every other raster predator) puts its head/mouth near the
shared left edge every other creature's nose lands on, without needing a
hand-picked offset.

The school size itself was tuned live (started at the original 6, tried
4 and 5 along the way) before settling on 3: with more instances spread
enough to stay individually readable, at least one ended up far enough
above/below the puffer's own height to read as less threatening than the
rest. `SCHOOL_OFFSETS[3]` in `predators/index.ts` was widened/shrunk
specifically for this (see its own comment there) rather than reusing
the generic count-3 formation the table used to have, which was tuned
for a different (smaller, tighter) look.

`Eel.tsx` also layers a second image, `electric-eel-glow.png`, on top of
the body art and pulses it (`.eel__glow` in index.css, a much quicker
0.9s cycle than the Anglerfish's leisurely lure -- meant to read as
current, not a lure) so the body's own "lightning" marks actually look
electric instead of static. That file is a derivative of the body art:
every pixel classified as one of its own yellow tones (`r>230, g>210,
b<200, r-b>40` against the *processed* `electric-eel.png`, so both this
and the next step have to be redone if the body art is ever
reprocessed) was kept at its original bright color with everything else
made transparent, then one connected component -- large and
circle-filled enough to be the eye's iris rather than a thin zigzag
stroke or a small dot -- was explicitly dropped so the eye doesn't pulse
along with the actual marks. Same size/position as the body image so it
lines up pixel-for-pixel without needing its own offset. Small enough
(~1.5KB) that Vite inlines it as a data URI rather than emitting a
separate file (the same &lt;4KB threshold every build tool defaults to).

`electric-eel.png` itself was then edited a second time: every one of
those same marked pixels had its color scaled way down (`r*0.3, g*0.25,
b*0.3`) to a dull, unlit amber-on-slate instead of full brightness.
Layering a pulsing bright overlay on top of marks that were already
fully lit underneath (the first version of this) barely registered --
the base art never got any dimmer than the glow's own dimmest point, so
the "pulse" was really just a faint bloom on top of an already-bright
line. Dimming the base first makes the two layers' opacity swing (0.15
to 1, wider than initially tried too) read as an actual on/off flicker.

The `Piranha` (school of 7, see `getSchoolOffsets`) is vendored real
vector art -- "piranha" by liakad on OpenClipart
(openclipart.org/detail/4631/piranha-by-liakad), public domain
(`src/assets/piranha.svg`'s own `<metadata>` carries the CC0-equivalent
license block; keep it if this file is ever re-saved by a tool that strips
metadata). Recolored by hand from its original teal palette to a grey body
with a red belly (a red-bellied piranha, *Pygocentrus nattereri*): the
original's gradient/fill hex values were swapped for grey equivalents at the
same luminance stops (preserves the existing rounded-body shading, just
desaturated), and a new belly-patch `<path>` + gradient (`#piranha-belly`)
was added, hand-traced from the body outline's own bottom-edge bezier
segments (see `path10475` in the source) so it actually follows the body's
silhouette rather than being an approximate blob, then closed with a
freehand return curve back up into the body interior and filled
red-fading-to-transparent so it blends into the grey above it rather than
having a hard seam.

The `Anglerfish` (`src/components/predators/Anglerfish.tsx`) is a
raster illustration, user-provided (not sourced/licensed the way the
Kraken/PhyloPic assets were -- verify provenance before reusing it
elsewhere), replacing the old hand-drawn version. `src/assets/anglerfish.png`
is a processed derivative, not the original file -- the source (1536x1024,
~1.75MB) had **no real alpha transparency** despite looking like it did,
same trap as the Mosasaurus/SharkPrincess PNGs before it: plain `RGB` mode
with no alpha channel at all, the checkerboard baked into opaque
near-white pixels (confirmed by checking `im.mode` and the alpha channel,
not by eyeballing the preview). Background flood-filled to transparent
from the image border inward (matching near-neutral-grey/white pixels,
same technique as those two), cropped to content, downscaled to 220px
wide, and additionally palette-quantized to 128 colors with dithering
(`Image.quantize(..., method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG)`)
before re-attaching the alpha channel -- a technique not used for the
earlier PNGs, tried here because "as game-optimized as you can" was an
explicit ask. Checked for visible banding at 3x zoom on the smoothest
gradient areas (the body shading) before trusting it; found none, likely
because the source's own shading is already flat/cartoon-style with few
distinct gradient stops, not a smooth photographic gradient that
quantization would visibly band on. Result: 1.75MB &rarr; ~34.6KB (about
98% smaller), smaller than the Mosasaurus's 51KB despite more visual
detail. Imported as a URL, not `?raw`, so Vite emits it as its own
cacheable file.

This level is also the one deliberately dark one: an anglerfish's whole
gimmick is ambushing prey with a bioluminescent lure in lightless deep
water, which the shared sunlit `#sea` gradient and reef scenery every other
level uses undercuts. `BattleScene.tsx`'s `isMurky` flag (true only when
`predator.kind === "anglerfish"`) swaps in a much darker `#seaMurky`
gradient, dims the sand/`Rocks` as one group (so no single piece keeps
popping against the murk), and skips `Coral`/`Kelp` outright rather than
just dimming them -- both are photosynthetic and wouldn't grow this deep.
The Puffer and the Anglerfish's own body (`.scene__puffer-bob` and the new
`.anglerfish__body` class on its `<image>`) are dimmed to near-silhouettes
via `filter: brightness(0.32)`, scoped to `.scene--anglerfish` so no other
level is affected. The lure itself is exempted from all of this and drawn
at full brightness -- a small hand-drawn glow (a blurred halo circle plus a
brighter core, pulsing via `.anglerfish__lure-glow`'s `lureGlow` keyframe)
layered on top of the flat PNG, which isn't lit in the source art. Its
position (`LURE_X`/`LURE_Y` in `Anglerfish.tsx`) was found the same way as
Megalodon's nose/gills: flood-fill the source PNG for its brightest yellow
pixels (there are several -- the esca bulb, the dorsal spines' smaller
tips, and the eye's pale cream -- so the bulb's own cluster had to be
picked out specifically) and take that cluster's bounding-box center, then
convert through the `<image>`'s own `preserveAspectRatio="xMidYMid meet"`
scale/centering math to land in the component's local coordinate space.
End effect: everything in the scene fades into the dark except one glowing
point, which is the point.

Level 1/2's `Shark` (reused unmodified for level 2's two-shark school) is
also vendored real vector art -- recolored to
a great white: swapped its original two teal shades for grey (back/fins)
and near-white (belly), same "swap the hex values" approach as the
Piranha. Its black outline wasn't a plain `stroke` to just dial down --
the source is a single filled black path (an "outline stroke" already
converted to a filled shape, likely by whatever tool exported it), so
there's no `stroke-width` to edit. Thinned instead with an SVG
`<feMorphology operator="erode">` filter baked into `shark.svg` itself
(`radius="2"`) applied to that path. Trade-off worth knowing: eroding a
uniformly-filled outline shrinks thin details (the gill-slit lines, the
lateral line) much more aggressively than the thick outer border, since
erosion removes the same absolute width from every edge regardless of the
shape's local thickness -- a bigger radius reads as a "cleaner" thinner
outer border but starts eating the thin lines down to a ragged, gap-y
sliver (visible at full native resolution, but not at the tiny size this
actually renders at in-game -- check any radius change at gameplay scale,
not just the source file). Provenance/license not verified for this one
(user-provided, like SharkPrincess) -- check before reusing elsewhere.

Both `Piranha` and `Shark` render `count` times at once (schools of 7 and
2 respectively, see `getSchoolOffsets`) -- the same vendored markup, ids
and all, gets injected into the DOM several times simultaneously via
`dangerouslySetInnerHTML`. Unlike Kraken/SharkPrincess (always rendered
once), a static id prefix baked into the file (like the Kraken's
`kraken-`) doesn't help there, since every instance would still carry the
*same* prefix. Both instead go through `useScopedSvg()`
(`src/components/scopeIds.ts`, shared rather than duplicated) which
rewrites every `id="..."` (and matching `url(#...)`/`xlink:href="#..."`)
to a per-instance-unique suffix at render time (`useId()` + a small regex
pass, memoized), so no two instances on screen ever share a gradient/
filter id. Any future vendored asset that can render more than once at a
time needs the same treatment -- a static prefix alone only solves
collisions *between* different creatures, not against copies of itself.
That said, `scopeIds()`'s pattern-matching only covers the double-quoted
`id="..."`, `url(#...)` and `(xlink:)href="#..."` forms an Inkscape/
Illustrator export actually uses -- it won't catch single-quoted
attributes, an id referenced from a `<style>` block, or a SMIL
`begin="other.click"`-style reference. Fine for piranha.svg/shark.svg/
kraken.svg as they stand; check for those before reusing it on a
differently-authored source file.

The `GrandpaShark` is inserted right before the Mosasaurus in play
order -- like the Swordfish/FootballShark, it's a plain predator, not a
boss fight: no `BOSS_INTROS` entry, no `PREDATOR_APPROACH` override,
just the shared default linear approach. A cartoon shark cast as a
grandpa (flat cap, glasses, white eyebrows/mustache), reading an
"OCEAN TIMES" newspaper that covers most of its mouth, user-provided.
`src/assets/grandpa-shark.png` is a processed derivative: the source
had no alpha channel at all (`im.mode == "RGB"`), the same flat
two-tone grey checkerboard trap as the football shark's own source,
fixed the same way (flood-fill from the border, matching both
near-neutral-grey checker tones -- the glasses' light-blue lenses and
the newspaper's cream tone are both far enough from neutral grey to
survive untouched). Cropped to content, downscaled to 320x187 (shark-
scale, 159x93 in `GrandpaShark.tsx`), then palette-quantized (64
colors, Floyd-Steinberg dither) -- checked for banding on the body's
own gradient and legibility on the newspaper's headline text first,
both held up clean. ~2MB down to ~9.8KB, the smallest predator source
yet, since 64 colors was enough for this art's flat cel-shading with no
visible loss.

Unlike every other toothed predator, its mouth is mostly hidden behind
the newspaper -- no clean pair of front fang tips to anchor the bite
point on. Anchored at the leftmost point of the whole composition
instead (the newspaper's own top-left corner), same technique as the
Swordfish's bill tip when the mouth itself isn't the visual "front" of
a predator.

The `SeaSerpent` is inserted right before the Mosasaurus in play order
-- like the Swordfish/FootballShark/GrandpaShark, it's a plain
predator, not a boss fight: no `BOSS_INTROS` entry, no
`PREDATOR_APPROACH` override, just the shared default linear approach.
A painterly (not flat cel-shaded, unlike most predators here) dragon-
like sea serpent, teal scales with orange spine frills, roaring with a
long tongue and bared fangs, user-provided.

`src/assets/sea-serpent.png` is a processed derivative: the source had
no alpha channel at all (`im.mode == "RGB"`), the same checkerboard
trap as several predators before it, fixed the usual way (flood-fill
from the border, matching both near-neutral-grey checker tones -- a
looser range than usual, `195 <= max(r,g,b) <= 255`, since this
source's checkerboard ran much lighter than the others'). One extra
cleanup pass beyond the usual flood-fill: a few dozen isolated 2-3px
dust specks in the background were never connected to the border
(off-tone enough to break the flood-fill's path through them), left
over as stray opaque dots after the main fill. Found and dropped by
taking every remaining opaque connected component and keeping only the
largest (the serpent itself) -- everything else was noise, not real
art content. Also checked (contrast-boosted, same technique as the
Dunkleosteus section above) for a watermark hiding in the transparent
region; none found.

Cropped to content, downscaled to 360x169, then palette-quantized --
128 colors here instead of the 64 several flatter-shaded predators
(Swordfish, FootballShark, GrandpaShark) use, since this art's
painterly gradient shading showed early banding at lower counts where
their flat cel-shading didn't. ~2.2MB down to ~18KB. The bite point
(roughly the midpoint between the two front fang tips, same convention
as every other toothed predator) was found the usual coordinate-grid-
overlay way and anchored at the local origin.

The `Mosasaurus` is a raster illustration, user-provided (not
sourced/licensed the way the Kraken/PhyloPic assets were -- verify
provenance before reusing it elsewhere). Went through two other approaches
first (a hand-authored vector redraw, then a recolored PhyloPic silhouette
-- see git history) before landing here on "just use the PNG the user
actually likes the look of." `src/assets/mosasaurus.png` is a processed
derivative of that PNG, not the original file itself: the source had **no
real alpha transparency** despite looking like it had a transparent
checkerboard background -- every pixel's alpha was 255, and the
"checkerboard" was literally baked into the pixels as opaque light-grey/
white squares (confirmed by checking the alpha channel's histogram, not by
eyeballing the preview). Background flood-filled to transparent from the
image border inward, matching *either* of the checkerboard's two
near-white/grey tones (safe here since the art's own outline never touches
the canvas edge, and its own light colors -- belly, teeth -- are clearly
blue/cream-tinted rather than neutral grey, so they don't get caught by a
strict near-grey color test even before connectivity is considered), then
cropped to content and downscaled to 300px wide (~51KB) -- deliberately
small since file size was the priority for this one, at some cost to
crispness on very large/high-DPI displays. Imported as a URL like
SharkPrincess.tsx, not `?raw`, so Vite emits it as its own cacheable file.

Deliberately drawn much bigger in `Mosasaurus.tsx` than every other
predator (width 200 vs. Shark's 159) -- it's meant to look imposing. That
size, plus starting much farther off-screen (`startX` 460 vs. everyone
else's 350 in `BattleScene.tsx`) for a longer runway, means a plain linear
approach (what every other predator uses) makes each round-to-round step a
big, fast jump: the same handful of progress fractions now span a much
larger pixel range. Two earlier fixes were tried and abandoned before
landing on the current one (see git history): shrinking the sprite down to
a normal-sized footprint (worked, but the user preferred it big), and a
7-point hand-tuned checkpoint table (worked, but its uneven segment slopes
made consecutive steps move at wildly different effective speeds, which
read as janky on mobile). The current fix is a single continuous easing
formula -- `0.2 * t + 0.8 * t ** 3` (`PREDATOR_APPROACH.mosasaurus.ease` in
`BattleScene.tsx`) -- applied only to the Mosasaurus's progress before the
shared linear `sharkX` math: no seams between differently-sloped segments
for steps to look inconsistent across, just one smooth curve that keeps
every round's step small and reserves most of the closing distance for the
very last one (round 5's reveal), which then reads as a dramatic final
lunge rather than a steady creep. The pure cube this started as
(`t ** 3`) has a slope of exactly zero at t=0, which made round 1's move a
couple of imperceptible pixels; blending in 20% linear gives it a nonzero
slope at the start so that first move actually reads as movement, without
the cube's dominance over the rest of the curve. Tuned/verified by actually
playing through 5 rounds (clicking real cards, not the `?debug=1`
outcome-jump buttons) and screenshotting every `playing` *and* `reveal`
phase -- the debug buttons skip the `reveal` phase entirely, which turned
out to hide a real jump (sharkProgress advances by a full 1/5th of the way
there, not the smaller step within-round answering causes) that earlier
verification passes never accounted for.

Its `<image>` x offset centers it on the local origin (`-width/2`), same
convention as Shark/Piranha/SharkPrincess -- each one's art is cropped
tight to its own content, so centering the box lines up roughly the right
amount of open jaw with the shared final-contact position (`sharkX=150`)
for a believable bite. An earlier revision had this off-center by 30
units (`x={-130}` for a 200-wide box, instead of `-100`), which put the
puffer under the Mosasaurus's mid-body/flippers at that position instead
of near its mouth -- caught by `/code-review` actually rendering the final
frame and comparing bounding boxes against the Shark's, not by inspecting
the numbers alone.

`Puffer` (the protagonist, not a `predators/` entry -- always rendered via
`BattleScene`'s own `<Puffer />`, not the `PREDATOR_COMPONENTS` map) was
originally the one hand-drawn creature left (a ring of 12 `<line>` spikes
around two circles); it's now `src/assets/pufferfish.svg`, vendored real
vector art from SVG Repo (the file's own header comment says so, but SVG
Repo blocks automated fetches with a bot-detection checkpoint like the
kraken-icon -- downloaded by hand, exact page/license not independently
verified, check before reusing elsewhere). A flat cartoon "polka-dot"
style rather than the old spiky silhouette; already drawn facing right
(toward the predator) in its native orientation, no mirroring needed.

Its source `<svg>` root carried `height="800px" width="800px"` alongside
its `viewBox="0 0 512.001 512.001"` -- the same class of bug as the
Mosasaurus PhyloPic silhouette's pt-unit clipping (see above), just with
`px` instead of `pt`: nested inside the wrapper via
`dangerouslySetInnerHTML`, those absolute pixel dimensions scale
independently of the outer wrapper's own viewBox, rendering content
~1.56x oversized and silently clipped by the nested `<svg>`'s default
`overflow: hidden`. This had already bitten twice by hand-deleting the
attributes from the vendored file itself (Mosasaurus, then this one), with
nothing but a comment telling the next person to remember to check --
`src/components/vendoredSvg.ts`'s `stripRootSvgDimensions()` now does this
automatically at import time instead, applied to every real vendored SVG
with a root `<svg>` tag (`Puffer`, `Shark`, `Piranha` -- not `Kraken`/
`KrakenIntro`'s icon, whose source files are markup *fragments* with no
root `<svg>` tag at all, so they're structurally immune). Safe to apply
unconditionally even where it's a no-op (Shark.svg's `width`/`height`
already equal its own `viewBox` numbers in the same unitless units, so
removing them changes nothing) -- do this for any new vendored SVG too,
rather than hand-checking whether it needs it first.

`Puffer.tsx` also adds a white eye glint and replaces the source's own
neutral/frown mouth with a smile, string-appended into its own markup
(right before its closing `</svg>`, so the new shapes share its
`0 0 512.001 512.001` viewBox directly) rather than edited into the
source file or drawn as a separate positioned overlay. The source's
outline -- pupil and mouth included -- is one giant compound path (three
subpaths total for the whole file: the main silhouette, one small detail
near a fin, and everything else -- pupil, mouth, gill lines -- fused into
a single ~4800-character path via connecting bridges, not cleanly
separable sub-shapes), so there's no "mouth path" to delete or redraw in
place; instead an opaque ellipse in the source's own flat local fill
color (`#FFD77D`, confirmed solid -- not part of a gradient -- by
sampling a rendered preview, so a flat patch leaves no visible seam)
covers the original mouth first, then the smile draws on top of that
patch. (A first attempt drew the smile *next to* the original mouth
instead of replacing it, which read as a mustache-and-mouth combo, not a
smile -- covering the original first and drawing on top is what actually
gets a replacement rather than an addition.)

Coordinates for all of this were found by rendering the source with a
temporary labeled coordinate grid overlaid (10-unit spacing, drawn the
same string-append way) and reading the pupil/mouth positions directly
off of it, at a large (~550px) rendered size -- not the tiny in-game
size, and not by pixel-measuring a plain screenshot and converting back
to viewBox units, which turned out unreliable twice over (a polka dot
sat close enough to the true pupil to be mistaken for it, and the mouth
patch sized from that same estimate missed the actual mouth shape
entirely on the first attempt). The coordinate grid technique is the one
worth reusing for any future tweak here -- render with grid lines and
read the numbers, don't estimate from an unlabeled screenshot.

`BattleScene`'s seabed `<path>` and the `Rocks` component next to it
(`src/components/Rocks.tsx`, same absolute-scene-coordinates technique as
`ShipWreck`) are the one piece of scenery that isn't per-predator --
sand-colored rather than the original dark green, present at every level.
`Rocks` went through two versions (see git history): a hand-drawn pair of
flat-color ellipses (dropped after a highlight shape that touched the
silhouette's own edge read as a separate cap sitting on top, a hard seam,
not a soft sheen -- worth remembering if scenery ever goes back to
hand-drawn shapes), then the current one, vendored real vector art (a
detailed shaded boulder, "🪨" Rock from the Noto Emoji set via SVG Repo,
same bot-detection-checkpoint provenance caveat as the Puffer/kraken-icon)
rendered twice at different sizes side by side. Its root `<svg>` also
carried the same `width`/`height`-vs-`viewBox` mismatch Puffer's did,
handled the same way via `stripRootSvgDimensions()`; since it renders more
than once at a time, its gradient ids also need `useScopedSvg()` like
Piranha/Shark's schools -- called twice here (once per rock instance)
rather than once, since each call consumes its own `useId()` slot and so
already returns two independently-suffixed results.

Both rocks are kept on the left half (under/around the Puffer) so they
never compete for space with the Kraken's `ShipWreck`, which occupies
roughly x=250-390 on the right. Sized to sit tall and prominent on the
sand rather than shrunk down -- the big rock's top edge (y=148) is well
within the Puffer's own reach at high score (`pufferScale(score)` maxes
out at 2.2 at score 5, and `Puffer.tsx`'s local box extends to y=+18, so
at `PUFFER_Y=116` its bottom edge can reach 116+18*2.2=155.6, plus the
idle `bob` keyframe's +3px, for 158.6), so it's kept clear *horizontally*
instead: pinned to the left edge (x=0-52), safely left of the Puffer's own
widest reach at that same high score (56.4-135.6). Shrinking/lowering the
rocks to dodge the Puffer vertically was tried first and technically
worked, but looked worse -- small and half-buried instead of resting on
top of the sand. The small rock, further right and lower, doesn't need to
dodge anything -- its y-range (166-200) is already below the Puffer's max
reach, so it can't overlap regardless of x. (The overlap itself was caught
by `/code-review` actually rendering the victory screen at max score, not
by inspecting the numbers -- worth re-checking with the same technique if
these ever move again.)

`Coral` (`src/components/Coral.tsx`) and `Kelp` (`src/components/Kelp.tsx`)
round out the same seabed cluster, both also always rendered (not
per-predator). `Coral` is vendored real vector art from SVG Repo, same
bot-detection-checkpoint provenance caveat as the Puffer/Rock/kraken-icon;
its source id was the same generic `Layer_1` the Puffer and Shark SVGs
also happen to use (an SVG Repo "Mixer Tools" default, apparently) --
harmless in practice since none of the three ever reference their own id
via `url(...)`, but renamed to `coral-layer` by hand anyway rather than
adding a third literal duplicate id to the DOM. `Kelp` is vendored real
vector art too, but from OpenClipart (`kelpforest.svg`, public domain per
its own `<cc:license>` metadata block -- an actually-verifiable license,
unlike the SVG Repo assets). Both run through `stripRootSvgDimensions()`
regardless of whether it's a no-op for that particular source, the same
"don't hand-check, just always apply it" reasoning as Shark/Piranha --
Coral's actually needs it (the same `width`/`height`-vs-`viewBox`
mismatch as Puffer's, just as `height="..." width="..."`, the opposite
attribute order, which the shared helper doesn't care about), Kelp's
doesn't (no `width`/`height` on its root tag at all).

Positioned like a continuous cluster reading left to right -- Rocks, then
Coral, then Kelp -- rather than scattered independently, so it reads as
one seabed garden. Both Coral and Kelp are kept past the Puffer's own
widest reach at high score horizontally (see Rocks.tsx for that reach's
math), same as the big Rock -- an earlier version tucked Coral in low
next to the small Rock instead (dodging the Puffer vertically, the same
trick the small Rock uses), but unlike that rock, Coral's own artwork
fills almost all the way to its box's bottom edge with no empty margin to
spare, so sitting it low enough to duck under the Puffer's reach buried
most of it in the sand -- looked sunk/cut off by the frame rather than
resting on top of it. Both are positioned relative to the seabed
`<path>`'s own curve at their respective x position, using the curve's own
quadratic-bezier parameterization (it simplifies to a linear `x(t)`, since
each segment's control point sits at the exact horizontal midpoint of its
endpoints) rather than eyeballing it -- worth redoing that math, not
guessing, if either ever moves again. First tuned to land exactly *on*
that curve, which read as too precise/flat once actually seen -- like the
Rocks (sunk in well past their own local sand line, not merely touching
it), Coral and Kelp are each sunk a bit further in past the curve too,
and *not* by the same amount as each other, for a bit of natural
variation rather than a uniform planting depth. The two needed different
handling to get there despite the same underlying technique: Kelp's own
artwork has a fair amount of empty viewBox space below its drawn shadow
(unlike Coral's or the Rocks', which each fill almost their entire box),
so it's its *shadow*, not its box's bottom edge, that actually needs to
sit past the curve -- worked out by rendering the scene with the seabed
curve's own y=160/180/200 values drawn in as temporary reference
gridlines (`Runtime.evaluate` appending `<line>` elements directly into
the live `.scene__svg`) and reading off the pixel gap, rather than
assuming the box-bottom math that works for the other, tightly-cropped
assets also holds here.

## Reducing diff size on predator-level reorders

Every level insertion/reorder in this file's own history above (Bloop,
Amargasaurus, Dunkleosteus all did this at least once) touched way more
than the actual change warranted -- tracked as GitHub issue #25, fixed
in four independent parts:

1. **`PredatorLevel.level` is derived, not stored.** `predators.ts`'s
   array literal is now `PREDATOR_LEVEL_ENTRIES` (an array of
   `Omit<PredatorLevel, "level">`, no `level` field written anywhere on
   an entry), and the exported `PREDATOR_LEVELS` is that array `.map()`'d
   to attach `level: i + 1`. Inserting/reordering a level is now just
   moving its object in the array -- nothing else needs renumbering, and
   the diff for an insertion is exactly the one new entry.
2. **Comments don't hardcode a level number just for flavor.** Every
   spot that used to say "Kraken (level 12)" or similar (`KrakenIntro`,
   `ShipWreck`, `BloopIntro`, `AmargasaurusIntro`, `MegalodonIntro`,
   `SharkPrincess`, `Shark`, `App.tsx`'s `BOSS_INTROS` summary,
   `predators/index.ts`) either dropped the number entirely (naming the
   creature is enough) or pointed at `predators.ts`/`PREDATOR_LEVELS`
   instead of restating a number that's guaranteed to go stale on the
   next reorder.
3. **Audio clips are keyed by the predator's own label, not its level.**
   `outcomeAudioCue()` in `outcome.ts` used to build
   `defeat-<level>.mp3`/`victory-<level>.mp3` straight from the numeric
   level -- meaning every level whose *position* shifted needed its
   clips regenerated via one-off `fetchTts()` calls, even though the
   spoken text never actually changed. It now takes the predator's
   `label` and slugifies it (`src/shared/textUtils.mjs`'s new
   `slugify()`, also used by `generate-audio.mjs`) into
   `defeat-<slug>.mp3`/`victory-<slug>.mp3` instead -- e.g.
   `defeat-the-shark-princess-and-her-two-brothers.mp3`. `useGame.ts`'s
   internal ref that used to hold a numeric `level` (set from
   `App.tsx`'s `nextPredator.level`/`DebugPanel`'s `predatorLevel` prop)
   now holds that same `label` string instead. The 24 already-committed
   clips were `git mv`'d to their new names in one pass (a rename, not a
   TTS regeneration -- the actual audio content never changed). A label
   is a safe unique key here specifically because labels already have to
   be unique (they're spoken text; a duplicate would be its own bug) --
   `kind` alone isn't safe, since two levels can share a kind at
   different counts (the solo Shark and the two-shark school; the solo
   Shark Princess and her three-creature escort).
4. **Tests derive their expected counts instead of hardcoding them.**
   `predators.test.ts`'s "only these levels have more than one instance"
   check now names the *labels* that are schools, not the level numbers
   they currently sit at; its level-numbering/cycle-length checks now
   derive every expected number from `PREDATOR_LEVELS.length` instead of
   a literal. `App.test.tsx`'s boss-intro tests use a new
   `playthroughsBefore(kind)` helper (`PREDATOR_LEVELS.findIndex`) in
   place of a hardcoded `for (let i = 0; i < N; i++)` per boss.

Net effect: a future level insertion should touch exactly one file
(`predators.ts`, adding one entry) for the level-numbering/audio-naming
concerns this section is about -- everywhere else keys off `kind` or
`label`, neither of which shifts when a level moves.

## Conventions

- **Scripts stay dependency-free.** `scripts/generate-audio.mjs` and
  `scripts/screenshot.mjs` use only Node built-ins (`fetch`, `WebSocket`,
  `child_process`) plus plain-JS files under `src/shared/` (no build step
  needed to run either directly with `node`). Don't add npm deps for tooling.
- **Audio.** Clips are committed so the app runs offline. Regenerate with
  `npm run audio:gen` after editing `src/data/words.ts` (the script parses the
  quoted string literals). The Google TTS endpoint returns slightly different
  bytes every fetch, so a full regen shows every clip as modified &mdash; commit
  only the clips you actually meant to add or remove, `git restore` the rest.
  PyPI is unreachable in this environment; that's why audio is a Node script
  hitting Google Translate TTS rather than Python/gTTS.
- **SVG animation.** Put `transform-box: fill-box; transform-origin: center` on
  any group that CSS scales or rotates, or it pivots about the viewBox origin
  and flies off screen. Keyframe `transform` on an element also overrides its
  positioning `transform` attribute &mdash; nest a positioned outer `<g>` around
  an animated inner `<g>`.
- **Tests** are pure logic tests (`rounds`/`outcome`/`predators`/`wordSelection`)
  plus interaction tests over `<App>` with Testing Library + fake timers --
  not pure render smoke tests. Reach for a full playthrough (`fireEvent`
  through real rounds via `answerAllRounds`/`playThroughOneGame` in
  `App.test.tsx`) when the thing being verified is state-machine/timing
  behavior across real user interactions (predator escalation, the Kraken
  intro's timer/re-entrancy guard) -- there's no shortcut to that state
  other than actually playing it; `?debug=1`'s `debugOutcome` bypasses
  `handleStart`/`beginGame` entirely, so it tests something else, not a
  lighter version of the same thing. Keep it to a single light render check
  otherwise. Either way: no real browser, no real timers (`vi.useFakeTimers`),
  stay fast. `npm run screenshot` is a manual "does it look right" check,
  never CI.
- Short single-letter / `a`-initial sight words tend to be mispronounced by the
  TTS voice; check a new word actually sounds right before adding it.

## Git conventions

PRs are merged with a merge commit (`gh pr merge --merge`), not squash or
rebase &mdash; preserves the individual commit history from the PR branch.
After merging, delete the branch both locally and remotely
(`gh pr merge --merge --delete-branch` does both in one step).

When addressing review comments on an open PR, break the fixes up into
separate commits along logical lines (one commit per distinct issue/fix,
not one commit for everything) rather than a single catch-all commit, and
reply to each review comment on GitHub referencing the specific commit
hash that addressed it, formatted as a hyperlink to the commit rather than
just backticked text (e.g. "Fixed in
[abc1234](https://github.com/rchacon/puffer-app/commit/abc1234).") -- keeps
the review thread traceable to the exact change that resolved it, one
click away, rather than a generic "addressed" reply pointing at the whole
PR.

When *submitting* a code review on a PR, post each finding as its own
separate inline review comment (anchored to the specific file/line via
`gh api repos/{owner}/{repo}/pulls/{number}/comments`, not a single bundled
`gh pr comment`) -- a combined comment listing every finding only supports
one flat reply thread, making it impossible to reply to (or resolve)
individual findings separately later.
