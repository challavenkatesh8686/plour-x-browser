import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './SettingsSection.module.css';

export function SettingsSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <Icon size={16} className={styles.headingIcon} />
        {title}
      </div>
      <div className={styles.rows}>{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  control,
  onClick,
}: {
  label: string;
  description?: string;
  control?: ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {description && <span className={styles.rowDescription}>{description}</span>}
      </div>
      {control}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={`${styles.row} ${styles.rowButton}`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={styles.row}>{content}</div>;
}
