import type { ChangeEvent } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
}

export function FormField({ label, name, type = 'text', value, onChange, placeholder, required, disabled, error, autoComplete }: FormFieldProps) {
  const inputId = `field-${name}`;
  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label} {!required && <span className={styles.optional}>(optional)</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`${styles.input} ${error ? styles.invalid : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <span id={`${inputId}-error`} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
