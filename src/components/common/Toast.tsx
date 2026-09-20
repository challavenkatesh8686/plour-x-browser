import { useEffect, useState } from 'react';
import { onToast, type ToastPayload } from '../../services/toast/toastService';
import styles from './Toast.module.css';

export function Toast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    const unsubscribe = onToast((payload) => setToast(payload));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className={styles.wrap} role="status">
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            toast.action?.onPress();
            setToast(null);
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
