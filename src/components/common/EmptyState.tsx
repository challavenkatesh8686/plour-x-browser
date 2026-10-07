import type { LucideIcon } from 'lucide-react';
import { IconChip } from './IconChip';
import styles from './EmptyState.module.css';

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className={styles.wrap}>
      <IconChip icon={Icon} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
