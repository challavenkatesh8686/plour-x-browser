import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import styles from './ThemeToggle.module.css';

/** Ported from plour-x-website's quick-access header toggle (src/components/ui/ThemeToggle.tsx) -- a sliding sun/moon pill, not buried in a settings list. */
export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={styles.toggle}
      onClick={toggleTheme}
    >
      <Sun size={12} className={styles.railIcon} />
      <Moon size={12} className={styles.railIcon} />
      <span className={`${styles.thumb} ${isDark ? styles.thumbDark : styles.thumbLight}`}>
        {isDark ? <Moon size={12} /> : <Sun size={12} />}
      </span>
    </button>
  );
}
