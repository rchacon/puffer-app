import { MIN_WORDS } from "../game/rounds";
import type { Mode } from "../data/modeSelection";
import { ModeToggle } from "./ModeToggle";
import { WordPicker } from "./WordPicker";

interface Props {
  onStart: () => void;
  allWords: string[];
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  mode: Mode;
  onModeChange: (next: Mode) => void;
  /** True while something (the Kraken intro) should keep Start inert. */
  disabled?: boolean;
}

export function StartScreen({
  onStart,
  allWords,
  selected,
  onSelectedChange,
  mode,
  onModeChange,
  disabled = false,
}: Props) {
  const wordsReady = selected.length >= MIN_WORDS;
  const hint =
    mode === "hard"
      ? "Listen to the voice, then spell the word. Help the puffer fish survive the shark!"
      : "Listen to the voice, then tap the card that spells the word. Help the puffer fish survive the shark!";
  return (
    <div className="start">
      <ModeToggle mode={mode} onChange={onModeChange} />

      <p className="start__hint">{hint}</p>

      <WordPicker
        allWords={allWords}
        selected={selected}
        onChange={onSelectedChange}
      />

      <button
        className="start__button"
        type="button"
        onClick={onStart}
        disabled={!wordsReady || disabled}
      >
        &#9654; Start
      </button>
      {!wordsReady && (
        <p className="start__warn">Pick at least {MIN_WORDS} words to play.</p>
      )}
    </div>
  );
}
