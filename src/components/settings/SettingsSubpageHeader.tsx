import styles from './SettingsSubpageHeader.module.css';

/** The back button lives once in SettingsLayout's persistent header -- subpages only contribute their own title. */
export function SettingsSubpageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
