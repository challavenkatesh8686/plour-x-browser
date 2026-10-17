export type Gender = 'male' | 'female' | 'other'

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Prefer not to say' },
]

export function isGender(value: unknown): value is Gender {
  return value === 'male' || value === 'female' || value === 'other'
}
