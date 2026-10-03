import { useEffect, useRef, useState } from "react";
import type { Phase } from "../game/useGame";

interface Props {
  target: string;
  phase: Phase;
  onSubmit: (word: string) => void;
}

// Hard Mode's answer input -- spell the word instead of picking a card.
// Deliberately NOT a hand-built on-screen key grid: a real (visually
// hidden) text <input> gets native keyboard handling on desktop and the
// device's own software keyboard on phones/tablets for free, backspace
// included, instead of reimplementing either. The tile row is the only
// thing actually shown; it's just a styled reflection of the input's own
// value, and clicking/tapping it focuses the input (same "hidden input,
// styled label carries the look" technique .wordpicker__chip already uses).
export function SpellInput({ target, phase, onSubmit }: Props) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isPlaying = phase === "playing";
  const isReveal = phase === "reveal";
  const isFull = typed.length === target.length;
  const mismatched = isReveal && typed !== target.toLowerCase();

  // Autofocus at the start of each round -- App.tsx remounts this
  // component per round (key={roundIndex}), so this only ever fires once
  // per round, right as it becomes playable. Works reliably on desktop and
  // Android, but NOT on iOS Safari: WebKit only raises the on-screen
  // keyboard from a focus() call made synchronously inside a real user
  // gesture (a click/tap handler), not from an effect that runs after
  // render/commit -- a long-documented restriction, not fixable by timing
  // this differently. The tile row's own onClick below still focuses the
  // input from a real tap, so an iPhone/iPad player who doesn't see the
  // keyboard pop up on its own can just tap the tiles (see
  // .spellinput__hint, shown for exactly that reason).
  useEffect(() => {
    if (isPlaying) inputRef.current?.focus();
  }, [isPlaying]);

  const submit = () => {
    if (!isPlaying || !isFull) return;
    onSubmit(typed);
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <div className="spellinput">
      <div className="spellinput__tiles" onClick={focusInput}>
        {Array.from({ length: target.length }, (_, i) => {
          const letter = typed[i];
          let className = "spellinput__tile";
          if (isReveal && letter) {
            className +=
              letter === target[i].toLowerCase()
                ? " spellinput__tile--correct"
                : " spellinput__tile--wrong";
          }
          return (
            <span key={i} className={className}>
              {letter ? letter.toUpperCase() : ""}
            </span>
          );
        })}
      </div>

      {isPlaying && typed.length === 0 && (
        // Tappable itself (not just descriptive) -- a tap on this text is
        // just as much a real user gesture as one on the tiles above, so it
        // focuses the input the same way. Worded as "a tile" rather than
        // "here" so it doesn't read as "tap this text" when it's actually
        // any of the tiles that does it (this text included, now).
        <p className="spellinput__hint" onClick={focusInput}>
          Tap a tile to type
        </p>
      )}

      <input
        ref={inputRef}
        className="spellinput__input"
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        maxLength={target.length}
        value={typed}
        onChange={(e) => setTyped(e.target.value.replace(/[^a-zA-Z]/g, "").toLowerCase())}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        disabled={!isPlaying}
        aria-label={`Spell the word, ${target.length} letters`}
      />

      {mismatched && <p className="spellinput__reveal">{target.toUpperCase()}</p>}

      <button
        type="button"
        className="spellinput__check"
        disabled={!isPlaying || !isFull}
        onClick={submit}
      >
        Check
      </button>
    </div>
  );
}
