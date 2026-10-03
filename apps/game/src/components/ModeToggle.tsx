import type { Mode } from "../data/modeSelection";

interface Props {
  mode: Mode;
  onChange: (next: Mode) => void;
}

const OPTIONS: Array<{ value: Mode; label: string }> = [
  { value: "easy", label: "Easy" },
  { value: "hard", label: "Hard" },
];

// Always-visible Easy/Hard picker on the start screen -- unlike WordPicker
// this is a small, binary choice, so it isn't tucked behind a disclosure.
// Same "checkbox visually hidden, label styled as the pill" technique as
// .wordpicker__chip (see index.css), but mutually-exclusive radios (shared
// `name`) instead of independent checkboxes, since exactly one mode is
// active at a time.
export function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="modetoggle" role="radiogroup" aria-label="Game mode">
      {OPTIONS.map(({ value, label }) => (
        <label key={value} className="modetoggle__option">
          <input
            type="radio"
            name="mode"
            value={value}
            checked={mode === value}
            onChange={() => onChange(value)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
