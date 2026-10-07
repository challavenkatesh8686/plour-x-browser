import styles from './ConfirmSheet.module.css';

export interface ConfirmSheetOption {
  value: string;
  label: string;
  /** Red destructive styling. Defaults to true -- most uses today are "delete"-style actions. */
  destructive?: boolean;
}

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  options: ConfirmSheetOption[];
  /** When provided, renders a trailing neutral row that just calls onClose. */
  cancelLabel?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

/** Shared bottom-sheet confirm/option picker -- generalized from the "Clear browsing data" sheet. */
export function ConfirmSheet({ open, title, options, cancelLabel, onSelect, onClose }: ConfirmSheetProps) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={`${styles.sheet} px-glass`} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.option} ${option.destructive !== false ? styles.destructive : ''}`}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
        {cancelLabel ? (
          <button type="button" className={`${styles.option} ${styles.cancel}`} onClick={onClose}>
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
