export interface FontOption {
  label: string;
  /** CSS font-family value. 'default' resets to the browser's own system stack (--px-sans's value as authored in theme.css) and loads no external font. */
  value: string;
  /** Google Fonts family name used to build the stylesheet URL -- absent for the default system option, which needs no network fetch. */
  googleFont?: string;
}

/**
 * A curated subset of Google Fonts (not the full ~50-entry list plour-x-music
 * offers) -- enough real choice for the browser's chrome UI without
 * maintaining a large duplicate catalog here.
 */
export const FONT_OPTIONS: FontOption[] = [
  { label: 'Default', value: 'default' },
  { label: 'Inter', value: "'Inter', sans-serif", googleFont: 'Inter' },
  { label: 'Roboto', value: "'Roboto', sans-serif", googleFont: 'Roboto' },
  { label: 'Open Sans', value: "'Open Sans', sans-serif", googleFont: 'Open Sans' },
  { label: 'Lato', value: "'Lato', sans-serif", googleFont: 'Lato' },
  { label: 'Poppins', value: "'Poppins', sans-serif", googleFont: 'Poppins' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif", googleFont: 'Montserrat' },
  { label: 'Nunito', value: "'Nunito', sans-serif", googleFont: 'Nunito' },
  { label: 'Source Sans 3', value: "'Source Sans 3', sans-serif", googleFont: 'Source Sans 3' },
  { label: 'Work Sans', value: "'Work Sans', sans-serif", googleFont: 'Work Sans' },
  { label: 'Rubik', value: "'Rubik', sans-serif", googleFont: 'Rubik' },
  { label: 'Quicksand', value: "'Quicksand', sans-serif", googleFont: 'Quicksand' },
  { label: 'Merriweather', value: "'Merriweather', serif", googleFont: 'Merriweather' },
  { label: 'Playfair Display', value: "'Playfair Display', serif", googleFont: 'Playfair Display' },
  { label: 'Fira Code', value: "'Fira Code', monospace", googleFont: 'Fira Code' },
];

export const FONT_WEIGHTS = ['400', '500', '600', '700'] as const;
export const FONT_SIZES = ['14px', '16px', '18px', '20px'] as const;
export const TEXT_CASES = ['none', 'uppercase', 'capitalize', 'lowercase'] as const;

export const FONT_WEIGHT_LABELS: Record<(typeof FONT_WEIGHTS)[number], string> = {
  '400': 'Regular',
  '500': 'Medium',
  '600': 'Semibold',
  '700': 'Bold',
};

export const TEXT_CASE_LABELS: Record<(typeof TEXT_CASES)[number], string> = {
  none: 'Default',
  uppercase: 'UPPERCASE',
  capitalize: 'Capitalize',
  lowercase: 'lowercase',
};
