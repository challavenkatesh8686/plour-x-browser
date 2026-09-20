import type { ReactNode } from 'react';
import styles from './SettingsNote.module.css';

export function SettingsNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
