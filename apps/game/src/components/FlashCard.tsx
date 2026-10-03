export type CardState = "idle" | "correct" | "wrong";

interface Props {
  word: string;
  state: CardState;
  disabled: boolean;
  onPick: () => void;
}

export function FlashCard({ word, state, disabled, onPick }: Props) {
  return (
    <button
      className={`card card--${state}`}
      type="button"
      disabled={disabled}
      onClick={onPick}
      aria-label={`Choose the word ${word}`}
    >
      {word}
    </button>
  );
}
