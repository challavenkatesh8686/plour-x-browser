import type { ReactNode } from 'react'
import { Toggle } from './Toggle'
import { useServerToggle } from './serverToggle'

interface Props {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  /** Rendered when the admin has not chosen a toggle design (the app's own built-in switch). */
  fallback: ReactNode
}

/** The admin-chosen toggle design, or `fallback` (the built-in switch) when none is chosen. */
export function AppSwitch({ checked, onChange, label, disabled, fallback }: Props) {
  const design = useServerToggle()
  if (!design) return <>{fallback}</>
  return <Toggle type={design.defaultType} config={design.config} checked={checked} onChange={onChange} disabled={disabled} aria-label={label} />
}
