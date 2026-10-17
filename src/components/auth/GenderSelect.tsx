import type { ChangeEvent } from 'react';
import { GENDER_OPTIONS, type Gender } from '../../lib/gender';
import styles from './CountrySelect.module.css';

interface GenderSelectProps {
  value: Gender | null;
  onChange: (gender: Gender) => void;
  error?: string;
  required?: boolean;
}

export function GenderSelect({ value, onChange, error, required }: GenderSelectProps) {
  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value as Gender);
  }

  return (
    <div className={styles.field}>
      <label htmlFor="gender" className={styles.label}>
        Gender {!required && <span className={styles.optional}>(optional)</span>}
      </label>
      <select
        id="gender"
        value={value ?? ''}
        onChange={handleChange}
        required={required}
        aria-invalid={Boolean(error)}
        className={`${styles.select} ${error ? styles.invalid : ''}`}
      >
        <option value="" disabled>
          Select your gender
        </option>
        {GENDER_OPTIONS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
