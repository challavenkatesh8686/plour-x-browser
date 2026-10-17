import type { ReactNode } from 'react';
import { useAuthEnabled } from '../../hooks/useAuthEnabled';
import styles from './AuthCard.module.css';

export function AuthCard({ title, subtitle, footer, children }: { title: string; subtitle?: string; footer?: ReactNode; children: ReactNode }) {
  // An admin can switch authentication off per app (auth_app_settings): sign-in, sign-up and reset are blocked.
  const authEnabled = useAuthEnabled();
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.head}>
          <img src="/plourx-logo.png" alt="" className={styles.logo} />
          <h1 className={styles.title}>{authEnabled ? title : 'Sign-in is unavailable'}</h1>
          {authEnabled ? (
            subtitle && <p className={styles.subtitle}>{subtitle}</p>
          ) : (
            <p className={styles.subtitle}>Accounts are temporarily turned off. Please check back soon.</p>
          )}
        </div>
        {authEnabled && children}
        {authEnabled && footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
