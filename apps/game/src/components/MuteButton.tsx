interface Props {
  muted: boolean;
  onToggle: () => void;
}

// Always-visible music on/off button, pinned to the corner of the app so it
// is reachable during gameplay (the only time music plays), not just on the
// start screen. A real <button> with aria-pressed so it's keyboard- and
// screen-reader-operable; the emoji is decorative, the aria-label carries
// the meaning.
export function MuteButton({ muted, onToggle }: Props) {
  return (
    <button
      type="button"
      className="mutebutton"
      aria-pressed={muted}
      aria-label={muted ? "Unmute music" : "Mute music"}
      onClick={onToggle}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
}
