import { Check, Palette } from 'lucide-react';
import { SettingsSubpageHeader } from '../../components/settings/SettingsSubpageHeader';
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsSection';
import { useTheme, type Theme } from '../../hooks/useTheme';
import styles from './AppearanceSettingsPage.module.css';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <SettingsSubpageHeader title="Appearance" />

      <SettingsSection title="Theme" icon={Palette}>
        {THEME_OPTIONS.map((option) => (
          <SettingsRow
            key={option.value}
            label={option.label}
            onClick={() => setTheme(option.value)}
            control={theme === option.value ? <Check size={18} className={styles.checkIcon} /> : undefined}
          />
        ))}
      </SettingsSection>
    </div>
  );
}
