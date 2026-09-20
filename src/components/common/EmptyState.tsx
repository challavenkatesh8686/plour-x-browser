import type { LucideIcon } from 'lucide-react';
import styles from './EmptyState.module.css';

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap}>
        <Icon size={26} />
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
