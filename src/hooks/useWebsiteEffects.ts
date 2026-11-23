import { useCallback, useSyncExternalStore } from 'react'

/** Same storage key as the PlourX Website Builder and the other PlourX apps. "1" / "0", on unless switched off. */
export const WEBSITE_EFFECTS_KEY = 'wb.effects'

const read = (): boolean => {
  try {
    return localStorage.getItem(WEBSITE_EFFECTS_KEY) === '1'
  } catch {
    return false
  }
}

let on = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Mirrors the choice on <html data-website-effects="off"> (absent when on); plourx-ui.css switches decorative motion off under it. */
const apply = () => {
  if (typeof document === 'undefined') return
  if (on) document.documentElement.removeAttribute('data-website-effects')
  else document.documentElement.setAttribute('data-website-effects', 'off')
}
apply()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== WEBSITE_EFFECTS_KEY) return
    on = read()
    apply()
    listeners.forEach((l) => l())
  })
}

/** Settings > Appearance > Website effects. */
export function useWebsiteEffects() {
  const enabled = useSyncExternalStore(subscribe, () => on, () => false)
  const setEnabled = useCallback((v: boolean) => {
    on = v
    try {
      localStorage.setItem(WEBSITE_EFFECTS_KEY, v ? '1' : '0')
    } catch {
      /* storage unavailable: applies until reload */
    }
    apply()
    listeners.forEach((l) => l())
  }, [])
  return { enabled, setEnabled }
}
