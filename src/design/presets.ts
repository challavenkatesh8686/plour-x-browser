export type MorphismId =
  | 'plourx-original'
  | 'modern-skeuomorphism'
  | 'neumorphism'
  | 'glassmorphism'
  | 'claymorphism'
  | 'tactile-skeuomorphism'
  | '3d'
  | 'minimal'
  | 'futuristic-cyber'
  | 'material';

export interface MorphismPreset {
  id: MorphismId;
  label: string;
  description: string;
  /** What this preset actually changes — shown in the Theme Presets gallery. */
  effects: string[];
}

export const MORPHISM_PRESETS: MorphismPreset[] = [
  {
    id: 'plourx-original',
    label: 'PlourX Original',
    description: "Today's PlourX look — layered dark surfaces, soft glow, no extra effects.",
    effects: ['Layered surfaces', 'Soft outer shadow', 'Brand glow on accents'],
  },
  {
    id: 'modern-skeuomorphism',
    label: 'Modern Skeuomorphism',
    description: 'Subtle depth and gradient sheen on every surface, without heavy realism.',
    effects: ['Gradient surfaces', 'Soft outer + inner shadow', 'Elevated cards'],
  },
  {
    id: 'neumorphism',
    label: 'Neumorphism',
    description: 'Soft, same-tone surfaces that look pressed into or extruded from the background.',
    effects: ['Low-contrast borders', 'Dual soft shadows', 'Rounded, uniform surfaces'],
  },
  {
    id: 'glassmorphism',
    label: 'Glassmorphism',
    description: 'Frosted, translucent panels with a soft blur over the background.',
    effects: ['Translucent surfaces', 'Backdrop blur', 'Thin light border'],
  },
  {
    id: 'claymorphism',
    label: 'Claymorphism',
    description: 'Thick, soft, rounded shapes with a puffy inset + outset shadow combo.',
    effects: ['Extra-large radius', 'Inset + outset shadow', 'Saturated soft accent'],
  },
  {
    id: 'tactile-skeuomorphism',
    label: 'Tactile Skeuomorphism',
    description: 'Physical, pressable surfaces with a clear pressed state on interaction.',
    effects: ['Directional shadow', 'Top-highlight sheen', 'Pressed inset state on click'],
  },
  {
    id: '3d',
    label: '3D',
    description: 'Pronounced elevation and depth, with surfaces lifting further on hover.',
    effects: ['Deep layered shadow', 'Hover lift', 'Accent glow'],
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Flat surfaces, thin borders, near-zero shadow — content-first and fast.',
    effects: ['Flat surfaces', 'Thin border only', 'Minimal motion'],
  },
  {
    id: 'futuristic-cyber',
    label: 'Futuristic / Cyber',
    description: 'Neon-edged surfaces with a glowing accent border and a cool blur.',
    effects: ['Neon accent border', 'Glow', 'Cool-toned blur'],
  },
  {
    id: 'material',
    label: 'Material',
    description: 'Clear elevation steps and a defined shadow scale, in the PlourX palette.',
    effects: ['Stepped elevation shadow', 'Crisp radius', 'Flat color fills'],
  },
];

export const MORPHISM_IDS = MORPHISM_PRESETS.map((preset) => preset.id) as MorphismId[];

export const DEFAULT_MORPHISM_ID: MorphismId = 'plourx-original';

export function isMorphismId(value: unknown): value is MorphismId {
  return typeof value === 'string' && (MORPHISM_IDS as string[]).includes(value);
}

export function getMorphismPreset(id: MorphismId): MorphismPreset {
  return MORPHISM_PRESETS.find((preset) => preset.id === id) ?? MORPHISM_PRESETS[0];
}
