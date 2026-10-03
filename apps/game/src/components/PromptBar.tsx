interface Props {
  round: number;
  total: number;
  onReplay: () => void;
}

export function PromptBar({ round, total, onReplay }: Props) {
  return (
    <div className="promptbar">
      <span className="promptbar__round">
        Round {round} / {total}
      </span>
      <button className="promptbar__replay" type="button" onClick={onReplay}>
        &#128266; Say it again
      </button>
    </div>
  );
}
