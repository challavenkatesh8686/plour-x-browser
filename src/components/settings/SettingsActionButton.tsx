import styles from './SettingsActionButton.module.css';

export function SettingsActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={styles.button} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
