import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.css';

type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  size?: Size;
  label: string;
  variant?: 'glass' | 'plain';
}

export function IconButton({ icon, size = 'md', label, variant = 'glass', className, ...rest }: IconButtonProps) {
  const classes = [styles.button, styles[size], styles[variant], className].filter(Boolean).join(' ');

  return (
    <button className={classes} aria-label={label} title={label} {...rest}>
      {icon}
    </button>
  );
}
