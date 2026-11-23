import { AppSwitch } from '../toggles/AppSwitch';
import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function BuiltInSwitch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.track} ${checked ? styles.on : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.thumb} />
    </button>
  );
}

/** The admin-chosen toggle design (Design System > Toggles) when one is set, otherwise the app's built-in switch. */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return <AppSwitch checked={checked} onChange={onChange} label={label} fallback={<BuiltInSwitch checked={checked} onChange={onChange} label={label} />} />;
}
