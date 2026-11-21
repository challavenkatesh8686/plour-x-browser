import type { ChangeEvent } from 'react';
import { Users } from '../../lib/flatIcons/icons';
import { GENDER_OPTIONS, type Gender } from '../../lib/gender';
import { PillSelect } from './PillAuth';

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
    <PillSelect label={required ? 'Gender' : 'Gender (optional)'} icon={<Users />} id="gender" value={value ?? ''} onChange={handleChange} required={required} error={error}>
      <option value="" disabled>
        Select your gender
      </option>
      {GENDER_OPTIONS.map((g) => (
        <option key={g.value} value={g.value}>
          {g.label}
        </option>
      ))}
    </PillSelect>
  );
}
