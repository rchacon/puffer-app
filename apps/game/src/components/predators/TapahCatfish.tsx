// Tapah catfish (Wallagonia leerii): a shark-like body, flatter head, and the
// long barbel "whiskers" that give catfish their name.
export function TapahCatfish() {
  return (
    <g className="catfish">
      <path d="M40 0 L58 -14 L50 0 L58 14 Z" fill="#5b6b5e" />
      <path
        d="M-44 0 Q -30 -16 20 -10 Q 44 -4 44 0 Q 44 4 20 10 Q -30 16 -44 0 Z"
        fill="#8a9c86"
        stroke="#5b6b5e"
        strokeWidth={2}
      />
      <path d="M-36 6 Q -10 14 24 8 Q 4 11 -36 10 Z" fill="#c9d4c4" opacity={0.8} />
      <circle cx={-32} cy={-3} r={2.4} fill="#04121a" />
      <path
        d="M-44 4 Q -34 10 -20 9"
        fill="none"
        stroke="#04121a"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <g stroke="#3f4a3f" strokeWidth={1.6} strokeLinecap="round" fill="none">
        <path d="M-44 5 Q -54 4 -60 -2" />
        <path d="M-44 7 Q -52 12 -58 12" />
      </g>
    </g>
  );
}
