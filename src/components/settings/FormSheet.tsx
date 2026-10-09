import { useEffect, useRef, useState, type ReactNode } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { X } from 'lucide-react';
import { isNativeAndroid } from '../../utils/platform';
import { setFormSheetOpen } from '../../utils/backGuard';
import { IconButton } from '../common/IconButton';
import styles from './SiteForms.module.css';

interface FormSheetProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet for the Contact / Feedback forms. Scrolls inside the visible viewport, so the on-screen keyboard never hides the fields. */
export function FormSheet({ open, title, description, onClose, children }: FormSheetProps) {
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setFormSheetOpen(true);
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // Android back closes the sheet. useHardwareBackButton skips its own handling while a sheet is open.
    const sub = isNativeAndroid() ? CapacitorApp.addListener('backButton', onClose) : null;
    const vv = window.visualViewport;
    const fit = () => setMaxHeight(vv ? Math.floor(vv.height * 0.92) : null);
    fit();
    vv?.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('keydown', onKey);
      void sub?.then((handle) => handle.remove());
      vv?.removeEventListener('resize', fit);
      setFormSheetOpen(false);
    };
  }, [open, onClose]);

  // When a field is focused, keep it in view once the keyboard has resized the viewport.
  useEffect(() => {
    if (!open) return;
    const el = sheetRef.current;
    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      window.setTimeout(() => target.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 300);
    };
    el?.addEventListener('focusin', onFocus);
    return () => el?.removeEventListener('focusin', onFocus);
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        ref={sheetRef}
        className={`${styles.sheet} px-glass`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={maxHeight ? { maxHeight } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
          </div>
          <IconButton icon={<X size={18} />} label="Close" size="sm" onClick={onClose} />
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
