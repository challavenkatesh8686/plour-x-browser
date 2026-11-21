import { cloneElement, type ComponentType, type ReactElement, type ReactNode, type SVGProps } from 'react';
import * as L from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './flat-icons.css';

/** Flat illustrated icons (white tile, accent colour, dark detail) for the navigation. The accent follows the Appearance accent. */
const PRIMARY = 'var(--color-primary, var(--px-accent, var(--accent-primary, var(--accent, #e8489e))))';
const ACC = `var(--flat-acc, ${PRIMARY})`;
const ACC_L = `color-mix(in srgb, var(--flat-acc, ${PRIMARY}) 72%, white)`;
const INK = '#222';
const T = 'var(--flat-tile, #fff)';
const GREY = '#c4c4c4';
const EDGE = 'var(--color-fg, var(--text-primary, currentColor))';
const fill = (c: string) => ({ fill: c });
const tile = { fill: T, stroke: 'rgba(60, 40, 80, 0.28)', strokeWidth: 2.5 };
const line = (c: string, w: number) => ({ fill: 'none', stroke: c, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

function S({ children, ...rest }: { children: ReactNode } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" width={24} height={24} aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

const ART: Record<string, () => ReactNode> = {
  sparkles: () => (
    <S>
      <path d="M26 6l5 15 15 5-15 5-5 15-5-15-15-5 15-5z" style={fill(ACC)} />
      <path d="M48 32l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" style={fill(ACC_L)} />
      <circle cx="14" cy="50" r="3.5" style={fill(EDGE)} />
    </S>
  ),
  mic: () => (
    <S>
      <rect x="23" y="5" width="18" height="32" rx="9" style={fill(ACC)} />
      <path d="M14 30a18 18 0 0 0 36 0" style={line(EDGE, 4)} />
      <path d="M32 48v9M23 58h18" style={line(EDGE, 4)} />
    </S>
  ),
  camera: () => (
    <S>
      <path d="M22 12h20l3 6H19z" style={fill(EDGE)} />
      <rect x="5" y="16" width="54" height="40" rx="10" style={tile} />
      <path d="M5 26a10 10 0 0 1 10-10h34a10 10 0 0 1 10 10v2H5z" style={fill(ACC_L)} />
      <circle cx="32" cy="38" r="11" style={fill(INK)} />
      <circle cx="32" cy="38" r="6" style={fill(ACC)} />
    </S>
  ),
  chat: () => (
    <S>
      <path d="M12 8h40a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H34L20 58V46h-8a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z" style={tile} />
      <path d="M12 8h40a8 8 0 0 1 8 8v5H4v-5a8 8 0 0 1 8-8z" style={fill(ACC_L)} />
      {[18, 32, 46].map((x) => (
        <circle key={x} cx={x} cy="33" r="3.2" style={fill(ACC)} />
      ))}
    </S>
  ),
  notes: () => (
    <S>
      <rect x="10" y="6" width="44" height="52" rx="9" style={tile} />
      <path d="M10 15a9 9 0 0 1 9-9h26a9 9 0 0 1 9 9v6H10z" style={fill(ACC_L)} />
      <rect x="19" y="30" width="26" height="4" rx="2" style={fill(ACC)} />
      <rect x="19" y="40" width="26" height="4" rx="2" style={fill(GREY)} />
      <rect x="19" y="49" width="16" height="4" rx="2" style={fill(GREY)} />
    </S>
  ),
  calendar: () => (
    <S>
      <rect x="14" y="3" width="5" height="11" rx="2.5" style={fill(EDGE)} />
      <rect x="45" y="3" width="5" height="11" rx="2.5" style={fill(EDGE)} />
      <rect x="6" y="8" width="52" height="50" rx="12" style={tile} />
      <path d="M6 20a12 12 0 0 1 12-12h28a12 12 0 0 1 12 12v8H6z" style={fill(ACC_L)} />
      {[16, 28, 40].map((x) => (
        <circle key={x} cx={x} cy="39" r="2.6" style={fill(GREY)} />
      ))}
      <rect x="37" y="43" width="12" height="10" rx="3" style={fill(ACC)} />
      <circle cx="16" cy="49" r="2.6" style={fill(GREY)} />
      <circle cx="28" cy="49" r="2.6" style={fill(GREY)} />
    </S>
  ),
  briefcase: () => (
    <S>
      <rect x="22" y="6" width="20" height="12" rx="5" style={fill(EDGE)} />
      <rect x="6" y="14" width="52" height="42" rx="10" style={tile} />
      <path d="M6 24a10 10 0 0 1 10-10h32a10 10 0 0 1 10 10v8H6z" style={fill(ACC_L)} />
      <rect x="26" y="28" width="12" height="10" rx="3" style={fill(ACC)} />
    </S>
  ),
  zap: () => (
    <S>
      <circle cx="32" cy="32" r="25" style={{ fill: T, stroke: ACC, strokeWidth: 6 }} />
      <path d="M36 14L22 35h9l-3 15 14-22h-9z" style={fill(ACC)} />
    </S>
  ),
  phone: () => (
    <S>
      <rect x="14" y="3" width="36" height="58" rx="10" style={tile} />
      <rect x="19" y="11" width="26" height="36" rx="5" style={fill(ACC_L)} />
      <rect x="23" y="20" width="18" height="6" rx="3" style={fill(ACC)} />
      <rect x="23" y="30" width="12" height="4" rx="2" style={tile} />
      <rect x="27" y="6" width="10" height="2.6" rx="1.3" style={fill(GREY)} />
      <circle cx="32" cy="54" r="2.6" style={fill(INK)} />
    </S>
  ),
  translate: () => (
    <S>
      <rect x="4" y="8" width="34" height="34" rx="9" style={tile} />
      <rect x="26" y="22" width="34" height="34" rx="9" style={fill(ACC)} />
      <text x="21" y="33" textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" style={fill(INK)}>
        A
      </text>
      <text x="43" y="48" textAnchor="middle" fontSize="19" fontWeight="800" fontFamily="system-ui, sans-serif" style={tile}>
        文
      </text>
    </S>
  ),
  globe: () => (
    <S>
      <circle cx="32" cy="32" r="25" style={{ fill: T, stroke: ACC, strokeWidth: 6 }} />
      <ellipse cx="32" cy="32" rx="10" ry="25" style={line(INK, 2.4)} />
      <path d="M8 32h48M12 20h40M12 44h40" style={line(INK, 2.4)} />
    </S>
  ),
  maps: () => (
    <S>
      <path d="M4 18l16-6 24 6 16-6v34l-16 6-24-6-16 6z" style={tile} />
      <path d="M20 12v34M44 18v34" style={line(GREY, 2.4)} />
      <path d="M32 8c-7 0-12 5-12 11 0 8 12 22 12 22s12-14 12-22c0-6-5-11-12-11z" style={fill(ACC)} />
      <circle cx="32" cy="19" r="4.5" style={tile} />
    </S>
  ),
  image: () => (
    <S>
      <rect x="5" y="9" width="54" height="46" rx="11" style={tile} />
      <circle cx="44" cy="23" r="6" style={fill(ACC_L)} />
      <path d="M5 46l16-18 14 15 8-8 16 14v2a11 11 0 0 1-11 10H16A11 11 0 0 1 5 51z" style={fill(ACC)} />
    </S>
  ),
  layers: () => (
    <S>
      <path d="M32 8l26 12-26 12L6 20z" style={fill(ACC)} />
      <path d="M6 32l26 12 26-12" style={line(EDGE, 4.5)} />
      <path d="M6 44l26 12 26-12" style={line(GREY, 4.5)} />
    </S>
  ),
  lock: () => (
    <S>
      <path d="M20 28V20a12 12 0 0 1 24 0v8" style={line(EDGE, 5)} />
      <rect x="8" y="26" width="48" height="32" rx="10" style={tile} />
      <path d="M8 36a10 10 0 0 1 10-10h28a10 10 0 0 1 10 10v2H8z" style={fill(ACC_L)} />
      <circle cx="32" cy="46" r="4.5" style={fill(ACC)} />
    </S>
  ),
  shield: () => (
    <S>
      <path d="M32 5l22 8v16c0 14-9 24-22 30C19 53 10 43 10 29V13z" style={fill(ACC_L)} />
      <path d="M32 5l22 8v16c0 14-9 24-22 30z" style={fill(ACC)} />
      <path d="M22 31l7 7 13-14" style={line(T, 5)} />
    </S>
  ),
  palette: () => (
    <S>
      <path d="M32 6C16 6 5 17 5 31s10 27 24 27c5 0 6-3 4-6s0-6 5-6h8c8 0 13-5 13-12C59 16 47 6 32 6z" style={tile} />
      <circle cx="19" cy="30" r="4.5" style={fill(ACC)} />
      <circle cx="29" cy="18" r="4.5" style={fill(ACC_L)} />
      <circle cx="43" cy="19" r="4.5" style={fill(INK)} />
      <circle cx="48" cy="32" r="4.5" style={fill(GREY)} />
    </S>
  ),
  sun: () => (
    <S>
      <circle cx="32" cy="32" r="13" style={fill(ACC)} />
      <path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M13.6 50.4l5.7-5.7M44.7 19.3l5.7-5.7" style={line(EDGE, 4)} />
    </S>
  ),
  settings: () => (
    <S>
      {[0, 45, 90, 135].map((a) => (
        <rect key={a} x="27" y="4" width="10" height="56" rx="4" style={fill(ACC_L)} transform={`rotate(${a} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="18" style={fill(ACC)} />
      <circle cx="32" cy="32" r="7" style={tile} />
    </S>
  ),
  edit: () => (
    <S>
      <rect x="6" y="10" width="40" height="48" rx="9" style={tile} />
      <path d="M12 24h20M12 34h14" style={line(GREY, 4)} />
      <path d="M52 8l6 6-24 24-9 3 3-9z" style={fill(ACC)} />
      <path d="M25 41l3-9 6 6z" style={fill(INK)} />
    </S>
  ),
  mail: () => (
    <S>
      <rect x="4" y="12" width="56" height="42" rx="10" style={tile} />
      <path d="M4 22a10 10 0 0 1 10-10h36a10 10 0 0 1 10 10l-28 18z" style={fill(ACC_L)} />
      <path d="M4 24l28 18 28-18" style={line(ACC, 4)} />
    </S>
  ),
  users: () => (
    <S>
      <circle cx="22" cy="20" r="9" style={fill(ACC)} />
      <path d="M4 54c1-12 8-17 18-17s17 5 18 17z" style={fill(ACC)} />
      <circle cx="43" cy="24" r="7.5" style={fill(EDGE)} />
      <path d="M33 54c1-9 5-14 11-14s11 5 12 14z" style={fill(EDGE)} />
    </S>
  ),
  tag: () => (
    <S>
      <path d="M6 8h24l28 28-22 22L8 30z" style={{ fill: T, stroke: ACC, strokeWidth: 5, strokeLinejoin: 'round' }} />
      <circle cx="20" cy="22" r="5" style={fill(ACC)} />
    </S>
  ),
  info: () => (
    <S>
      <circle cx="32" cy="32" r="26" style={fill(ACC)} />
      <rect x="29" y="28" width="6" height="18" rx="3" style={tile} />
      <circle cx="32" cy="19" r="3.6" style={tile} />
    </S>
  ),
  check: () => (
    <S>
      <circle cx="32" cy="32" r="26" style={fill(ACC)} />
      <path d="M20 33l8 8 17-18" style={line(T, 5.5)} />
    </S>
  ),
  cloudsun: () => (
    <S>
      <circle cx="24" cy="24" r="11" style={fill(ACC)} />
      <path d="M24 4v5M6 24h5M10 10l3.5 3.5M38 10l-3.5 3.5" style={line(EDGE, 3.5)} />
      <path d="M20 56a12 12 0 0 1-1-24 15 15 0 0 1 28 4 10 10 0 0 1 1 20z" style={tile} />
    </S>
  ),
  moon: () => (
    <S>
      <path d="M40 6a26 26 0 1 0 18 40A22 22 0 0 1 40 6z" style={fill(ACC)} />
      <path d="M48 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" style={fill(ACC_L)} />
      <circle cx="12" cy="14" r="2.6" style={fill(EDGE)} />
    </S>
  ),
  timer: () => (
    <S>
      <rect x="25" y="3" width="14" height="7" rx="3.5" style={fill(EDGE)} />
      <circle cx="32" cy="35" r="24" style={{ fill: T, stroke: ACC, strokeWidth: 6 }} />
      <path d="M32 35V20" style={line(INK, 4)} />
      <path d="M32 35l9 6" style={line(ACC, 4)} />
    </S>
  ),
  file: () => (
    <S>
      <path d="M14 4h24l14 14v34a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8V12a8 8 0 0 1 8-8z" style={tile} />
      <path d="M38 4l14 14H42a4 4 0 0 1-4-4z" style={fill(ACC_L)} />
      <rect x="16" y="32" width="28" height="4" rx="2" style={fill(ACC)} />
      <rect x="16" y="42" width="20" height="4" rx="2" style={fill(GREY)} />
    </S>
  ),
  cloud: () => (
    <S>
      <path d="M18 52a13 13 0 0 1-2-26 17 17 0 0 1 32 3 11 11 0 0 1 1 23z" style={tile} />
      <path d="M32 46V30M25 36l7-7 7 7" style={line(ACC, 4.5)} />
    </S>
  ),
  bell: () => (
    <S>
      <circle cx="32" cy="8" r="4" style={fill(EDGE)} />
      <path d="M32 10c-11 0-17 8-17 18 0 9-4 12-6 15h46c-2-3-6-6-6-15 0-10-6-18-17-18z" style={tile} />
      <path d="M15 28c0-10 6-18 17-18s17 8 17 18z" style={fill(ACC_L)} />
      <circle cx="32" cy="53" r="6" style={fill(ACC)} />
    </S>
  ),
  video: () => (
    <S>
      <rect x="4" y="12" width="40" height="40" rx="10" style={tile} />
      <path d="M44 27l16-9v28l-16-9z" style={fill(ACC_L)} />
      <path d="M18 24v16l14-8z" style={fill(ACC)} />
    </S>
  ),
  music: () => (
    <S>
      <path d="M24 10l32-6v38" style={line(EDGE, 4.5)} />
      <path d="M24 10v38" style={line(EDGE, 4.5)} />
      <ellipse cx="16" cy="50" rx="10" ry="8" style={fill(ACC)} />
      <ellipse cx="48" cy="44" rx="10" ry="8" style={fill(ACC_L)} />
    </S>
  ),
  pin: () => (
    <S>
      <path d="M32 4c-12 0-20 9-20 20 0 14 20 36 20 36s20-22 20-36C52 13 44 4 32 4z" style={fill(ACC)} />
      <circle cx="32" cy="24" r="8" style={tile} />
    </S>
  ),
  gamepad: () => (
    <S>
      <path d="M16 16h32c8 0 12 8 14 20 1 8-3 14-9 14-5 0-8-4-12-8H23c-4 4-7 8-12 8-6 0-10-6-9-14 2-12 6-20 14-20z" style={tile} />
      <path d="M17 26v12M11 32h12" style={line(INK, 4)} />
      <circle cx="42" cy="28" r="3.4" style={fill(ACC)} />
      <circle cx="50" cy="35" r="3.4" style={fill(ACC_L)} />
    </S>
  ),
  clock: () => (
    <S>
      <circle cx="32" cy="32" r="26" style={{ fill: T, stroke: ACC, strokeWidth: 6 }} />
      <path d="M32 18v15" style={line(INK, 4)} />
      <path d="M32 32l11 7" style={line(ACC, 4)} />
      <circle cx="32" cy="32" r="3" style={fill(ACC)} />
    </S>
  ),
  calculator: () => (
    <S>
      <rect x="10" y="4" width="44" height="56" rx="10" style={tile} />
      <path d="M10 14a10 10 0 0 1 10-10h24a10 10 0 0 1 10 10v12H10z" style={fill(ACC_L)} />
      {[20, 32, 44].map((x) => (
        <circle key={x} cx={x} cy="38" r="3.4" style={fill(GREY)} />
      ))}
      <circle cx="20" cy="50" r="3.4" style={fill(GREY)} />
      <circle cx="32" cy="50" r="3.4" style={fill(GREY)} />
      <rect x="40" y="46" width="8" height="8" rx="3" style={fill(ACC)} />
    </S>
  ),
  send: () => (
    <S>
      <path d="M58 6L6 28l18 8 8 18z" style={tile} />
      <path d="M58 6L24 36l8 18z" style={fill(ACC)} />
      <path d="M24 36l18-14" style={line(INK, 3)} />
    </S>
  ),
  grid: () => (
    <S>
      <rect x="6" y="6" width="23" height="23" rx="7" style={fill(ACC)} />
      <rect x="35" y="6" width="23" height="23" rx="7" style={fill(ACC_L)} />
      <rect x="6" y="35" width="23" height="23" rx="7" style={fill(EDGE)} />
      <rect x="35" y="35" width="23" height="23" rx="7" style={fill(GREY)} />
    </S>
  ),
  building: () => (
    <S>
      <rect x="8" y="6" width="32" height="52" rx="8" style={fill(ACC)} />
      <rect x="40" y="28" width="16" height="30" rx="6" style={fill(ACC_L)} />
      {[16, 28].map((x) => (
        <rect key={x} x={x} y="14" width="7" height="7" rx="2" style={tile} />
      ))}
      {[16, 28].map((x) => (
        <rect key={x} x={x} y="27" width="7" height="7" rx="2" style={tile} />
      ))}
      <rect x="18" y="42" width="12" height="16" rx="3" style={tile} />
      <rect x="45" y="36" width="6" height="6" rx="2" style={tile} />
    </S>
  ),
  puzzle: () => (
    <S>
      <path d="M5 15H21a9 9 0 1 1 18 0H54V29a9 9 0 1 1 0 18V59H5V47a9 9 0 1 0 0-18Z" style={fill(ACC)} />
      <path d="M5 15H21a9 9 0 1 1 18 0H54V29H5Z" style={fill(ACC_L)} />
    </S>
  ),
  card: () => (
    <S>
      <rect x="4" y="12" width="56" height="40" rx="9" style={tile} />
      <rect x="4" y="20" width="56" height="9" style={fill(ACC)} />
      <rect x="12" y="38" width="16" height="5" rx="2.5" style={fill(GREY)} />
      <rect x="40" y="38" width="12" height="5" rx="2.5" style={fill(ACC_L)} />
    </S>
  ),
  scale: () => (
    <S>
      <path d="M32 6v48M18 54h28" style={line(EDGE, 4.5)} />
      <path d="M10 18h44" style={line(EDGE, 4.5)} />
      <path d="M10 18L2 36h16zM54 18l-8 18h16z" style={fill(ACC_L)} />
      <path d="M2 36a8 8 0 0 0 16 0zM46 36a8 8 0 0 0 16 0z" style={fill(ACC)} />
    </S>
  ),
  home: () => (
    <S>
      <rect x="12" y="28" width="40" height="30" rx="6" style={fill(ACC_L)} />
      <path d="M32 5L4 30h56z" style={fill(ACC)} />
      <rect x="26" y="38" width="12" height="20" rx="4" style={tile} />
      <rect x="42" y="12" width="7" height="14" rx="2" style={fill(ACC)} />
    </S>
  ),
  dashboard: () => (
    <S>
      <rect x="5" y="5" width="25" height="32" rx="8" style={fill(ACC)} />
      <rect x="34" y="5" width="25" height="20" rx="8" style={tile} />
      <rect x="5" y="41" width="25" height="18" rx="8" style={tile} />
      <rect x="34" y="29" width="25" height="30" rx="8" style={fill(ACC_L)} />
    </S>
  ),
  stack: () => (
    <S>
      <path d="M32 7L55 19 32 31 9 19z" style={{ fill: ACC, stroke: ACC, strokeWidth: 6, strokeLinejoin: 'round' }} />
      <path d="M9 30L32 42 55 30V33L32 45 9 33z" style={{ fill: ACC_L, stroke: ACC_L, strokeWidth: 6, strokeLinejoin: 'round' }} />
      <path d="M9 42L32 54 55 42V45L32 57 9 45z" style={{ fill: EDGE, stroke: EDGE, strokeWidth: 6, strokeLinejoin: 'round' }} />
    </S>
  ),
  logout: () => (
    <S>
      <rect x="7" y="8" width="29" height="48" rx="7" style={fill(ACC)} />
      <rect x="12" y="13" width="19" height="38" rx="4" style={fill(ACC_L)} />
      <circle cx="26" cy="32" r="2.4" style={fill(INK)} />
      <path d="M40 32h15M48 24l8 8-8 8" style={line(EDGE, 5.5)} />
    </S>
  ),
  plus: () => (
    <S>
      <circle cx="32" cy="32" r="26" style={fill(ACC)} />
      <path d="M32 19v26M19 32h26" style={line('#fff', 7)} />
    </S>
  ),
  chart: () => (
    <S>
      <rect x="8" y="34" width="13" height="22" rx="4" style={fill(ACC_L)} />
      <rect x="26" y="18" width="13" height="38" rx="4" style={fill(ACC)} />
      <rect x="44" y="8" width="13" height="48" rx="4" style={fill(EDGE)} />
    </S>
  ),
  support: () => (
    <S>
      <path d="M8 62c0-12 10-18 24-18s24 6 24 18z" style={{ fill: '#3b82c4' }} />
      <path d="M26 44l6 10 6-10z" style={{ fill: '#fff' }} />
      <path d="M30 48h4l2 14h-8z" style={{ fill: '#d93a3a' }} />
      <rect x="27" y="36" width="10" height="10" rx="3" style={{ fill: '#e98a5a' }} />
      <circle cx="32" cy="25" r="14" style={{ fill: '#f4a06b' }} />
      <path d="M17 24c0-10 6-16 15-16s15 6 15 16c-4-2-6-6-8-9-6 4-14 6-22 9z" style={{ fill: '#2b4a6b' }} />
      <path d="M16 26a16 16 0 0 1 32 0" style={{ fill: 'none', stroke: '#8fd3f4', strokeWidth: 4, strokeLinecap: 'round' }} />
      <rect x="11" y="24" width="7" height="12" rx="3.5" style={{ fill: '#8fd3f4' }} />
      <rect x="46" y="24" width="7" height="12" rx="3.5" style={{ fill: '#8fd3f4' }} />
      <path d="M49 34c0 6-4 9-11 9" style={{ fill: 'none', stroke: '#2b4a6b', strokeWidth: 2.5, strokeLinecap: 'round' }} />
      <circle cx="37" cy="43" r="2.6" style={{ fill: '#2b4a6b' }} />
      <circle cx="27.5" cy="26" r="1.6" style={{ fill: '#2b2b2b' }} />
      <circle cx="36.5" cy="26" r="1.6" style={{ fill: '#2b2b2b' }} />
      <path d="M28 32q4 3 8 0" style={{ fill: 'none', stroke: '#2b2b2b', strokeWidth: 1.8, strokeLinecap: 'round' }} />
    </S>
  ),
  terms: () => (
    <S>
      <rect x="5" y="7" width="41" height="54" rx="8" style={fill(ACC)} />
      <rect x="17" y="2" width="17" height="9" rx="3.5" style={fill(ACC_L)} />
      <rect x="10" y="14" width="31" height="42" rx="3" style={{ fill: '#fff' }} />
      <rect x="17" y="19" width="17" height="3.5" rx="1.75" style={fill(INK)} />
      <rect x="21" y="25" width="9" height="2.5" rx="1.25" style={fill(INK)} />
      <rect x="15" y="32" width="21" height="2.5" rx="1.25" style={fill(ACC_L)} />
      <rect x="15" y="37" width="21" height="2.5" rx="1.25" style={fill(ACC_L)} />
      <rect x="15" y="42" width="21" height="2.5" rx="1.25" style={fill(ACC_L)} />
      <circle cx="19" cy="50" r="4" style={{ fill: 'none', stroke: GREY, strokeWidth: 2 }} />
      <path d="M27 51q2-5 4 0t4-1" style={line(GREY, 1.8)} />
      <g transform="translate(54 6) rotate(25)">
        <path d="M-3.5 5h7v26h-7z" style={fill('#f6b93b')} />
        <path d="M-3.5 5a3.5 3.5 0 0 1 7 0z" style={fill('#f08a9b')} />
        <path d="M-3.5 31h7L0 39z" style={fill('#f3d9a4')} />
        <path d="M-1.4 35.4h2.8L0 39z" style={fill(INK)} />
      </g>
    </S>
  ),
  privacy: () => (
    <S>
      <rect x="9" y="9" width="38" height="50" rx="8" style={tile} />
      <rect x="19" y="4" width="18" height="10" rx="4" style={fill(ACC)} />
      <rect x="16" y="22" width="24" height="4.5" rx="2.25" style={fill(ACC_L)} />
      <rect x="16" y="32" width="24" height="4.5" rx="2.25" style={fill(ACC_L)} />
      <rect x="16" y="42" width="14" height="4.5" rx="2.25" style={fill(ACC_L)} />
      <path d="M44 28l14 5v10c0 9-6 14-14 17-8-3-14-8-14-17V33z" style={fill(ACC)} />
      <path d="M37.5 43.5l4.5 4.5 8-9" style={line('#fff', 4.5)} />
    </S>
  ),
  alarm: () => (
    <S>
      <path d="M10 20a14 14 0 0 1 10-12M54 20a14 14 0 0 0-10-12" style={line(ACC, 5)} />
      <path d="M16 54l-5 6M48 54l5 6" style={line(EDGE, 4)} />
      <circle cx="32" cy="35" r="23" style={{ fill: T, stroke: ACC, strokeWidth: 6 }} />
      <path d="M32 35V21" style={line(INK, 4)} />
      <path d="M32 35l9 6" style={line(ACC, 4)} />
      <circle cx="32" cy="35" r="2.8" style={fill(ACC)} />
    </S>
  ),
  stopwatch: () => (
    <S>
      <rect x="24" y="3" width="16" height="7" rx="3.5" style={fill(EDGE)} />
      <path d="M46 14l5-5" style={line(ACC, 5)} />
      <circle cx="32" cy="36" r="23" style={{ fill: T, stroke: ACC, strokeWidth: 6 }} />
      <path d="M32 36L42 24" style={line(INK, 4)} />
      <path d="M32 18v4M32 50v4M14 36h4M46 36h4" style={line(ACC_L, 3)} />
      <circle cx="32" cy="36" r="3" style={fill(ACC)} />
    </S>
  ),
  compass: () => (
    <S>
      <circle cx="32" cy="32" r="26" style={{ fill: T, stroke: ACC, strokeWidth: 6 }} />
      <path d="M43 21l-6 16-16 6 6-16z" style={fill(ACC)} />
      <path d="M43 21l-6 16-10-10z" style={fill(ACC_L)} />
      <circle cx="32" cy="32" r="3" style={fill(INK)} />
    </S>
  ),
  search: () => (
    <S>
      <circle cx="27" cy="27" r="17" style={{ fill: T, stroke: ACC, strokeWidth: 7 }} />
      <path d="M40 40l16 16" style={line(EDGE, 7)} />
    </S>
  ),
};


const MAP = new Map<unknown, string>([
  [L.AlarmClock, 'alarm'],
  [L.Watch, 'stopwatch'],
  [L.Timer, 'timer'],
  [L.Compass, 'compass'],
  [L.LocateFixed, 'compass'],
  [L.MoreHorizontal, 'grid'],
  [L.Camera, 'camera'],
  [L.UserRound, 'users'],
  [L.User, 'users'],
  [L.MailCheck, 'mail'],
  [L.Laptop, 'dashboard'],
  [L.Keyboard, 'file'],
  [L.Volume2, 'bell'],
  [L.Activity, 'chart'],
  [L.BarChart3, 'chart'],
  [L.Bell, 'bell'],
  [L.Building2, 'building'],
  [L.CreditCard, 'card'],
  [L.FileText, 'file'],
  [L.Globe, 'globe'],
  [L.Globe2, 'globe'],
  [L.HardDrive, 'cloud'],
  [L.Headset, 'support'],
  [L.HelpCircle, 'info'],
  [L.History, 'clock'],
  [L.Languages, 'translate'],
  [L.LayoutDashboard, 'dashboard'],
  [L.LayoutTemplate, 'grid'],
  [L.Layers, 'layers'],
  [L.LogOut, 'logout'],
  [L.Orbit, 'zap'],
  [L.Package, 'briefcase'],
  [L.Palette, 'palette'],
  [L.Plug, 'zap'],
  [L.PlusCircle, 'plus'],
  [L.Puzzle, 'puzzle'],
  [L.Settings, 'settings'],
  [L.Settings2, 'settings'],
  [L.ShieldCheck, 'shield'],
  [L.Sparkles, 'sparkles'],
  [L.Stamp, 'tag'],
  [L.Users, 'users'],
  [L.Wallet, 'card'],
  [L.Wand2, 'sparkles'],
  [L.ImageIcon, 'image'],
  [L.Image, 'image'],
  [L.Mail, 'mail'],
  [L.Lock, 'lock'],
  [L.Home, 'home'],
  [L.Sun, 'sun'],
  [L.Moon, 'moon'],
  [L.Info, 'info'],
  [L.Send, 'send'],
  [L.Smartphone, 'phone'],
  [L.Clock, 'clock'],
  [L.MessageSquare, 'chat'],
  [L.MessageCircle, 'chat'],
  [L.Share2, 'send'],
  [L.Rocket, 'zap'],
  [L.Lightbulb, 'sparkles'],
  [L.Gauge, 'timer'],
  [L.Code2, 'file'],
  [L.User, 'users'],
  [L.AlertCircle, 'info'],
  [L.Building, 'building'],
  [L.Bot, 'sparkles'],
]);

type Props = { className?: string; size?: number | string; width?: number | string; height?: number | string; style?: React.CSSProperties } & Record<string, unknown>;
const cache = new Map<unknown, LucideIcon>();

/** Sizes under 16px (size-3, size-3.5, h-3, [12px] …, or a size prop) stay as the plain line icon: a tile that small is just a smudge. */
function tiny(className?: string, size?: number | string): boolean {
  if (size !== undefined && Number(size) < 16) return true;
  if (!className) return false;
  const m = /(?:^|\s)(?:size|h|w)-(?:(\d+(?:\.\d+)?)|\[(\d+)px\])(?=\s|$)/.exec(className);
  if (!m) return false;
  const px = m[2] ? Number(m[2]) : Number(m[1]) * 4;
  return px < 16;
}

/** A drop-in for a lucide icon component: draws its flat illustration as an <svg> (so size classes and  selectors work, like the line icon), or the line icon when there is none. */
export function flat(icon: LucideIcon): LucideIcon {
  const key = MAP.get(icon);
  const art = key ? ART[key] : undefined;
  if (!art) return icon;
  let c = cache.get(icon);
  if (!c) {
    const Line = icon as unknown as ComponentType<Props>;
    const Comp = function FlatNavIcon(props: Props) {
      if (tiny(props.className, props.size)) return <Line {...props} />;
      const w = props.width ?? props.size ?? 24;
      const h = props.height ?? props.size ?? 24;
      return cloneElement(art() as ReactElement<SVGProps<SVGSVGElement>>, { className: props.className, width: w, height: h, style: { flexShrink: 0, ...props.style } });
    };
    c = Comp as unknown as LucideIcon;
    cache.set(icon, c);
  }
  return c;
}

export const hasFlat = (icon: unknown) => MAP.has(icon);

/** The sidebar collapse / expand control: a panel with an accent sidebar strip and a chevron that points the way it will move. */
export function PanelToggleIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true" className={className} style={{ filter: 'drop-shadow(0 0 0.6px rgba(20,10,40,0.55)) drop-shadow(0 2px 4px rgba(20,10,40,0.14))' }}>
      <rect x="4" y="8" width="56" height="48" rx="12" style={{ fill: '#fff' }} />
      <path d="M4 20a12 12 0 0 1 12-12h12v48H16A12 12 0 0 1 4 44z" style={{ fill: PRIMARY }} />
      <path d={open ? 'M21 22l-8 10 8 10' : 'M13 22l8 10-8 10'} fill="none" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: '#fff' }} />
      <rect x="36" y="22" width="16" height="5" rx="2.5" style={{ fill: '#c4c4c4' }} />
      <rect x="36" y="33" width="16" height="5" rx="2.5" style={{ fill: '#c4c4c4' }} />
      <rect x="36" y="44" width="10" height="5" rx="2.5" style={{ fill: '#c4c4c4' }} />
    </svg>
  );
}

/** The flat illustration for a named icon, for places that are not lucide components (like the footer's legal links). */
export function FlatArt({ name, className }: { name: string; className?: string }) {
  const art = ART[name];
  if (!art) return null;
  return cloneElement(art() as ReactElement<SVGProps<SVGSVGElement>>, { className, width: 24, height: 24, style: { flexShrink: 0 } });
}
