import { useEffect, useRef, useState } from 'react';
import { onToast, type ToastPayload } from '../../services/toast/toastService';
import styles from './Toast.module.css';

/** Matches --px-dur-fast, which drives the .closing exit animation in Toast.module.css -- keeping these in sync avoids a frame where the toast is gone from CSS but still mounted in React, or vice versa. */
const EXIT_DURATION_MS = 120;

export function Toast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [closing, setClosing] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return onToast((payload) => {
      clearTimeout(exitTimerRef.current);
      setClosing(false);
      setToast(payload);
    });
  }, []);

  useEffect(() => () => clearTimeout(exitTimerRef.current), []);

  const dismiss = () => {
    setClosing(true);
    exitTimerRef.current = setTimeout(() => {
      setToast(null);
      setClosing(false);
    }, EXIT_DURATION_MS);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className={`${styles.wrap} ${closing ? styles.closing : ''}`} role="status">
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            toast.action?.onPress();
            dismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
