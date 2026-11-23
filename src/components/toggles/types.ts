export const TOGGLE_IDS = [
  'classic', 'ios', 'material', 'minimal', 'outline',
  'gradient', 'glass', 'neon', 'neumorphic', 'pill',
  'morph', 'elastic', 'flip', 'liquid', 'glow',
  'icon', 'label', 'segmented', 'square', 'plourx-signature',
  'rocker', 'lever', 'push-button', 'led', 'power', 'knob', 'padlock', 'piano', 'mechanical', 'gauge',
  'leaf', 'flame', 'droplet', 'snow', 'cloud', 'stars', 'sunrise', 'rainbow', 'wave', 'bolt',
  'emoji', 'smiley', 'bubble', 'heart', 'rocket', 'bouncy-ball', 'chomp', 'confetti', 'jelly', 'sticker',
] as const;
export type ToggleId = (typeof TOGGLE_IDS)[number];

export const TOGGLE_CATEGORIES = ['minimal-classic', 'modern-premium', 'creative-animated', 'advanced-functional', 'physical-hardware', 'nature-themed', 'playful-expressive'] as const;
export type ToggleCategory = (typeof TOGGLE_CATEGORIES)[number];

export const TOGGLE_CATEGORY_LABELS: Record<ToggleCategory, string> = {
  'minimal-classic': 'Minimal & Classic',
  'modern-premium': 'Modern & Premium',
  'creative-animated': 'Creative & Animated',
  'advanced-functional': 'Advanced & Functional',
  'physical-hardware': 'Physical & Hardware',
  'nature-themed': 'Nature & Weather',
  'playful-expressive': 'Playful & Expressive',
};

export const DEFAULT_TOGGLE_ID: ToggleId = 'classic';

export type ToggleSize = 'small' | 'medium' | 'large' | 'custom';

/** Every field optional; unset fields fall back to the design's own defaults. Colours are #hex. */
export interface ToggleConfig {
  size?: ToggleSize;
  /** px, 24..240 (used when size is 'custom') */
  width?: number;
  /** px, 12..120 (used when size is 'custom') */
  height?: number;
  /** px thumb diameter/height */
  thumbSize?: number;
  /** px track corner radius */
  radius?: number;
  /** px track thickness (thin-track designs) */
  trackThickness?: number;
  onColor?: string;
  offColor?: string;
  thumbColor?: string;
  accent?: string;
  borderColor?: string;
  gradient?: { from: string; to: string; angle: number };
  /** hex or '' */
  background?: string;
  appearance?: 'auto' | 'light' | 'dark';
  /** 0..1 */
  glow?: number;
  /** 0..1 */
  shadow?: number;
  /** 0.25..3, 1 = normal */
  speed?: number;
  easing?: 'ease' | 'ease-in-out' | 'spring' | 'linear';
  animation?: 'slide' | 'fade' | 'bounce';
  direction?: 'normal' | 'reverse';
  showLabel?: boolean;
  showIcon?: boolean;
  onLabel?: string;
  offLabel?: string;
}
export type ToggleConfigKey = keyof ToggleConfig;

export const TOGGLE_LIMITS = {
  width: [24, 240],
  height: [12, 120],
  glow: [0, 1],
  shadow: [0, 1],
  speed: [0.25, 3],
} as const;

export interface ToggleDef {
  id: ToggleId;
  name: string;
  description: string;
  category: ToggleCategory;
  /** Config fields that change how this design looks (drives the admin controls). */
  relevant: ToggleConfigKey[];
}

const BASE: ToggleConfigKey[] = ['size', 'width', 'height', 'thumbSize', 'onColor', 'offColor', 'thumbColor', 'appearance', 'speed', 'easing', 'direction'];
const r = (...extra: ToggleConfigKey[]): ToggleConfigKey[] => [...BASE, ...extra];

export const TOGGLE_DEFS: readonly ToggleDef[] = [
  { id: 'classic', name: 'Classic', description: 'Familiar pill track with a sliding round thumb.', category: 'minimal-classic', relevant: r('radius', 'shadow', 'animation') },
  { id: 'ios', name: 'iOS', description: 'Green pill whose thumb stretches while pressed.', category: 'minimal-classic', relevant: r('radius', 'shadow', 'animation') },
  { id: 'material', name: 'Material', description: 'Thin track, oversized thumb with a touch halo.', category: 'minimal-classic', relevant: r('trackThickness', 'shadow', 'animation', 'showIcon') },
  { id: 'minimal', name: 'Minimal', description: 'A hairline with a small dot, nothing else.', category: 'minimal-classic', relevant: r('trackThickness', 'animation') },
  { id: 'outline', name: 'Outline', description: 'Ring outline with a solid inner dot.', category: 'minimal-classic', relevant: r('radius', 'borderColor', 'animation') },
  { id: 'gradient', name: 'Gradient', description: 'Gradient track that pans as it switches on.', category: 'modern-premium', relevant: r('radius', 'gradient', 'shadow', 'animation') },
  { id: 'glass', name: 'Glass', description: 'Frosted translucent track and sheen-lit thumb.', category: 'modern-premium', relevant: r('radius', 'accent', 'shadow', 'animation') },
  { id: 'neon', name: 'Neon', description: 'Dark tube with a glowing neon outline and pulse.', category: 'modern-premium', relevant: r('radius', 'background', 'glow') },
  { id: 'neumorphic', name: 'Neumorphic', description: 'Soft embossed groove with a raised thumb.', category: 'modern-premium', relevant: r('radius', 'background', 'shadow', 'animation') },
  { id: 'pill', name: 'Pill', description: 'Wide capsule thumb that fills the track behind it.', category: 'modern-premium', relevant: r('radius', 'shadow', 'animation') },
  { id: 'morph', name: 'Morph', description: 'Circle and pill morph into a rotated squircle.', category: 'creative-animated', relevant: r('radius', 'shadow') },
  { id: 'elastic', name: 'Elastic', description: 'Squash-and-stretch thumb with a springy overshoot.', category: 'creative-animated', relevant: r('radius', 'shadow') },
  { id: 'flip', name: 'Flip', description: 'Thumb is a 3D card that flips as it travels.', category: 'creative-animated', relevant: r('radius', 'shadow', 'showIcon') },
  { id: 'liquid', name: 'Liquid', description: 'A wobbling blob pours colour across the track.', category: 'creative-animated', relevant: r('radius', 'shadow') },
  { id: 'glow', name: 'Glow', description: 'Radiant orb that lights the track from within.', category: 'creative-animated', relevant: r('background', 'glow', 'shadow') },
  { id: 'icon', name: 'Icon', description: 'Day and night sky: the thumb turns sun into moon.', category: 'advanced-functional', relevant: r('showIcon', 'shadow') },
  { id: 'label', name: 'Label', description: 'ON / OFF text revealed behind the thumb.', category: 'advanced-functional', relevant: r('radius', 'shadow', 'showLabel', 'onLabel', 'offLabel') },
  { id: 'segmented', name: 'Segmented', description: 'Two-option segmented control with a sliding highlight.', category: 'advanced-functional', relevant: r('radius', 'shadow', 'showLabel', 'onLabel', 'offLabel') },
  { id: 'square', name: 'Square', description: 'Hard-edged checkbox-style switch with an offset shadow.', category: 'advanced-functional', relevant: r('radius', 'borderColor', 'shadow', 'showIcon', 'animation') },
  { id: 'plourx-signature', name: 'PlourX Signature', description: 'Brand gradient, glossy thumb, orbiting ring and shimmer.', category: 'advanced-functional', relevant: r('gradient', 'glow', 'shadow', 'showIcon') },
  { id: 'rocker', name: 'Rocker', description: 'Two-way rocker plate that tilts like a wall switch.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'lever', name: 'Lever', description: 'A hinged lever that throws from one side to the other.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'push-button', name: 'Push Button', description: 'A latching button that sinks in and lights up.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'led', name: 'LED', description: 'Panel switch with an LED that lights when on.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'power', name: 'Power', description: 'Round power-button thumb with a glowing ring.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'knob', name: 'Knob', description: 'A rotary knob that turns to the ON mark.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'padlock', name: 'Padlock', description: 'Shackle that locks and unlocks as it switches.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'piano', name: 'Piano', description: 'Two keys, the pressed one sinks and glows.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'mechanical', name: 'Mechanical', description: 'Keycap switch with a tactile click travel.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'gauge', name: 'Gauge', description: 'Meter-style track with a needle-like indicator.', category: 'physical-hardware', relevant: r('radius', 'shadow', 'animation') },
  { id: 'leaf', name: 'Leaf', description: 'A leaf thumb that unfurls and greens the track.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'flame', name: 'Flame', description: 'Ember thumb that ignites a warm flickering track.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'droplet', name: 'Droplet', description: 'A water drop that fills the track as it flows.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'snow', name: 'Snow', description: 'Frosted track with a drifting snowflake thumb.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'cloud', name: 'Cloud', description: 'Soft cloud thumb drifting across a sky track.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'stars', name: 'Stars', description: 'Night sky that twinkles when switched on.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'sunrise', name: 'Sunrise', description: 'A sun rising along the horizon of the track.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'rainbow', name: 'Rainbow', description: 'Arcing rainbow that sweeps in as it turns on.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'wave', name: 'Wave', description: 'Rolling wave surface that crests to the ON side.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'bolt', name: 'Bolt', description: 'Lightning thumb that flashes the track electric.', category: 'nature-themed', relevant: r('radius', 'shadow', 'animation') },
  { id: 'emoji', name: 'Emoji', description: 'A face thumb that swaps from sleepy to happy.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'smiley', name: 'Smiley', description: 'Frown turns to a smile as the track fills.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'bubble', name: 'Bubble', description: 'Soap-bubble thumb that wobbles and pops in place.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'heart', name: 'Heart', description: 'Heart thumb that beats once when switched on.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'rocket', name: 'Rocket', description: 'Rocket thumb that blasts along the track.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'bouncy-ball', name: 'Bouncy Ball', description: 'A ball that bounces across with squash and stretch.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'chomp', name: 'Chomp', description: 'Arcade chomper that eats its way to ON.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'confetti', name: 'Confetti', description: 'Confetti burst fires when it switches on.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'jelly', name: 'Jelly', description: 'Wobbly jelly thumb with a gelatin track.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
  { id: 'sticker', name: 'Sticker', description: 'Peel-off sticker thumb with a paper track.', category: 'playful-expressive', relevant: r('radius', 'shadow', 'animation') },
];
