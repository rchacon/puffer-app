import { useEffect, useRef, useState } from "react";
import { useGame } from "./game/useGame";
import { TOTAL_ROUNDS } from "./game/outcome";
import { getPredatorLevel, PREDATOR_LEVELS } from "./game/predators";
import { slugify } from "./shared/textUtils.mjs";
import { WORDS } from "./data/words";
import { loadSelection, saveSelection } from "./data/wordSelection";
import { loadMode, saveMode, type Mode } from "./data/modeSelection";
import { playCue, playUrl, preloadMusic } from "./audio/player";
import bossMusic from "./assets/ebunny-ocean.mp3";
import nonBossMusic from "./assets/skidnney-arcade-game-bgm.mp3";
import { useBackgroundMusic } from "./audio/useBackgroundMusic";
import { loadMuted, saveMuted } from "./data/muteSelection";
import { MuteButton } from "./components/MuteButton";
import { StartScreen } from "./components/StartScreen";
import { BattleScene } from "./components/BattleScene";
import { PromptBar } from "./components/PromptBar";
import { CardRow } from "./components/CardRow";
import { SpellInput } from "./components/SpellInput";
import { ResultScreen } from "./components/ResultScreen";
import { DebugPanel } from "./components/DebugPanel";
import { BOSS_INTROS, type BossIntro } from "./bossIntros";

// Dev-server only: import.meta.env.DEV is replaced with a literal `false`
// in `npm run build`, so production (Amplify) can't enable this from the
// URL and the debug code is dropped from the bundle.
const DEBUG =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debug");

// `?debug=1&level=<slug>` starts the session at that level instead of the
// first, e.g. `level=the-grandpa-shark-and-the-football-shark` -- the same
// slugified label the defeat/victory clips are named by, so it survives a
// level reorder. The param is slugified too, so case and spaces don't
// matter (`level=The Megalodon` works). An unknown level falls back to the
// first.
function debugStartPlayCount(): number {
  if (!DEBUG) return 0;
  const param = new URLSearchParams(window.location.search).get("level");
  if (!param) return 0;
  const slug = slugify(param);
  return Math.max(0, PREDATOR_LEVELS.findIndex((p) => slugify(p.label) === slug));
}

export default function App() {
  const game = useGame();
  const { state } = game;
  const round = state.rounds[state.roundIndex];

  const [selectedWords, setSelectedWords] = useState(() => loadSelection(WORDS));
  const updateSelectedWords = (next: string[]) => {
    setSelectedWords(next);
    saveSelection(next);
  };

  // Persisted per-player preference (like word selection), not session-only
  // like predator escalation -- how someone wants to play, not part of any
  // one game's own escalating difficulty.
  const [mode, setMode] = useState<Mode>(() => loadMode());
  const updateMode = (next: Mode) => {
    setMode(next);
    saveMode(next);
  };

  // Session-only: escalates the antagonist each time a game is actually
  // started (including the very first), then cycles back after the Kraken.
  // Not persisted -- reloading the page resets it, unlike the word selection.
  const [playCount, setPlayCount] = useState(debugStartPlayCount);
  const predator = getPredatorLevel(playCount || 1);
  const nextPredator = getPredatorLevel(playCount + 1);

  // Looping background track for every level's rounds -- the shared boss
  // track for levels flagged `isBossFight` in predators.ts, or the shared
  // non-boss track for everything else. One useBackgroundMusic call handles
  // both: which url it's given switches with the level, not `active` itself,
  // so a plain predator's rounds get music too, just a different track.
  // Starts only once the round actually begins -- after a boss intro's own
  // sting has finished, immediately for a plain predator -- and stops on
  // the result screen. The mute choice is a persisted per-player
  // preference, like mode.
  const [muted, setMuted] = useState(() => loadMuted());
  const toggleMuted = () => {
    setMuted(!muted);
    saveMuted(!muted);
  };
  const inRound = state.phase === "playing" || state.phase === "reveal";
  const musicUrl = predator.isBossFight ? bossMusic : nonBossMusic;
  useBackgroundMusic(musicUrl, 0.35, inRound, muted);

  // Warm the network fetch for background tracks ahead of time -- on mount/
  // as soon as known, not when a round actually starts -- so
  // useBackgroundMusic's own startMusic() call finds whichever one it
  // needs already loaded instead of beginning a cold fetch right when
  // playback is wanted. The non-boss track preloads unconditionally on
  // mount, since every session's very first level is always a plain
  // predator; the boss track only once nextPredator actually is one
  // (not unconditionally on every mount) -- a player who never reaches a
  // boss level shouldn't pay for its ~5.4MB. nextPredator is already known
  // for a whole game's length before that level itself ever starts (it's
  // derived from playCount, which only changes in beginGame() -- see
  // above), so this still has plenty of lead time once it does trigger.
  useEffect(() => {
    preloadMusic(nonBossMusic);
  }, []);
  useEffect(() => {
    if (nextPredator.isBossFight) preloadMusic(bossMusic);
  }, [nextPredator.isBossFight]);

  // The currently-showing boss intro, if any -- see bossIntros.ts.
  const [activeBossIntro, setActiveBossIntro] = useState<BossIntro | null>(null);
  const introTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(introTimer.current), []);

  const beginGame = () => {
    setPlayCount((c) => c + 1);
    game.start(selectedWords, nextPredator.label);
  };

  const handleStart = () => {
    // Guards against a second activation landing while a boss intro is
    // still showing -- the Start button stays mounted underneath it for
    // the whole multi-second duration, and a focused button can still
    // receive a keyboard activation regardless of the overlay's z-index.
    // Without this, the stray call would overwrite introTimer.current
    // (leaking the first timer) and eventually double-fire beginGame():
    // playCount incremented twice for one logical start, the just-begun
    // round reset back to 0, and both the voice line and music restarting
    // on top of themselves. Disabling the button (see StartScreen's
    // `disabled` prop) covers the common case; this is the actual guard.
    if (activeBossIntro) return;
    const bossIntro = nextPredator.isBossFight ? BOSS_INTROS[nextPredator.kind] : undefined;
    if (bossIntro) {
      setActiveBossIntro(bossIntro);
      if (bossIntro.voiceCue) void playCue(bossIntro.voiceCue);
      if (bossIntro.music) void playUrl(bossIntro.music.url, bossIntro.music.volume);
      introTimer.current = setTimeout(() => {
        setActiveBossIntro(null);
        beginGame();
      }, bossIntro.durationMs);
    } else {
      beginGame();
    }
  };

  return (
    <div className="app">
      <h1 className="app__title">Puffer Power</h1>
      <MuteButton muted={muted} onToggle={toggleMuted} />

      {state.phase === "start" ? (
        <StartScreen
          onStart={handleStart}
          allWords={WORDS}
          selected={selectedWords}
          onSelectedChange={updateSelectedWords}
          mode={mode}
          onModeChange={updateMode}
          disabled={activeBossIntro !== null}
        />
      ) : (
        <>
          <BattleScene
            sharkProgress={game.sharkProgress}
            pufferScale={game.pufferScale}
            outcome={game.outcome}
            predator={predator}
          />

          {state.phase === "result" && game.outcome ? (
            <ResultScreen
              score={state.score}
              total={TOTAL_ROUNDS}
              outcome={game.outcome}
              predatorLabel={predator.label}
              nextPredatorLabel={nextPredator.label}
              onRestart={game.restart}
            />
          ) : (
            <>
              <PromptBar
                round={state.roundIndex + 1}
                total={TOTAL_ROUNDS}
                onReplay={game.replay}
              />
              {mode === "easy" ? (
                <CardRow
                  options={round.options}
                  phase={state.phase}
                  pickedIndex={state.pickedIndex}
                  correctIndex={round.correctIndex}
                  onPick={game.answer}
                />
              ) : (
                <SpellInput
                  key={state.roundIndex}
                  target={round.target}
                  phase={state.phase}
                  onSubmit={game.answerTyped}
                />
              )}
            </>
          )}
        </>
      )}

      {activeBossIntro && <activeBossIntro.Component />}
      {DEBUG && <DebugPanel game={game} predatorLabel={predator.label} />}
    </div>
  );
}
