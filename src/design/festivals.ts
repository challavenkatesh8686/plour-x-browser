/**
 * Festival Themes: countries, the main festival per country, movable-date rules, country detection and the
 * resolver that decides which festival (if any) is on. Extend by adding a country / festival entry below —
 * nothing else needs to change except a scene in components/seasonal/engine/festivalScenes.ts.
 */
import { INTENSITIES, SPEED_MAX, SPEED_MIN, type Intensity } from './seasons';

export const COUNTRY_CODES = ['IN', 'US', 'GB', 'CA', 'AU', 'JP', 'CN', 'BR', 'MX', 'AE'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export function isCountryCode(v: unknown): v is CountryCode {
  return typeof v === 'string' && (COUNTRY_CODES as readonly string[]).includes(v);
}

/** One entry per distinct look. Several festivals can share a scene. */
export type FestivalSceneId =
  | 'newyear' | 'diwali' | 'holi' | 'christmas' | 'halloween' | 'thanksgiving' | 'cny' | 'lanternfest'
  | 'midautumn' | 'dragonboat' | 'cherry' | 'goldenweek' | 'childrensday' | 'easter' | 'bonfire'
  | 'sankranti' | 'dussehra' | 'ganesh' | 'carnival' | 'muertos' | 'eid' | 'eidadha'
  | 'nationalIN' | 'nationalUS' | 'nationalCA' | 'nationalAU' | 'nationalBR' | 'nationalMX' | 'nationalAE';

/** Movable feasts that follow lunar/lunisolar calendars: peak date per year, "MM-DD". Admins can override any year. */
const LUNAR: Record<string, Record<number, string>> = {
  diwali: { 2025: '10-20', 2026: '11-08', 2027: '10-29', 2028: '10-17', 2029: '11-05', 2030: '10-26' },
  holi: { 2025: '03-14', 2026: '03-04', 2027: '03-22', 2028: '03-11', 2029: '02-28', 2030: '03-20' },
  dussehra: { 2025: '10-02', 2026: '10-20', 2027: '10-09', 2028: '09-28', 2029: '10-17', 2030: '10-06' },
  ganesh: { 2025: '08-27', 2026: '09-14', 2027: '09-04', 2028: '08-23', 2029: '09-11', 2030: '09-01' },
  eidfitr: { 2025: '03-30', 2026: '03-20', 2027: '03-09', 2028: '02-26', 2029: '02-14', 2030: '02-04' },
  eidadha: { 2025: '06-06', 2026: '05-27', 2027: '05-16', 2028: '05-05', 2029: '04-24', 2030: '04-13' },
  cny: { 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03' },
  dragonboat: { 2025: '05-31', 2026: '06-19', 2027: '06-09', 2028: '05-28', 2029: '06-16', 2030: '06-05' },
  midautumn: { 2025: '10-06', 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12' },
};

export type DateRule =
  | { kind: 'fixed'; month: number; day: number }
  | { kind: 'nth'; month: number; weekday: number; n: number }
  | { kind: 'easter'; offset: number }
  | { kind: 'lunar'; table: keyof typeof LUNAR; plus?: number };

export interface FestivalDef {
  id: string;
  label: string;
  emoji: string;
  scene: FestivalSceneId;
  rule: DateRule;
  /** Days before / after the peak date the theme stays on. */
  before: number;
  after: number;
  blurb: string;
}

const fixed = (month: number, day: number): DateRule => ({ kind: 'fixed', month, day });

const NEW_YEAR = (before = 3, after = 2): FestivalDef => ({
  id: 'newyear', label: 'New Year', emoji: '🎆', scene: 'newyear', rule: fixed(1, 1), before, after,
  blurb: 'Fireworks, confetti explosions and sparkling trails.',
});
const CHRISTMAS = (): FestivalDef => ({
  id: 'christmas', label: 'Christmas', emoji: '🎄', scene: 'christmas', rule: fixed(12, 25), before: 7, after: 1,
  blurb: 'Snowfall, twinkling lights and swinging ornaments.',
});
const HALLOWEEN = (): FestivalDef => ({
  id: 'halloween', label: 'Halloween', emoji: '🎃', scene: 'halloween', rule: fixed(10, 31), before: 7, after: 0,
  blurb: 'Flying bats, glowing pumpkins and creeping fog.',
});
const EASTER = (): FestivalDef => ({
  id: 'easter', label: 'Easter', emoji: '🐣', scene: 'easter', rule: { kind: 'easter', offset: 0 }, before: 2, after: 1,
  blurb: 'Pastel eggs drifting down through spring petals.',
});

export interface CountryDef {
  code: CountryCode;
  name: string;
  flag: string;
  festivals: FestivalDef[];
}

export const COUNTRIES: Record<CountryCode, CountryDef> = {
  IN: {
    code: 'IN', name: 'India', flag: '🇮🇳',
    festivals: [
      NEW_YEAR(),
      { id: 'diwali', label: 'Diwali', emoji: '🪔', scene: 'diwali', rule: { kind: 'lunar', table: 'diwali' }, before: 4, after: 3, blurb: 'Fireworks, glowing diyas, rising sparks and smoke.' },
      { id: 'holi', label: 'Holi', emoji: '🎨', scene: 'holi', rule: { kind: 'lunar', table: 'holi' }, before: 2, after: 1, blurb: 'Colour-powder explosions and spreading clouds.' },
      CHRISTMAS(),
      { id: 'sankranti', label: 'Pongal', emoji: '🪁', scene: 'sankranti', rule: fixed(1, 14), before: 1, after: 2, blurb: 'Kites with fluttering tails over a harvest sky.' },
      { id: 'independence', label: 'Independence Day', emoji: '🎉', scene: 'nationalIN', rule: fixed(8, 15), before: 2, after: 1, blurb: 'Tricolour bunting, fireworks and streamers.' },
    ],
  },
  US: {
    code: 'US', name: 'United States', flag: '🇺🇸',
    festivals: [
      NEW_YEAR(), CHRISTMAS(), HALLOWEEN(),
      { id: 'thanksgiving', label: 'Thanksgiving', emoji: '🦃', scene: 'thanksgiving', rule: { kind: 'nth', month: 11, weekday: 4, n: 4 }, before: 4, after: 1, blurb: 'Falling leaves in warm golden light.' },
      { id: 'independence', label: 'Independence Day', emoji: '🎆', scene: 'nationalUS', rule: fixed(7, 4), before: 3, after: 1, blurb: 'Stars-and-stripes bunting and fireworks.' },
      EASTER(),
    ],
  },
  GB: {
    code: 'GB', name: 'United Kingdom', flag: '🇬🇧',
    festivals: [
      NEW_YEAR(), CHRISTMAS(), EASTER(), HALLOWEEN(),
      { id: 'bonfire', label: 'Bonfire Night', emoji: '🔥', scene: 'bonfire', rule: fixed(11, 5), before: 3, after: 1, blurb: 'Bonfire flames, drifting embers and fireworks.' },
    ],
  },
  CA: {
    code: 'CA', name: 'Canada', flag: '🇨🇦',
    festivals: [
      NEW_YEAR(), CHRISTMAS(),
      { id: 'canadaday', label: 'Canada Day', emoji: '🍁', scene: 'nationalCA', rule: fixed(7, 1), before: 3, after: 1, blurb: 'Falling maple leaves, red-and-white bunting, fireworks.' },
      { id: 'thanksgiving', label: 'Thanksgiving', emoji: '🦃', scene: 'thanksgiving', rule: { kind: 'nth', month: 10, weekday: 1, n: 2 }, before: 3, after: 1, blurb: 'Falling leaves in warm golden light.' },
      HALLOWEEN(),
    ],
  },
  AU: {
    code: 'AU', name: 'Australia', flag: '🇦🇺',
    festivals: [
      NEW_YEAR(), CHRISTMAS(),
      { id: 'australiaday', label: 'Australia Day', emoji: '🎉', scene: 'nationalAU', rule: fixed(1, 26), before: 3, after: 1, blurb: 'Blue-and-gold bunting, stars and fireworks.' },
      EASTER(),
    ],
  },
  JP: {
    code: 'JP', name: 'Japan', flag: '🇯🇵',
    festivals: [
      NEW_YEAR(3, 3),
      { id: 'cherry', label: 'Cherry Blossom Festival', emoji: '🌸', scene: 'cherry', rule: fixed(4, 1), before: 7, after: 9, blurb: 'Cherry blossom petals drifting on the breeze.' },
      { id: 'goldenweek', label: 'Golden Week', emoji: '🎏', scene: 'goldenweek', rule: fixed(5, 1), before: 2, after: 3, blurb: 'Carp streamers over fresh spring petals.' },
      { id: 'childrensday', label: "Children's Day", emoji: '🎏', scene: 'childrensday', rule: fixed(5, 5), before: 1, after: 1, blurb: 'Koinobori carp streamers swimming in the wind.' },
    ],
  },
  CN: {
    code: 'CN', name: 'China', flag: '🇨🇳',
    festivals: [
      { id: 'cny', label: 'Chinese New Year', emoji: '🧧', scene: 'cny', rule: { kind: 'lunar', table: 'cny' }, before: 3, after: 8, blurb: 'Swaying lanterns, a dancing dragon and fireworks.' },
      { id: 'lantern', label: 'Lantern Festival', emoji: '🏮', scene: 'lanternfest', rule: { kind: 'lunar', table: 'cny', plus: 14 }, before: 1, after: 1, blurb: 'Hanging lanterns and sky lanterns floating up.' },
      { id: 'dragonboat', label: 'Dragon Boat Festival', emoji: '🐉', scene: 'dragonboat', rule: { kind: 'lunar', table: 'dragonboat' }, before: 3, after: 1, blurb: 'Dragon boats racing over rolling water.' },
      { id: 'midautumn', label: 'Mid-Autumn Festival', emoji: '🥮', scene: 'midautumn', rule: { kind: 'lunar', table: 'midautumn' }, before: 3, after: 2, blurb: 'A huge harvest moon, rising lanterns, golden blossoms.' },
    ],
  },
  BR: {
    code: 'BR', name: 'Brazil', flag: '🇧🇷',
    festivals: [
      { id: 'carnival', label: 'Carnival', emoji: '🎭', scene: 'carnival', rule: { kind: 'easter', offset: -47 }, before: 4, after: 0, blurb: 'Confetti, streamers and samba-coloured fireworks.' },
      NEW_YEAR(), CHRISTMAS(),
      { id: 'independence', label: 'Independence Day', emoji: '🎉', scene: 'nationalBR', rule: fixed(9, 7), before: 2, after: 1, blurb: 'Green-and-yellow bunting and fireworks.' },
    ],
  },
  MX: {
    code: 'MX', name: 'Mexico', flag: '🇲🇽',
    festivals: [
      NEW_YEAR(), CHRISTMAS(),
      { id: 'muertos', label: 'Día de los Muertos', emoji: '💀', scene: 'muertos', rule: fixed(11, 1), before: 2, after: 2, blurb: 'Marigold petals, papel picado and flickering candles.' },
      { id: 'independence', label: 'Independence Day', emoji: '🎉', scene: 'nationalMX', rule: fixed(9, 16), before: 2, after: 1, blurb: 'Green-white-red bunting and fireworks.' },
    ],
  },
  AE: {
    code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪',
    festivals: [
      NEW_YEAR(),
      { id: 'eidfitr', label: 'Eid al-Fitr', emoji: '🌙', scene: 'eid', rule: { kind: 'lunar', table: 'eidfitr' }, before: 2, after: 3, blurb: 'Crescent moon, glowing fanous lanterns and golden sparkle.' },
      { id: 'eidadha', label: 'Eid al-Adha', emoji: '🌙', scene: 'eidadha', rule: { kind: 'lunar', table: 'eidadha' }, before: 2, after: 3, blurb: 'Crescent moon, glowing fanous lanterns and golden sparkle.' },
      { id: 'nationalday', label: 'UAE National Day', emoji: '🎉', scene: 'nationalAE', rule: fixed(12, 2), before: 3, after: 1, blurb: 'Red-green-white-black bunting and fireworks.' },
    ],
  },
};

export const festivalKey = (cc: CountryCode, id: string) => `${cc}:${id}`;

export function findFestival(key: string): { country: CountryCode; def: FestivalDef } | null {
  const [cc, id] = key.split(':');
  if (!isCountryCode(cc)) return null;
  const def = COUNTRIES[cc].festivals.find((f) => f.id === id);
  return def ? { country: cc, def } : null;
}

/* ------------------------------------------------------------------ dates */

const DAY = 86400000;
const atNoon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY);
const pad = (n: number) => String(n).padStart(2, '0');
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Western Easter Sunday (anonymous Gregorian algorithm). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return atNoon(year, month, day);
}

/** Peak date of a festival in a given year, or null if the calendar data doesn't cover that year. */
export function peakDate(cc: CountryCode, def: FestivalDef, year: number, overrides: Record<string, string>): Date | null {
  const ov = overrides[`${cc}:${def.id}:${year}`];
  if (ov && /^\d{4}-\d{2}-\d{2}$/.test(ov)) {
    const [y, m, d] = ov.split('-').map(Number);
    return atNoon(y, m, d);
  }
  const r = def.rule;
  switch (r.kind) {
    case 'fixed':
      return atNoon(year, r.month, r.day);
    case 'nth': {
      const first = new Date(year, r.month - 1, 1).getDay();
      return atNoon(year, r.month, 1 + ((r.weekday - first + 7) % 7) + (r.n - 1) * 7);
    }
    case 'easter': {
      const e = easterSunday(year);
      return atNoon(year, e.getMonth() + 1, e.getDate() + r.offset);
    }
    case 'lunar': {
      const md = LUNAR[r.table]?.[year];
      if (!md) return null;
      const [m, d] = md.split('-').map(Number);
      return atNoon(year, m, d + (r.plus ?? 0));
    }
  }
}

/** The next peak on/after (today − `after`) — what the admin calendar shows. */
export function upcomingPeak(cc: CountryCode, def: FestivalDef, from: Date, overrides: Record<string, string>): Date | null {
  for (const y of [from.getFullYear(), from.getFullYear() + 1]) {
    const p = peakDate(cc, def, y, overrides);
    if (p && dayDiff(p, from) >= -def.after) return p;
  }
  return null;
}

/* ------------------------------------------------------------------ config */

export interface FestivalConfig {
  enabled: boolean;
  /** auto = detect each visitor's country; manual = one country for everyone. */
  countryMode: 'auto' | 'manual';
  country: CountryCode;
  /** auto = by calendar; manual = always show `manualFestival`. */
  festivalMode: 'auto' | 'manual';
  /** "CC:id" */
  manualFestival: string;
  /** "CC:id" entries the admin switched off. */
  disabled: string[];
  /** "CC:id:YYYY" → "YYYY-MM-DD" admin-set peak date. */
  dateOverrides: Record<string, string>;
  /** "CC:id:YYYY" → admin-set start/end dates (inclusive) for that year's run. */
  ranges: Record<string, { start: string; end: string }>;
  /** "CC:id" → admin-set run length in days before/after the peak. Applies to every year, so it rolls forward by itself. */
  windows: Record<string, { before: number; after: number }>;
  animations: boolean;
  intensity: Intensity;
  speed: number;
}

export const DEFAULT_FESTIVAL_CONFIG: FestivalConfig = {
  enabled: false,
  countryMode: 'auto',
  country: 'IN',
  festivalMode: 'auto',
  manualFestival: 'IN:diwali',
  disabled: [],
  dateOverrides: {},
  ranges: {},
  windows: {},
  animations: true,
  intensity: 'medium',
  speed: 1,
};

export function parseFestivalConfig(raw: unknown): FestivalConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_FESTIVAL_CONFIG;
  const r = raw as Record<string, unknown>;
  const overrides: Record<string, string> = {};
  const ranges: Record<string, { start: string; end: string }> = {};
  const windows: Record<string, { before: number; after: number }> = {};
  if (r.windows && typeof r.windows === 'object') {
    for (const [k, v] of Object.entries(r.windows as Record<string, unknown>)) {
      const w = v as { before?: unknown; after?: unknown } | null;
      const ok = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= -30 && n <= 365;
      if (w && ok(w.before) && ok(w.after) && /^[A-Z]{2}:[a-z]+$/.test(k) && -w.before <= w.after) windows[k] = { before: w.before, after: w.after };
    }
  }
  if (r.ranges && typeof r.ranges === 'object') {
    for (const [k, v] of Object.entries(r.ranges as Record<string, unknown>)) {
      const rv = v as { start?: unknown; end?: unknown } | null;
      if (rv && typeof rv.start === 'string' && typeof rv.end === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rv.start) && /^\d{4}-\d{2}-\d{2}$/.test(rv.end) && /^[A-Z]{2}:[a-z]+:\d{4}$/.test(k) && rv.start <= rv.end) ranges[k] = { start: rv.start, end: rv.end };
    }
  }
  if (r.dateOverrides && typeof r.dateOverrides === 'object') {
    for (const [k, v] of Object.entries(r.dateOverrides as Record<string, unknown>)) {
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && /^[A-Z]{2}:[a-z]+:\d{4}$/.test(k)) overrides[k] = v;
    }
  }
  return {
    enabled: r.enabled === true,
    countryMode: r.countryMode === 'manual' ? 'manual' : 'auto',
    country: isCountryCode(r.country) ? r.country : 'IN',
    festivalMode: r.festivalMode === 'manual' ? 'manual' : 'auto',
    manualFestival: typeof r.manualFestival === 'string' && findFestival(r.manualFestival) ? r.manualFestival : 'IN:diwali',
    disabled: Array.isArray(r.disabled) ? r.disabled.filter((x): x is string => typeof x === 'string' && !!findFestival(x)) : [],
    dateOverrides: overrides,
    ranges,
    windows,
    animations: r.animations !== false,
    intensity: INTENSITIES.includes(r.intensity as Intensity) ? (r.intensity as Intensity) : 'medium',
    speed: typeof r.speed === 'number' && Number.isFinite(r.speed) ? Math.min(SPEED_MAX, Math.max(SPEED_MIN, r.speed)) : 1,
  };
}

/* ------------------------------------------------------------------ detection */

const TZ_COUNTRY: Array<[RegExp, CountryCode]> = [
  [/^Asia\/(Kolkata|Calcutta)$/, 'IN'], [/^Europe\/London$/, 'GB'], [/^Europe\/Belfast$/, 'GB'],
  [/^Asia\/Tokyo$/, 'JP'], [/^Asia\/(Shanghai|Chongqing|Harbin|Urumqi)$/, 'CN'], [/^Asia\/Dubai$/, 'AE'],
  [/^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Manaus|Belem)$/, 'BR'],
  [/^America\/(Mexico_City|Monterrey|Cancun|Merida|Tijuana|Hermosillo|Chihuahua)$/, 'MX'],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina)$/, 'CA'],
  [/^Australia\//, 'AU'],
  [/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise)|Pacific\/Honolulu)$/, 'US'],
];

/** Best-effort, on-device (no network, no personal data leaves the browser): time zone first, then language region. */
export function detectCountry(): CountryCode | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    for (const [re, cc] of TZ_COUNTRY) if (re.test(tz)) return cc;
  } catch {
    // ignore
  }
  try {
    for (const lang of navigator.languages ?? [navigator.language]) {
      const region = lang.split('-')[1]?.toUpperCase();
      const cc = region === 'UK' ? 'GB' : region;
      if (isCountryCode(cc)) return cc;
    }
  } catch {
    // ignore
  }
  return null;
}

/* ------------------------------------------------------------------ resolver */

export interface ActiveFestival {
  key: string;
  country: CountryCode;
  def: FestivalDef;
}

/** Country whose calendar applies to this visitor right now. */
export function effectiveCountry(config: FestivalConfig, detected: CountryCode | null): CountryCode | null {
  return config.countryMode === 'manual' ? config.country : detected;
}

const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return atNoon(y, m, d);
};

/** Inclusive run of a festival in a given year: a year-specific admin range if set, else the admin's yearly window (days around the peak), else the calendar default. */
export function festivalWindow(cc: CountryCode, def: FestivalDef, year: number, config: FestivalConfig): { start: Date; end: Date; custom: boolean } | null {
  const r = config.ranges[`${cc}:${def.id}:${year}`];
  if (r) return { start: parseIso(r.start), end: parseIso(r.end), custom: true };
  const p = peakDate(cc, def, year, config.dateOverrides);
  if (!p) return null;
  const w = config.windows[`${cc}:${def.id}`];
  const before = w ? w.before : def.before;
  const after = w ? w.after : def.after;
  return { start: atNoon(year, p.getMonth() + 1, p.getDate() - before), end: atNoon(year, p.getMonth() + 1, p.getDate() + after), custom: !!w };
}

/** Festival whose window contains `date` (latest start wins on overlap), honouring the admin's disables and date ranges. */
export function festivalForDate(cc: CountryCode, date: Date, config: FestivalConfig): ActiveFestival | null {
  let best: { f: FestivalDef; start: number } | null = null;
  for (const f of COUNTRIES[cc].festivals) {
    if (config.disabled.includes(festivalKey(cc, f.id))) continue;
    for (const y of [date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1]) {
      const w = festivalWindow(cc, f, y, config);
      if (!w) continue;
      if (dayDiff(date, w.start) >= 0 && dayDiff(w.end, date) >= 0) {
        const start = w.start.getTime();
        if (!best || start > best.start) best = { f, start };
      }
    }
  }
  return best ? { key: festivalKey(cc, best.f.id), country: cc, def: best.f } : null;
}

/** What visitors see, or null for no festival. Pure so the site and the admin preview can't disagree. */
export function resolveActiveFestival(config: FestivalConfig, detected: CountryCode | null, date: Date): ActiveFestival | null {
  if (!config.enabled) return null;
  if (config.festivalMode === 'manual') {
    const m = findFestival(config.manualFestival);
    return m ? { key: config.manualFestival, country: m.country, def: m.def } : null;
  }
  const cc = effectiveCountry(config, detected);
  return cc ? festivalForDate(cc, date, config) : null;
}
