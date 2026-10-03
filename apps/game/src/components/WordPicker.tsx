import { useEffect, useMemo, useRef, useState } from "react";
import { MIN_WORDS } from "../game/rounds";

interface Props {
  allWords: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

interface Group {
  label: string;
  words: string[];
}

const GROUP_DEFS: Array<[string, (w: string) => boolean]> = [
  ["1-2 letters", (w) => w.length <= 2],
  ["3 letters", (w) => w.length === 3],
  ["4 letters", (w) => w.length === 4],
];

/** A checkbox that can also show the indeterminate (some-but-not-all) state. */
function TriCheck({
  label,
  checked,
  indeterminate,
  onToggle,
}: {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <label className="wordpicker__grouphead">
      <input ref={ref} type="checkbox" checked={checked} onChange={onToggle} />
      {label}
    </label>
  );
}

export function WordPicker({ allWords, selected, onChange }: Props) {
  const [userOpen, setUserOpen] = useState(false);
  // Force the panel open whenever the selection is too small to start, so the
  // fix is always visible even if the player had collapsed it.
  const open = userOpen || selected.length < MIN_WORDS;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const groups = useMemo<Group[]>(
    () =>
      GROUP_DEFS.map(([label, test]) => ({
        label,
        words: allWords.filter(test),
      })).filter((g) => g.words.length > 0),
    [allWords],
  );

  // Rebuild the selection in bank order so chips never reorder.
  const setWords = (words: string[], on: boolean) => {
    const touched = new Set(words);
    onChange(allWords.filter((w) => (touched.has(w) ? on : selectedSet.has(w))));
  };

  return (
    <div className="wordpicker">
      <button
        type="button"
        className="wordpicker__summary"
        aria-expanded={open}
        onClick={() => setUserOpen((o) => !o)}
      >
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
        Choose words
        <span className="wordpicker__count">
          {selected.length} / {allWords.length}
        </span>
      </button>

      {open && (
        <div className="wordpicker__body">
          <div className="wordpicker__bulk">
            <button type="button" onClick={() => onChange([...allWords])}>
              All
            </button>
            <button type="button" onClick={() => onChange([])}>
              None
            </button>
          </div>

          {groups.map((group) => {
            const chosen = group.words.filter((w) => selectedSet.has(w));
            const allOn = chosen.length === group.words.length;
            return (
              <div key={group.label} className="wordpicker__group">
                <TriCheck
                  label={group.label}
                  checked={allOn}
                  indeterminate={chosen.length > 0}
                  onToggle={() => setWords(group.words, !allOn)}
                />
                <div className="wordpicker__chips">
                  {group.words.map((word) => (
                    <label key={word} className="wordpicker__chip">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(word)}
                        onChange={() => setWords([word], !selectedSet.has(word))}
                      />
                      {word}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
