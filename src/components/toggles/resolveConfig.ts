import type { CSSProperties } from 'react';
import { TOGGLE_LIMITS, type ToggleConfig, type ToggleId } from './types';

export const TOGGLE_SIZE_PRESETS = {
  small: { width: 36, height: 20 },
  medium: { width: 48, height: 26 },
  large: { width: 64, height: 34 },
} as const;

/** Designs that are naturally wider than the plain pill get their preset width scaled. */
const WIDTH_FACTOR: Partial<Record<ToggleId, number>> = { pill: 1.3, label: 1.55, segmented: 1.7, square: 1.1 };

/** Built-in per-design defaults (below the global default config and per-toggle overrides). */
const DESIGN_DEFAULTS: Partial<Record<ToggleId, ToggleConfig>> = {
  material: { showIcon: true },
  flip: { showIcon: true },
  icon: { showIcon: true },
  square: { showIcon: true },
  'plourx-signature': { showIcon: true },
  label: { showLabel: true, onLabel: 'ON', offLabel: 'OFF' },
  segmented: { showLabel: true, onLabel: 'On', offLabel: 'Off' },
};

const DEFAULT_GRADIENT = { from: '#d0308a', to: '#7c3aed', angle: 135 };

const BUILTIN: ToggleConfig = {
  size: 'medium',
  appearance: 'auto',
  glow: 0.6,
  shadow: 0.5,
  speed: 1,
  animation: 'slide',
  direction: 'normal',
  showLabel: false,
  showIcon: false,
  onLabel: 'On',
  offLabel: 'Off',
  gradient: DEFAULT_GRADIENT,
};

export interface ResolvedToggleConfig extends ToggleConfig {
  size: NonNullable<ToggleConfig['size']>;
  width: number;
  height: number;
  appearance: NonNullable<ToggleConfig['appearance']>;
  glow: number;
  shadow: number;
  speed: number;
  animation: NonNullable<ToggleConfig['animation']>;
  direction: NonNullable<ToggleConfig['direction']>;
  showLabel: boolean;
  showIcon: boolean;
  onLabel: string;
  offLabel: string;
  gradient: NonNullable<ToggleConfig['gradient']>;
}

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const color = (v: unknown): string | undefined => (typeof v === 'string' && HEX.test(v) ? v : undefined);

/** Shallow merge that ignores undefined values, so a later layer never erases an earlier one by omission. */
function layer(...parts: Array<ToggleConfig | undefined>): ToggleConfig {
  const out: Record<string, unknown> = {};
  for (const p of parts) {
    if (!p) continue;
    for (const [k, v] of Object.entries(p)) if (v !== undefined) out[k] = v;
  }
  return out as ToggleConfig;
}

/**
 * Merge order: built-in defaults < design defaults < global default config < per-design admin config < per-toggle override.
 * Numbers are clamped and colours validated (invalid ones are dropped). width/height apply only when size is 'custom'.
 */
export function resolveToggleConfig(type: ToggleId, defaults?: ToggleConfig, perType?: ToggleConfig, override?: ToggleConfig): ResolvedToggleConfig {
  const m = layer(BUILTIN, DESIGN_DEFAULTS[type], defaults, perType, override);
  const size = m.size ?? 'medium';
  let width: number;
  let height: number;
  if (size === 'custom') {
    width = clamp(num(m.width) ?? TOGGLE_SIZE_PRESETS.medium.width, ...TOGGLE_LIMITS.width);
    height = clamp(num(m.height) ?? TOGGLE_SIZE_PRESETS.medium.height, ...TOGGLE_LIMITS.height);
  } else {
    const p = TOGGLE_SIZE_PRESETS[size];
    width = Math.round(p.width * (WIDTH_FACTOR[type] ?? 1));
    height = p.height;
  }
  const g = m.gradient;
  const gradient = g && color(g.from) && color(g.to) && num(g.angle) !== undefined ? { from: g.from, to: g.to, angle: g.angle } : DEFAULT_GRADIENT;
  const thumb = num(m.thumbSize);
  const radius = num(m.radius);
  const thick = num(m.trackThickness);
  return {
    ...m,
    size,
    width,
    height,
    thumbSize: thumb === undefined ? undefined : clamp(thumb, 4, 240),
    radius: radius === undefined ? undefined : clamp(radius, 0, 120),
    trackThickness: thick === undefined ? undefined : clamp(thick, 1, 120),
    onColor: color(m.onColor),
    offColor: color(m.offColor),
    thumbColor: color(m.thumbColor),
    accent: color(m.accent),
    borderColor: color(m.borderColor),
    background: color(m.background),
    gradient,
    appearance: m.appearance ?? 'auto',
    glow: clamp(num(m.glow) ?? 0.6, ...TOGGLE_LIMITS.glow),
    shadow: clamp(num(m.shadow) ?? 0.5, ...TOGGLE_LIMITS.shadow),
    speed: clamp(num(m.speed) ?? 1, ...TOGGLE_LIMITS.speed),
    animation: m.animation ?? 'slide',
    direction: m.direction ?? 'normal',
    showLabel: m.showLabel ?? false,
    showIcon: m.showIcon ?? false,
    onLabel: m.onLabel ?? 'On',
    offLabel: m.offLabel ?? 'Off',
  };
}

const EASING: Record<NonNullable<ToggleConfig['easing']>, string> = {
  ease: 'ease',
  'ease-in-out': 'ease-in-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
};

/** Inline CSS variables consumed by toggles.css. Only explicitly configured values are emitted; the rest fall back to per-design CSS. */
export function toggleCssVars(c: ResolvedToggleConfig): CSSProperties {
  const v: Record<string, string> = {
    '--tg-w': `${c.width}px`,
    '--tg-h': `${c.height}px`,
    '--tg-glow': String(c.glow),
    '--tg-shadow': String(c.shadow),
    '--tg-speed': String(c.speed),
    '--tg-grad': `linear-gradient(${c.gradient.angle}deg, ${c.gradient.from}, ${c.gradient.to})`,
  };
  const set = (k: string, x: string | number | undefined, unit = '') => {
    if (x !== undefined) v[k] = `${x}${unit}`;
  };
  set('--tg-thumb', c.thumbSize, 'px');
  set('--tg-r', c.radius, 'px');
  set('--tg-th', c.trackThickness, 'px');
  set('--tg-on', c.onColor);
  set('--tg-off', c.offColor);
  set('--tg-thumbc', c.thumbColor);
  set('--tg-accent', c.accent);
  set('--tg-border', c.borderColor);
  set('--tg-bg', c.background);
  if (c.easing) v['--tg-ease'] = EASING[c.easing];
  return v as CSSProperties;
}
