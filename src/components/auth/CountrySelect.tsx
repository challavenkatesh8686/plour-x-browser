import type { ChangeEvent } from 'react';
import { Globe } from '../../lib/flatIcons/icons';
import { COUNTRIES } from '../../services/auth/countries';
import { PillSelect } from './PillAuth';

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
    <PillSelect label={required ? 'Country' : 'Country (optional)'} icon={<Globe />} id="country" value={value ?? ''} onChange={handleChange} required={required} error={error}>
      <option value="" disabled>
        Select your country
      </option>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </PillSelect>
  );
}
