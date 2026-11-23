/** Seasonal Themes: season catalogue, regional calendars and the automatic season resolver. */

export const SEASON_IDS = ['spring', 'summer', 'monsoon', 'autumn', 'prewinter', 'winter'] as const;
export type SeasonId = (typeof SEASON_IDS)[number];

export function isSeasonId(value: unknown): value is SeasonId {
  return typeof value === 'string' && (SEASON_IDS as readonly string[]).includes(value);
}

export interface SeasonMeta {
  id: SeasonId;
  label: string;
  emoji: string;
  blurb: string;
}

export const SEASONS: Record<SeasonId, SeasonMeta> = {
  spring: { id: 'spring', label: 'Spring', emoji: '🌸', blurb: 'Drifting petals, soft pink and fresh green.' },
  summer: { id: 'summer', label: 'Summer', emoji: '☀️', blurb: 'Warm sunlight, glowing motes and golden heat.' },
  monsoon: { id: 'monsoon', label: 'Monsoon', emoji: '🌧️', blurb: 'Light rainfall under slow-moving clouds.' },
  autumn: { id: 'autumn', label: 'Autumn', emoji: '🍂', blurb: 'Falling amber leaves on warm gold.' },
  prewinter: { id: 'prewinter', label: 'Pre-Winter', emoji: '🍁', blurb: 'Cold breeze, frost particles and silver mist.' },
  winter: { id: 'winter', label: 'Winter', emoji: '❄️', blurb: 'Gentle snowfall on frosted icy blue.' },
};

export const SEASON_LIST: SeasonMeta[] = SEASON_IDS.map((id) => SEASONS[id]);

/** Each season begins on its MM-DD start and lasts until the next season's start (wrapping over New Year). */
export type SeasonStarts = Record<SeasonId, string>;

/** 'auto' picks the regional calendar from each visitor's country (see COUNTRY_CALENDAR). */
export type CalendarId = 'auto' | 'northern' | 'southern' | 'south-asia' | 'custom';

export type PresetCalendarId = Exclude<CalendarId, 'auto' | 'custom'>;

export const CALENDAR_PRESETS: Record<PresetCalendarId, { label: string; starts: SeasonStarts }> = {
  northern: {
    label: 'Northern Hemisphere (default)',
    starts: { spring: '03-01', summer: '06-01', monsoon: '07-15', autumn: '09-23', prewinter: '11-10', winter: '12-21' },
  },
  southern: {
    label: 'Southern Hemisphere',
    starts: { spring: '09-01', summer: '12-01', monsoon: '01-15', autumn: '03-21', prewinter: '05-10', winter: '06-21' },
  },
  'south-asia': {
    label: 'South Asia',
    starts: { spring: '02-01', summer: '04-01', monsoon: '06-15', autumn: '09-30', prewinter: '11-01', winter: '12-15' },
  },
};

export const CALENDAR_IDS: CalendarId[] = ['auto', 'northern', 'southern', 'south-asia', 'custom'];

/** Countries whose seasons differ from the Northern default. Anything not listed (US, GB, CA, JP, CN, MX, AE…) uses Northern. */
export const COUNTRY_CALENDAR: Record<string, PresetCalendarId> = { IN: 'south-asia', AU: 'southern', BR: 'southern' };

export function calendarForCountry(country: string | null | undefined): PresetCalendarId {
  return (country && COUNTRY_CALENDAR[country]) || 'northern';
}

/** Season start dates that apply to a visitor: their country's calendar in 'auto' mode, otherwise the admin's choice. */
export function startsFor(config: Pick<SeasonalConfig, 'calendarId' | 'starts'>, country: string | null | undefined): SeasonStarts {
  if (config.calendarId === 'auto') return CALENDAR_PRESETS[calendarForCountry(country)].starts;
  if (config.calendarId === 'custom') return config.starts;
  return CALENDAR_PRESETS[config.calendarId].starts;
}

export const INTENSITIES = ['low', 'medium', 'high'] as const;
export type Intensity = (typeof INTENSITIES)[number];
/** Particle-count multiplier per intensity level. */
export const INTENSITY_FACTOR: Record<Intensity, number> = { low: 0.5, medium: 1, high: 1.7 };
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2;

export interface SeasonalConfig {
  enabled: boolean;
  mode: 'auto' | 'manual';
  manualSeason: SeasonId;
  /** false keeps the seasonal backgrounds but turns every animation off. */
  animations: boolean;
  /** Low / Medium / High amount of particles. */
  intensity: Intensity;
  /** Animation speed multiplier, 0.5x – 2x. */
  speed: number;
  calendarId: CalendarId;
  starts: SeasonStarts;
}

export const DEFAULT_SEASONAL_CONFIG: SeasonalConfig = {
  enabled: false,
  mode: 'auto',
  manualSeason: 'spring',
  animations: true,
  intensity: 'medium',
  speed: 1,
  calendarId: 'auto',
  starts: { ...CALENDAR_PRESETS.northern.starts },
};

const MM_DD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function dayKey(mmdd: string): number {
  return Number(mmdd.slice(0, 2)) * 100 + Number(mmdd.slice(3, 5));
}

/** Validates untrusted jsonb from the database; anything malformed falls back to the safe defaults. */
export function parseSeasonalConfig(raw: unknown): SeasonalConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_SEASONAL_CONFIG;
  const r = raw as Record<string, unknown>;
  const calendarId = CALENDAR_IDS.includes(r.calendarId as CalendarId) ? (r.calendarId as CalendarId) : 'northern';
  const base = calendarId === 'custom' || calendarId === 'auto' ? CALENDAR_PRESETS.northern.starts : CALENDAR_PRESETS[calendarId].starts;
  const starts = { ...base };
  if (calendarId === 'custom' && r.starts && typeof r.starts === 'object') {
    for (const id of SEASON_IDS) {
      const v = (r.starts as Record<string, unknown>)[id];
      if (typeof v === 'string' && MM_DD.test(v)) starts[id] = v;
    }
  }
  return {
    enabled: r.enabled === true,
    mode: r.mode === 'manual' ? 'manual' : 'auto',
    manualSeason: isSeasonId(r.manualSeason) ? r.manualSeason : 'spring',
    animations: r.animations !== false,
    intensity: INTENSITIES.includes(r.intensity as Intensity) ? (r.intensity as Intensity) : 'medium',
    speed: typeof r.speed === 'number' && Number.isFinite(r.speed) ? Math.min(SPEED_MAX, Math.max(SPEED_MIN, r.speed)) : 1,
    calendarId,
    starts,
  };
}

/** Season whose start is the latest one on/before `date`; before the first start of the year, the last season wraps in. */
export function resolveSeasonForDate(starts: SeasonStarts, date: Date): SeasonId {
  const today = (date.getMonth() + 1) * 100 + date.getDate();
  const ordered = [...SEASON_IDS].sort((a, b) => dayKey(starts[a]) - dayKey(starts[b]));
  let current = ordered[ordered.length - 1];
  for (const id of ordered) {
    if (dayKey(starts[id]) <= today) current = id;
  }
  return current;
}

/** The season actually shown, or null when Seasonal Themes are off. Pure, so the site and admin always agree. */
export function resolveActiveSeason(config: SeasonalConfig, date: Date, country?: string | null): SeasonId | null {
  if (!config.enabled) return null;
  return config.mode === 'manual' ? config.manualSeason : resolveSeasonForDate(startsFor(config, country), date);
}

/** True when two seasons would start on the same day (the later one would never show). */
export function hasDuplicateStarts(starts: SeasonStarts): boolean {
  return new Set(SEASON_IDS.map((id) => starts[id])).size !== SEASON_IDS.length;
}
