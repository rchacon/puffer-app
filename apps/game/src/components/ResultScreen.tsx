import { outcomeText, toMidSentence, type Outcome } from "../game/outcome";

interface Props {
  score: number;
  total: number;
  outcome: Outcome;
  predatorLabel: string;
  nextPredatorLabel: string;
  onRestart: () => void;
}

export function ResultScreen({
  score,
  total,
  outcome,
  predatorLabel,
  nextPredatorLabel,
  onRestart,
}: Props) {
  const { title, body } = outcomeText(outcome, predatorLabel);
  return (
    <div className={`result result--${outcome}`}>
      <h2 className="result__title">{title}</h2>
      <p className="result__score">
        You got {score} of {total} right
      </p>
      <p className="result__body">{body}</p>
      <button className="result__button" type="button" onClick={onRestart}>
        Play again
      </button>
      <p className="result__next">
        Play again to face {toMidSentence(nextPredatorLabel)}!
      </p>
    </div>
  );
}
