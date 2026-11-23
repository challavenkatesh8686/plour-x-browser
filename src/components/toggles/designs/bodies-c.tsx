/* eslint-disable react-refresh/only-export-components -- vendored toggle library: files export both components and helpers */
import type { CSSProperties, ReactElement } from 'react';
import type { ResolvedToggleConfig } from '../resolveConfig';
import type { ToggleId } from '../types';

interface BodyProps {
  cfg: ResolvedToggleConfig;
}
type Body = (p: BodyProps) => ReactElement;

/** Set C: DOM bodies for the playful-expressive designs. Designs not listed here fall back to the plain track + thumb body. */

const Track = ({ children }: { children?: ReactElement | ReactElement[] }) => (
  <span className="tgl-track" aria-hidden="true">
    <span className="tgl-fill" />
    {children}
  </span>
);

const vars = (v: Record<string, string | number>) => v as CSSProperties;

/* ---------- emoji: sleepy face swaps with a happy one ---------- */
const emojiBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <svg className="ec-face ec-sleepy" viewBox="0 0 24 24">
        <circle cx="12" cy="13" r="10.5" className="ec-sleepy-bg" />
        <path d="M6.6 12.6q2 1.9 4 0M13.4 12.6q2 1.9 4 0" fill="none" stroke="#3b4361" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="12" cy="17.6" rx="1.7" ry="1.2" fill="#3b4361" opacity="0.8" />
        <path className="ec-z" d="M16 .6h4.4l-4.4 4.4h4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg className="ec-face ec-happy" viewBox="0 0 24 24">
        <circle cx="12" cy="12.5" r="10.5" className="ec-happy-bg" />
        <ellipse cx="8.3" cy="10" rx="1.4" ry="2" fill="#422006" />
        <ellipse cx="15.7" cy="10" rx="1.4" ry="2" fill="#422006" />
        <circle cx="8.8" cy="9.2" r="0.55" fill="#fff" />
        <circle cx="16.2" cy="9.2" r="0.55" fill="#fff" />
        <path d="M6.4 14.2h11.2a5.6 5.4 0 0 1-11.2 0z" fill="#7c2d12" />
        <path d="M9.2 18.1a3 2.1 0 0 1 5.6 0 5.6 3 0 0 1-5.6 0z" fill="#fb7185" />
        <circle cx="5.2" cy="14" r="1.6" fill="#fb7185" opacity="0.45" />
        <circle cx="18.8" cy="14" r="1.6" fill="#fb7185" opacity="0.45" />
      </svg>
    </span>
  </>
);

/* ---------- smiley: one face whose mouth flips frown -> smile ---------- */
const smileyBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <svg className="sm-face" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10.8" className="sm-bg" />
        <circle cx="8.2" cy="9.6" r="1.5" fill="#3b2a07" />
        <circle cx="15.8" cy="9.6" r="1.5" fill="#3b2a07" />
        <path className="sm-brows" d="M5.8 7.6l4-1.6M18.2 7.6l-4-1.6" fill="none" stroke="#3b2a07" strokeWidth="1.3" strokeLinecap="round" />
        <path className="sm-mouth" d="M6.8 14.6Q12 20.4 17.2 14.6" fill="none" stroke="#3b2a07" strokeWidth="1.9" strokeLinecap="round" />
        <path className="sm-tear" d="M7.4 12.3c1 1.3 1.5 2 1.5 2.7a1.5 1.5 0 0 1-3 0c0-.7.5-1.4 1.5-2.7z" fill="#38bdf8" />
      </svg>
    </span>
  </>
);

/* ---------- bubble: iridescent soap bubble that re-forms and pops ---------- */
const POP = Array.from({ length: 8 }, (_, i) => i * 45);
const bubbleBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <span className="bb-orb" />
      <span className="bb-pop">
        {POP.map((a) => (
          <i key={a} style={vars({ '--a': `${a}deg` })} />
        ))}
      </span>
    </span>
  </>
);

/* ---------- heart: fills with colour, beats once, floats mini hearts ---------- */
const HEART = 'M12 21.2s-8-4.8-10.2-9.7C.3 8 2.5 4 6.4 4c2 0 3.6 1 5.6 3.1C14 5 15.600 4 17.600 4c3.900 0 6.100 4 4.600 7.500C20 16.400 12 21.200 12 21.200z';
const heartBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <svg className="ht-svg" viewBox="0 0 24 24">
        <path className="ht-outer" d={HEART} />
        <path className="ht-inner" d={HEART} />
      </svg>
      {[-1, 0, 1].map((k) => (
        <svg key={k} className="ht-mini" viewBox="0 0 24 24" style={vars({ '--k': k })}>
          <path d={HEART} />
        </svg>
      ))}
    </span>
  </>
);

/* ---------- rocket: horizontal rocket with exhaust flame ---------- */
const rocketBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <svg className="rk-svg" viewBox="0 0 32 20">
        <g className="rk-flame">
          <path d="M5 6.800L-7 10 5 13.200z" fill="#fb923c" />
          <path d="M5 8.300L-2.500 10 5 11.700z" fill="#fde047" />
        </g>
        <path d="M7 5L3 .5h8.500L13 5zM7 15l-4 4.500h8.500L13 15z" fill="#f43f5e" />
        <path d="M4 7c0-1.400 1-2 2.200-2H17c6 0 11 3 13 5-2 2-7 5-13 5H6.200C5 15 4 14.400 4 13z" className="rk-body" />
        <path d="M23 5.900c3 1.200 5.500 2.900 7 4.100-1.500 1.200-4 2.900-7 4.100z" fill="#f43f5e" />
        <circle cx="15.500" cy="10" r="2.500" fill="#38bdf8" stroke="#94a3b8" strokeWidth="1" />
      </svg>
    </span>
  </>
);

/* ---------- bouncy-ball: ball with seams, floor shadow ---------- */
const ballBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <span className="bl-sh" />
      <span className="bl-ball">
        <svg className="bl-svg" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" className="bl-bg" />
          <path d="M12 1v22M1 12h22M4 4.200c4.500 3.600 4.500 11.900 0 15.600M20 4.200c-4.500 3.600-4.500 11.900 0 15.600" fill="none" stroke="#7c2d12" strokeWidth="1.200" opacity="0.75" />
          <ellipse cx="8" cy="7.500" rx="3" ry="1.800" fill="#fff" opacity="0.4" transform="rotate(-35 8 7.500)" />
        </svg>
      </span>
    </span>
  </>
);

/* ---------- chomp: pellet track and a chomping arcade eater ---------- */
const chompBody: Body = () => (
  <>
    <Track>
      <span className="ch-dots" />
    </Track>
    <span className="tgl-thumb" aria-hidden="true">
      <span className="ch-sprite">
        <svg className="ch-svg" viewBox="0 0 24 24">
          <g className="ch-up">
            <path d="M0 12A12 12 0 0 1 24 12z" className="ch-fill" />
            <circle cx="13.500" cy="6" r="1.500" fill="#1f2937" />
          </g>
          <g className="ch-dn">
            <path d="M0 12a12 12 0 0 0 24 0z" className="ch-fill" />
          </g>
        </svg>
      </span>
    </span>
  </>
);

/* ---------- confetti: burst of paper pieces fires on switch-on ---------- */
const PIECES = [
  { dx: -1.5, dy: -1.35, r: 220, c: '#f43f5e' },
  { dx: -1.0, dy: -1.9, r: -260, c: '#facc15' },
  { dx: -0.5, dy: -2.2, r: 300, c: '#22d3ee' },
  { dx: 0.0, dy: -2.4, r: -180, c: '#a78bfa' },
  { dx: 0.5, dy: -2.15, r: 260, c: '#34d399' },
  { dx: 1.0, dy: -1.85, r: -300, c: '#fb923c' },
  { dx: 1.5, dy: -1.3, r: 200, c: '#f472b6' },
  { dx: -2.0, dy: -0.7, r: -140, c: '#38bdf8' },
  { dx: 2.0, dy: -0.75, r: 150, c: '#facc15' },
  { dx: -0.8, dy: -1.2, r: 340, c: '#34d399' },
  { dx: 0.9, dy: -1.1, r: -320, c: '#f43f5e' },
  { dx: 0.2, dy: -1.6, r: 120, c: '#fb923c' },
];
const confettiBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <svg className="cf-star" viewBox="0 0 24 24">
        <path d="M12 2.300l2.900 6 6.600.9-4.800 4.600 1.200 6.500L12 17.200 6.100 20.300l1.200-6.500L2.500 9.200l6.600-.9z" />
      </svg>
      <span className="cf-burst">
        {PIECES.map((p, i) => (
          <i key={i} style={vars({ '--dx': p.dx, '--dy': p.dy, '--r': `${p.r}deg`, '--c': p.c })} />
        ))}
      </span>
    </span>
  </>
);

/* ---------- jelly: gelatin track, wobbling translucent blob ---------- */
const jellyBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <span className="jl-blob" />
    </span>
  </>
);

/* ---------- sticker: die-cut sticker on a paper track ---------- */
const stickerBody: Body = () => (
  <>
    <Track />
    <span className="tgl-thumb" aria-hidden="true">
      <span className="st-body">
        <svg className="st-star" viewBox="0 0 24 24">
          <path d="M12 2.800l2.700 5.600 6.100.9-4.400 4.300 1 6.100-5.400-2.900-5.400 2.900 1-6.100-4.400-4.300 6.100-.9z" />
        </svg>
      </span>
    </span>
  </>
);

export const BODIES_C: Partial<Record<ToggleId, Body>> = {
  emoji: emojiBody,
  smiley: smileyBody,
  bubble: bubbleBody,
  heart: heartBody,
  rocket: rocketBody,
  'bouncy-ball': ballBody,
  chomp: chompBody,
  confetti: confettiBody,
  jelly: jellyBody,
  sticker: stickerBody,
};
