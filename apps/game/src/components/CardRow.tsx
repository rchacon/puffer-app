import { FlashCard, type CardState } from "./FlashCard";
import type { Phase } from "../game/useGame";

interface Props {
  options: string[];
  phase: Phase;
  pickedIndex: number | null;
  correctIndex: number;
  onPick: (index: number) => void;
}

export function CardRow({ options, phase, pickedIndex, correctIndex, onPick }: Props) {
  return (
    <div className="cards">
      {options.map((word, i) => {
        let state: CardState = "idle";
        if (phase === "reveal") {
          if (i === correctIndex) state = "correct";
          else if (i === pickedIndex) state = "wrong";
        }
        return (
          <FlashCard
            key={`${word}-${i}`}
            word={word}
            state={state}
            disabled={phase !== "playing"}
            onPick={() => onPick(i)}
          />
        );
      })}
    </div>
  );
}
