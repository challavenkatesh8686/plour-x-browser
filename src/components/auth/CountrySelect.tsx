import type { ChangeEvent } from 'react';
import { COUNTRIES } from '../../services/auth/countries';
import styles from './CountrySelect.module.css';

interface CountrySelectProps {
  value: string | null;
  onChange: (code: string) => void;
  error?: string;
  required?: boolean;
}

export function CountrySelect({ value, onChange, error, required }: CountrySelectProps) {
  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value);
  }

  return (
    <div className={styles.field}>
      <label htmlFor="country" className={styles.label}>
        Country {!required && <span className={styles.optional}>(optional)</span>}
      </label>
      <select
        id="country"
        value={value ?? ''}
        onChange={handleChange}
        required={required}
        aria-invalid={Boolean(error)}
        className={`${styles.select} ${error ? styles.invalid : ''}`}
      >
        <option value="" disabled>
          Select your country
        </option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
