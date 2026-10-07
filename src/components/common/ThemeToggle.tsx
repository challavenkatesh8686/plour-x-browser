import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { IconButton } from './IconButton';
import styles from './ThemeToggle.module.css';

/**
 * A compact round "orb" button (matching plour-x-music's ThemeToggle.tsx /
 * .theme-orb), not the wider sliding sun/moon pill this used to be -- that
 * pill read fine alone but crowded the mobile topBar once sat next to
 * TranslateButton's plain round IconButton, which is the shared sizing
 * convention every other topBar icon here already follows.
 */
export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <IconButton
      icon={
        <span className={`${styles.orb} ${isDark ? styles.orbDark : styles.orbLight}`}>
          {isDark ? <Moon size={11} /> : <Sun size={11} />}
        </span>
      }
      label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      size="sm"
      variant="plain"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
    />
  );
}
