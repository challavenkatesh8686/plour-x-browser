import { AccentPicker } from '../../components/common/AccentPicker';
import { useState } from 'react';
import { Laptop, Moon, Palette, Sun, Type, type LucideIcon } from 'lucide-react';
import { SettingsSubpageHeader } from '../../components/settings/SettingsSubpageHeader';
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsSection';
import { SettingsActionButton } from '../../components/settings/SettingsActionButton';
import { useTheme, type Theme } from '../../hooks/useTheme';
import { useAccentColor, ACCENT_COLORS, ACCENT_SWATCH_HEX } from '../../hooks/useAccentColor';
import { useFontStyle, DEFAULT_FONT_STYLE } from '../../hooks/useFontStyle';
import { FONT_OPTIONS, FONT_WEIGHTS, FONT_WEIGHT_LABELS, FONT_SIZES, TEXT_CASES, TEXT_CASE_LABELS } from '../../data/fontOptions';
import styles from './AppearanceSettingsPage.module.css';

const THEME_OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'System', icon: Laptop },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, customColor, setCustomColor } = useAccentColor();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { fontStyle, updateFontStyle, resetFontStyle } = useFontStyle();

  return (
    <div>
      <SettingsSubpageHeader title="Appearance" />

      <SettingsSection title="Theme" icon={Palette}>
        <div className={styles.themeGrid} role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              className={`${styles.themeCard} ${theme === value ? styles.active : ''}`}
              onClick={() => setTheme(value)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Accent color" icon={Palette}>
        <SettingsRow
          label="Accent"
          control={
            <div className={styles.swatches} role="radiogroup" aria-label="Accent color">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={accent === color}
                  aria-label={color}
                  title={color}
                  className={`${styles.swatch} ${accent === color ? styles.active : ''}`}
                  style={{ background: ACCENT_SWATCH_HEX[color] }}
                  onClick={() => setAccent(color)}
                />
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={accent === 'custom'}
                aria-label="Custom color"
                title="Custom color"
                className={`${styles.swatch} ${accent === 'custom' ? styles.active : ''} px-swatch-rainbow`}
                onClick={() => setPickerOpen(true)}
              />
              {pickerOpen && (
                <AccentPicker
                  initial={customColor}
                  onCancel={() => setPickerOpen(false)}
                  onApply={(hex) => {
                    setCustomColor(hex)
                    setPickerOpen(false)
                  }}
                />
              )}
            </div>
          }
        />
      </SettingsSection>

      <SettingsSection title="Font" icon={Type}>
        <SettingsRow
          label="Font family"
          control={
            <select
              className={styles.select}
              value={fontStyle.family}
              aria-label="Font family"
              onChange={(e) => updateFontStyle({ family: e.target.value })}
            >
              {FONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} style={{ fontFamily: option.value === 'default' ? undefined : option.value }}>
                  {option.label}
                </option>
              ))}
            </select>
          }
        />
        <SettingsRow
          label="Font weight"
          control={
            <select
              className={styles.select}
              value={fontStyle.weight}
              aria-label="Font weight"
              onChange={(e) => updateFontStyle({ weight: e.target.value as (typeof FONT_WEIGHTS)[number] })}
            >
              {FONT_WEIGHTS.map((weight) => (
                <option key={weight} value={weight}>
                  {FONT_WEIGHT_LABELS[weight]}
                </option>
              ))}
            </select>
          }
        />
        <SettingsRow
          label="Font size"
          control={
            <div className={styles.fontSizeGrid} role="radiogroup" aria-label="Font size">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={fontStyle.size === size}
                  aria-label={size}
                  className={`${styles.fontSizeOption} ${fontStyle.size === size ? styles.active : ''}`}
                  style={{ fontSize: size }}
                  onClick={() => updateFontStyle({ size })}
                >
                  A
                </button>
              ))}
            </div>
          }
        />
        <SettingsRow
          label="Text case"
          control={
            <select
              className={styles.select}
              value={fontStyle.textCase}
              aria-label="Text case"
              onChange={(e) => updateFontStyle({ textCase: e.target.value as (typeof TEXT_CASES)[number] })}
            >
              {TEXT_CASES.map((textCase) => (
                <option key={textCase} value={textCase}>
                  {TEXT_CASE_LABELS[textCase]}
                </option>
              ))}
            </select>
          }
        />
        <SettingsRow
          label="Reset font"
          description="Back to the default system font, regular weight, 16px, no case change"
          control={
            <SettingsActionButton
              label="Reset"
              onClick={resetFontStyle}
              disabled={
                fontStyle.family === DEFAULT_FONT_STYLE.family &&
                fontStyle.weight === DEFAULT_FONT_STYLE.weight &&
                fontStyle.size === DEFAULT_FONT_STYLE.size &&
                fontStyle.textCase === DEFAULT_FONT_STYLE.textCase
              }
            />
          }
        />
      </SettingsSection>
    </div>
  );
}
