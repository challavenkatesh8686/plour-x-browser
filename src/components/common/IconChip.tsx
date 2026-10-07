import type { LucideIcon } from 'lucide-react';
import styles from './IconChip.module.css';

/** Shared "something's wrong/empty" icon treatment -- originally EmptyState's own markup, generalized so ErrorView and BrowserContentHost's placeholder match it instead of each floating a bare icon. */
export function IconChip({ icon: Icon, tone = 'accent', size = 26 }: { icon: LucideIcon; tone?: 'accent' | 'warning'; size?: number }) {
  return (
    <div className={`${styles.chip} ${styles[tone]}`}>
      <Icon size={size} />
    </div>
  );
}
