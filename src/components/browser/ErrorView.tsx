import { AlertTriangle, Home, RotateCw } from 'lucide-react';
import type { TabError } from '../../services/tabs/types';
import styles from './ErrorView.module.css';

export function ErrorView({ error, onRetry, onGoHome }: { error: TabError; onRetry: () => void; onGoHome: () => void }) {
  return (
    <div className={styles.wrap}>
      <AlertTriangle size={40} className={styles.icon} />
      <h2 className={styles.title}>This page couldn&apos;t load</h2>
      <p className={styles.description}>{error.description || 'The site may be down, or check your connection.'}</p>
      <p className={styles.url}>{error.failingUrl}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onRetry}>
          <RotateCw size={15} /> Retry
        </button>
        <button type="button" className={styles.secondary} onClick={onGoHome}>
          <Home size={15} /> New tab
        </button>
      </div>
    </div>
  );
}
