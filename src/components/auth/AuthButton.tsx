import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './AuthButton.module.css';

type Variant = 'primary' | 'outline';

interface CommonProps {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

interface LinkButtonProps extends CommonProps {
  to: string;
  onClick?: () => void;
}

interface NativeButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  to?: never;
}

type AuthButtonProps = LinkButtonProps | NativeButtonProps;

export function AuthButton(props: AuthButtonProps) {
  const { variant = 'primary', fullWidth, children } = props;
  const cls = [styles.btn, styles[variant], fullWidth ? styles.fullWidth : ''].filter(Boolean).join(' ');

  if ('to' in props && props.to) {
    return (
      <Link to={props.to} onClick={props.onClick} className={cls}>
        {children}
      </Link>
    );
  }

  const { type = 'button', onClick, disabled } = props as NativeButtonProps;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
