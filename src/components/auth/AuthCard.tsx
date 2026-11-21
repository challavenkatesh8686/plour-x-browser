import type { ReactNode } from 'react';
import { useAuthEnabled } from '../../hooks/useAuthEnabled';
import { PillHead } from './PillAuth';
import styles from './AuthCard.module.css';

export function AuthCard({ title, subtitle, footer, children }: { title: string; subtitle?: string; footer?: ReactNode; children: ReactNode }) {
  // An admin can switch authentication off per app (auth_app_settings): sign-in, sign-up and reset are blocked.
  const authEnabled = useAuthEnabled();
  return (
    <div className={styles.page}>
      <div className={`pxa-card ${styles.card}`}>
        {authEnabled ? (
          <PillHead title={title} subtitle={subtitle} />
        ) : (
          <PillHead title="Sign-in is unavailable" subtitle="Accounts are temporarily turned off. Please check back soon." />
        )}
        {authEnabled && children}
        {authEnabled && footer && (
          <div className="pxa-foot">
            <span>{footer}</span>
          </div>
        )}
      </div>
    </div>
  );
}
