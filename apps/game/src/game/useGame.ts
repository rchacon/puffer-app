import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { buildRounds, type Round } from "./rounds";
import { getOutcome, outcomeAudioCue, pufferScale, TOTAL_ROUNDS, type Outcome } from "./outcome";
import { playCue, playPrompt, preloadPrompts } from "../audio/player";

export type Phase = "start" | "playing" | "reveal" | "result";

/** How long the correct/wrong answer stays on screen before the next round. */
const REVEAL_MS = 1500;

export interface GameState {
  phase: Phase;
  rounds: Round[];
  roundIndex: number;
  score: number;
  lastCorrect: boolean | null;
  pickedIndex: number | null;
}

type Action =
  | { type: "start"; rounds: Round[] }
  | { type: "answer"; correct: boolean; pickedIndex: number }
  | { type: "advance" }
  | { type: "finish" }
  | { type: "restart" }
  | { type: "debug"; rounds: Round[]; score: number };

const initialState: GameState = {
  phase: "start",
  rounds: [],
  roundIndex: 0,
  score: 0,
  lastCorrect: null,
  pickedIndex: null,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "start":
      return { ...initialState, phase: "playing", rounds: action.rounds };
    case "answer":
      return {
        ...state,
        phase: "reveal",
        score: state.score + (action.correct ? 1 : 0),
        lastCorrect: action.correct,
        pickedIndex: action.pickedIndex,
      };
    case "advance":
      return {
        ...state,
        phase: "playing",
        roundIndex: state.roundIndex + 1,
        lastCorrect: null,
        pickedIndex: null,
      };
    case "finish":
      return { ...state, phase: "result" };
    case "restart":
      return initialState;
    case "debug":
      return {
        ...initialState,
        phase: "result",
        rounds: action.rounds,
        roundIndex: TOTAL_ROUNDS - 1,
        score: action.score,
      };
    default:
      return state;
  }
}

export interface Game {
  state: GameState;
  start: (pool?: string[], predatorLabel?: string) => void;
  answer: (index: number) => void;
  answerTyped: (word: string) => void;
  replay: () => void;
  restart: () => void;
  debugOutcome: (score: number, predatorLabel?: string) => void;
  sharkProgress: number;
  pufferScale: number;
  outcome: Outcome | null;
}

export function useGame(): Game {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Which predator this game is for (its label, e.g. "The shark"), purely
  // so the defeat/victory cue at the end can name it -- doesn't affect any
  // rule (see outcome.ts). A label rather than a numeric level so the
  // audio cue it feeds into (outcomeAudioCue) doesn't depend on level
  // position -- see AGENTS.md.
  const label = useRef("The shark");

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = useCallback((pool?: string[], predatorLabel = "The shark") => {
    label.current = predatorLabel;
    // buildRounds falls back to the full bank when the pool is too small.
    const rounds = buildRounds(TOTAL_ROUNDS, pool);
    preloadPrompts(rounds.map((r) => r.target));
    dispatch({ type: "start", rounds });
    void playPrompt(rounds[0].target);
  }, []);

  // Shared tail for both answer-input modes (Easy Mode's card tap and Hard
  // Mode's typed spelling, see answer()/answerTyped() below) -- everything
  // past "was this correct, and what (if anything) did the player pick" is
  // identical regardless of how that was decided: dispatch the reveal, play
  // the correct/wrong cue, then either advance to the next round or finish
  // the game after REVEAL_MS. `pickedIndex` is `-1` for a typed answer --
  // it's only ever read by CardRow/FlashCard to highlight a specific card,
  // which never renders in Hard Mode.
  const resolveAnswer = useCallback(
    (correct: boolean, pickedIndex: number) => {
      dispatch({ type: "answer", correct, pickedIndex });
      // A short "Oops." on a wrong answer (no "try again" -- there's no
      // retry); the correct answer is highlighted during the reveal either
      // way.
      void playCue(correct ? "correct" : "wrong");

      const isLast = state.roundIndex === state.rounds.length - 1;
      const finalScore = state.score + (correct ? 1 : 0);

      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (isLast) {
          dispatch({ type: "finish" });
          void playCue(outcomeAudioCue(getOutcome(finalScore), label.current));
        } else {
          dispatch({ type: "advance" });
          void playPrompt(state.rounds[state.roundIndex + 1].target);
        }
      }, REVEAL_MS);
    },
    [state.roundIndex, state.rounds, state.score],
  );

  const answer = useCallback(
    (index: number) => {
      if (state.phase !== "playing") return;
      const round = state.rounds[state.roundIndex];
      resolveAnswer(index === round.correctIndex, index);
    },
    [state.phase, state.roundIndex, state.rounds, resolveAnswer],
  );

  const answerTyped = useCallback(
    (word: string) => {
      if (state.phase !== "playing") return;
      const round = state.rounds[state.roundIndex];
      // Defensive -- SpellInput only ever calls this once every tile is
      // filled, so a length mismatch shouldn't happen in practice.
      if (word.length !== round.target.length) return;
      resolveAnswer(word.trim().toLowerCase() === round.target.toLowerCase(), -1);
    },
    [state.phase, state.roundIndex, state.rounds, resolveAnswer],
  );

  const replay = useCallback(() => {
    const round = state.rounds[state.roundIndex];
    if (round && (state.phase === "playing" || state.phase === "reveal")) {
      void playPrompt(round.target);
    }
  }, [state.rounds, state.roundIndex, state.phase]);

  const restart = useCallback(() => {
    clearTimeout(timer.current);
    dispatch({ type: "restart" });
  }, []);

  const debugOutcome = useCallback((score: number, predatorLabel?: string) => {
    clearTimeout(timer.current);
    // Debug mode can jump straight to an outcome without ever calling
    // start(), so it can't rely on label.current having been set for the
    // predator currently on screen -- take it explicitly instead (App.tsx
    // passes its own predator.label, the same source BattleScene uses).
    if (predatorLabel !== undefined) label.current = predatorLabel;
    dispatch({ type: "debug", rounds: buildRounds(TOTAL_ROUNDS), score });
    void playCue(outcomeAudioCue(getOutcome(score), label.current));
  }, []);

  const sharkProgress = useMemo(() => {
    switch (state.phase) {
      case "start":
        return 0;
      case "playing":
        return (state.roundIndex + 0.15) / TOTAL_ROUNDS;
      case "reveal":
        return (state.roundIndex + 1) / TOTAL_ROUNDS;
      case "result":
        return 1;
    }
  }, [state.phase, state.roundIndex]);

  const outcome = state.phase === "result" ? getOutcome(state.score) : null;

  return {
    state,
    start,
    answer,
    answerTyped,
    replay,
    restart,
    debugOutcome,
    sharkProgress,
    pufferScale: pufferScale(state.score),
    outcome,
  };
}
