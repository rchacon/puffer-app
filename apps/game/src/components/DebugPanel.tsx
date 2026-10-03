import type { Game } from "../game/useGame";

interface Props {
  game: Game;
  /** The predator App.tsx currently has on screen (drives the outcome cue). */
  predatorLabel: string;
}

export function DebugPanel({ game, predatorLabel }: Props) {
  const { state } = game;
  return (
    <div className="debug">
      <span className="debug__status">
        phase <b>{state.phase}</b> &middot; round <b>{state.roundIndex + 1}</b>{" "}
        &middot; score <b>{state.score}</b>
      </span>
      <div className="debug__buttons">
        <button type="button" onClick={() => game.debugOutcome(2, predatorLabel)}>2 defeat</button>
        <button type="button" onClick={() => game.debugOutcome(3, predatorLabel)}>3 barely</button>
        <button type="button" onClick={() => game.debugOutcome(4, predatorLabel)}>4 hurt</button>
        <button type="button" onClick={() => game.debugOutcome(5, predatorLabel)}>5 victory</button>
        <button type="button" onClick={game.restart}>reset</button>
      </div>
    </div>
  );
}
