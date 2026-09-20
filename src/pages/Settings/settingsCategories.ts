import { Layers, Palette, SlidersHorizontal, type LucideIcon } from 'lucide-react';

export interface SettingsCategory {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  { to: '/settings/general', icon: SlidersHorizontal, title: 'General', description: 'Search engine, links, and your PlourX account' },
  { to: '/settings/appearance', icon: Palette, title: 'Appearance', description: 'Theme and look' },
  { to: '/settings/tabs', icon: Layers, title: 'Tabs', description: 'Tab behavior and memory usage' },
];
