import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useGame } from "./game/useGame";
import { TOTAL_ROUNDS } from "./game/outcome";
import { getPredatorLevel } from "./game/predators";
import type { PredatorKind } from "./game/predators";
import { WORDS } from "./data/words";
import { loadSelection, saveSelection } from "./data/wordSelection";
import { loadMode, saveMode, type Mode } from "./data/modeSelection";
import { playCue, playUrl, preloadMusic } from "./audio/player";
import krakenMusic from "./assets/kraken-music.wav";
import megalodonMusic from "./assets/megalodon-music.wav";
import bloopSound from "./assets/bloop-sound.wav";
import amargasaurusMusic from "./assets/amargasaurus-music.wav";
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
import { KrakenIntro } from "./components/KrakenIntro";
import { MegalodonIntro } from "./components/MegalodonIntro";
import { BloopIntro } from "./components/BloopIntro";
import { AmargasaurusIntro } from "./components/AmargasaurusIntro";

const DEBUG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debug");

interface BossIntro {
  Component: ComponentType;
  /** Omitted for a boss whose intro doesn't need a spoken line -- the
   *  Bloop plays its own real recording instead (see `music` there). */
  voiceCue?: string;
  music?: { url: string; volume: number };
  durationMs: number;
}

// Title-card flourish played before round 1 of a "boss" game -- currently
// the Megalodon, the Bloop, the Amargasaurus and the Kraken (see
// `PREDATOR_LEVELS` in predators.ts for which levels those currently
// are), and every time the cycle comes back around to any of them. The
// Dunkleosteus is deliberately not one of these -- a normal predator,
// not a boss fight. A lookup keyed by kind instead of one hardcoded `if`
// per boss so a future boss just adds a row here, not another copy of
// the whole intro/timer/guard flow in handleStart below.
const BOSS_INTROS: Partial<Record<PredatorKind, BossIntro>> = {
  kraken: {
    Component: KrakenIntro,
    voiceCue: "release-the-kraken",
    // Trimmed to 2s with a fade-out baked in (see src/assets/kraken-music.wav's
    // provenance in AGENTS.md) -- quieter than full volume so the voice line
    // stays clear on top of it.
    music: { url: krakenMusic, volume: 0.55 },
    durationMs: 2100,
  },
  megalodon: {
    Component: MegalodonIntro,
    voiceCue: "bigger-boat",
    // See src/assets/megalodon-music.wav's provenance in AGENTS.md --
    // same "quieter than full volume, voice line stays clear on top"
    // reasoning as the Kraken's own music.
    music: { url: megalodonMusic, volume: 0.6 },
    durationMs: 2400,
  },
  bloop: {
    Component: BloopIntro,
    // No voiceCue -- the actual NOAA recording (see AGENTS.md for
    // provenance) plays instead of a synthesized line, at full volume
    // since it's the point of this boss, not background ambience under
    // one. durationMs covers its own ~4.7s (trimmed, fades baked in) plus
    // a beat of margin after the fade-out finishes.
    music: { url: bloopSound, volume: 0.9 },
    durationMs: 4900,
  },
  amargasaurus: {
    Component: AmargasaurusIntro,
    voiceCue: "move-in-herds",
    // See src/assets/amargasaurus-music.wav's provenance in AGENTS.md --
    // same "quieter than full volume, voice line stays clear on top"
    // reasoning as the Kraken's/Megalodon's own music. durationMs covers
    // its own trimmed ~2.6s (fades baked in) rather than the voice
    // line's shorter ~2s, so the music's own fade-out finishes instead
    // of getting cut off mid-swell.
    music: { url: amargasaurusMusic, volume: 0.55 },
    durationMs: 2700,
  },
};

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
  const [playCount, setPlayCount] = useState(0);
  const predator = getPredatorLevel(playCount || 1);
  const nextPredator = getPredatorLevel(playCount + 1);

  // Looping background track for every level's rounds -- the shared boss
  // track for whichever kinds BOSS_INTROS lists, or the shared non-boss
  // track for everything else. One useBackgroundMusic call handles both:
  // which url it's given switches with predator.kind, not `active` itself,
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
  const musicUrl = predator.kind in BOSS_INTROS ? bossMusic : nonBossMusic;
  useBackgroundMusic(musicUrl, 0.35, inRound, muted);

  // Warm the network fetch for background tracks ahead of time -- on mount/
  // as soon as known, not when a round actually starts -- so
  // useBackgroundMusic's own startMusic() call finds whichever one it
  // needs already loaded instead of beginning a cold fetch right when
  // playback is wanted. The non-boss track preloads unconditionally on
  // mount, since every session's very first level is always a plain
  // predator; the boss track only once nextPredator.kind actually is one
  // (not unconditionally on every mount) -- a player who never reaches a
  // boss level shouldn't pay for its ~5.4MB. nextPredator is already known
  // for a whole game's length before that level itself ever starts (it's
  // derived from playCount, which only changes in beginGame() -- see
  // above), so this still has plenty of lead time once it does trigger.
  useEffect(() => {
    preloadMusic(nonBossMusic);
  }, []);
  useEffect(() => {
    if (nextPredator.kind in BOSS_INTROS) preloadMusic(bossMusic);
  }, [nextPredator.kind]);

  // The currently-showing boss intro, if any -- see BOSS_INTROS above.
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
    const bossIntro = BOSS_INTROS[nextPredator.kind];
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
