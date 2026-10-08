/** Custom accent colour: shared by every PlourX app (same storage keys, same colour maths). */
export const ACCENT_CUSTOM_KEY = 'plourx:accent-custom'
export const DEFAULT_CUSTOM_COLOR = '#e8489e'

export type Hsv = { h: number; s: number; v: number }

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Returns a normalised "#rrggbb" string, or null when the input is not a valid hex colour. */
export function normalizeHex(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null
  const m = HEX_RE.exec(input.trim())
  if (!m) return null
  let h = m[1].toLowerCase()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return '#' + h
}

export function hexToHsv(hex: string): Hsv {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max ? d / max : 0, v: max }
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return '#' + to(f(5)) + to(f(3)) + to(f(1))
}

export function readCustomHex(): string {
  try {
    return normalizeHex(localStorage.getItem(ACCENT_CUSTOM_KEY) ?? '') ?? DEFAULT_CUSTOM_COLOR
  } catch {
    return DEFAULT_CUSTOM_COLOR
  }
}

export function writeCustomHex(hex: string) {
  try {
    localStorage.setItem(ACCENT_CUSTOM_KEY, hex)
  } catch {
    /* storage unavailable */
  }
}

/** Every accent token any PlourX app uses; setting ones an app does not read is harmless. */
const TOKENS = [
  '--color-primary', '--color-primary-hover', '--primary-rgb',
  '--px-accent', '--px-accent-strong', '--px-accent-rgb', '--px-accent-bg', '--px-accent-border', '--px-accent-gradient',
  '--accent', '--accent-strong', '--accent-tint-10', '--accent-tint-15', '--accent-tint-50',
  '--accent-primary', '--accent-primary-hover', '--gradient-brand-soft', '--gradient-text',
  '--plourx-primary', '--plourx-primary-strong', '--plourx-primary-soft', '--plourx-primary-glow',
]

/** Sets (hex) or clears (null) the inline accent tokens on <html>. Inline values beat the [data-accent] CSS blocks. */
export function applyCustomAccent(hex: string | null) {
  const style = document.documentElement.style
  if (!hex) {
    TOKENS.forEach((t) => style.removeProperty(t))
    return
  }
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * 0.22)
  const strong = '#' + [mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')
  const rgb = `${r}, ${g}, ${b}`
  const set: Record<string, string> = {
    '--color-primary': hex, '--color-primary-hover': strong, '--primary-rgb': rgb,
    '--px-accent': hex, '--px-accent-strong': strong, '--px-accent-rgb': rgb,
    '--px-accent-bg': `rgba(${rgb}, 0.14)`, '--px-accent-border': `rgba(${rgb}, 0.35)`,
    '--px-accent-gradient': `linear-gradient(135deg, ${strong} 0%, ${hex} 100%)`,
    '--accent': hex, '--accent-strong': strong,
    '--accent-tint-10': `rgba(${rgb}, 0.1)`, '--accent-tint-15': `rgba(${rgb}, 0.15)`, '--accent-tint-50': `rgba(${rgb}, 0.5)`,
    '--accent-primary': hex, '--accent-primary-hover': strong,
    '--gradient-brand-soft': `linear-gradient(135deg, rgba(${rgb}, 0.16) 0%, rgba(${rgb}, 0.06) 100%)`,
    '--gradient-text': `linear-gradient(135deg, ${strong} 0%, ${strong} 60%, ${hex} 100%)`,
    '--plourx-primary': hex, '--plourx-primary-strong': strong,
    '--plourx-primary-soft': `rgba(${rgb}, 0.15)`, '--plourx-primary-glow': `rgba(${rgb}, 0.4)`,
  }
  for (const k of TOKENS) style.setProperty(k, set[k])
}

const LABELS = {
  en: { custom: 'Custom color', title: 'Choose a custom color', hue: 'Hue', preview: 'Preview', apply: 'Apply', cancel: 'Cancel' },
  hi: { custom: 'कस्टम रंग', title: 'कस्टम रंग चुनें', hue: 'ह्यू', preview: 'पूर्वावलोकन', apply: 'लागू करें', cancel: 'रद्द करें' },
  te: { custom: 'కస్టమ్ రంగు', title: 'కస్టమ్ రంగును ఎంచుకోండి', hue: 'హ్యూ', preview: 'ప్రివ్యూ', apply: 'వర్తింపజేయి', cancel: 'రద్దు చేయి' },
}

export function accentLabels() {
  let code = 'en'
  try {
    code = localStorage.getItem('plourx:site-language') ?? 'en'
  } catch {
    /* default */
  }
  return LABELS[code as keyof typeof LABELS] ?? LABELS.en
}
