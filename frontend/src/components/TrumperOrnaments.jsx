// Hand-drawn line ornaments for the F.W. Trumper letters, in the spirit of
// medieval manuscript marginalia: vine scrolls flanking crossed bats under a
// haloed ball (headpiece), and stumps between curling sprigs (colophon).
// Stroke-only art inheriting currentColor, with the ball picked out in the
// site's vermilion accent like a rubricated initial.

export const Headpiece = () => (
  <div className="letter-ornament letter-headpiece" aria-hidden="true">
    <svg viewBox="0 0 400 52" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        {/* left vine scroll */}
        <path d="M 22 30 C 48 16, 74 42, 100 28 C 118 19, 136 38, 154 28" />
        <path d="M 22 30 q -8 3 -7 11" />
        <path d="M 60 27 q 3 -9 11 -10 q -8 -2 -11 10" />
        <path d="M 122 28 q 3 -9 11 -10 q -8 -2 -11 10" />
        {/* right vine scroll (mirror) */}
        <path d="M 378 30 C 352 16, 326 42, 300 28 C 282 19, 264 38, 246 28" />
        <path d="M 378 30 q 8 3 7 11" />
        <path d="M 340 27 q -3 -9 -11 -10 q 8 -2 11 10" />
        <path d="M 278 28 q -3 -9 -11 -10 q 8 -2 11 10" />
        {/* crossed bats */}
        <g transform="translate(200 32) rotate(-38)">
          <rect x="-4" y="-20" width="8" height="26" rx="4" />
          <path d="M 0 6 L 0 15" />
          <circle cx="0" cy="17" r="1.3" />
        </g>
        <g transform="translate(200 32) rotate(38)">
          <rect x="-4" y="-20" width="8" height="26" rx="4" />
          <path d="M 0 6 L 0 15" />
          <circle cx="0" cy="17" r="1.3" />
        </g>
      </g>
      {/* haloed ball, rubricated */}
      <g fill="none" stroke="var(--accent-hover)" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="200" cy="9" r="4.5" />
        <path d="M 197 5.7 q 3 3.3 0 6.6" />
        <path d="M 203 5.7 q -3 3.3 0 6.6" />
        <path d="M 200 1.5 L 200 -1 M 206 3.5 L 208 1.5 M 209.5 9 L 212 9 M 194 3.5 L 192 1.5 M 190.5 9 L 188 9" />
      </g>
    </svg>
  </div>
);

export const Colophon = () => (
  <div className="letter-ornament letter-colophon" aria-hidden="true">
    <svg viewBox="0 0 160 46" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        {/* stumps and bails */}
        <path d="M 72 18 L 72 38 M 80 18 L 80 38 M 88 18 L 88 38" />
        <path d="M 71 15.5 q 4.5 -3 9 0" />
        <path d="M 80 15.5 q 4.5 -3 9 0" />
        {/* flanking sprigs */}
        <path d="M 20 32 C 32 20, 48 38, 62 28" />
        <path d="M 20 32 q -7 3 -6 10" />
        <path d="M 42 29 q 3 -8 10 -9 q -7 -2 -10 9" />
        <path d="M 140 32 C 128 20, 112 38, 98 28" />
        <path d="M 140 32 q 7 3 6 10" />
        <path d="M 118 29 q -3 -8 -10 -9 q 7 -2 10 9" />
      </g>
      {/* trefoil dots */}
      <g fill="currentColor" stroke="none">
        <circle cx="8" cy="30" r="1.2" />
        <circle cx="5" cy="35" r="1.2" />
        <circle cx="11" cy="35" r="1.2" />
        <circle cx="152" cy="30" r="1.2" />
        <circle cx="149" cy="35" r="1.2" />
        <circle cx="155" cy="35" r="1.2" />
      </g>
    </svg>
  </div>
);
