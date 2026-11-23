import { useSyncExternalStore } from 'react'
import { TOGGLE_IDS, type ToggleConfig, type ToggleId } from './types'

/**
 * The toggle design the PlourX admin chose (Design System > Toggles). Stored on the shared design_global_settings row (column toggle_config),
 * read with the public anon key like the other design settings. Until an admin chooses one, or when it cannot be read, the app keeps its own
 * built-in switch. A cached copy avoids a flash of the built-in switch on start.
 */
export interface ServerToggle {
  defaultType: ToggleId
  config: ToggleConfig | undefined
}

const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
const CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
const CACHE_KEY = 'plourx.toggleDesign.v1'
const REFRESH_MS = 5 * 60 * 1000

const isId = (v: unknown): v is ToggleId => typeof v === 'string' && (TOGGLE_IDS as readonly string[]).includes(v)

function parse(raw: unknown): ServerToggle | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const p = raw as { defaultType?: unknown; configs?: unknown }
  if (!isId(p.defaultType)) return null
  const configs = p.configs && typeof p.configs === 'object' && !Array.isArray(p.configs) ? (p.configs as Record<string, unknown>) : {}
  const cfg = configs[p.defaultType]
  return { defaultType: p.defaultType, config: cfg && typeof cfg === 'object' && !Array.isArray(cfg) ? (cfg as ToggleConfig) : undefined }
}

function readCache(): ServerToggle | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    return raw ? parse(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

let current: ServerToggle | null | undefined
const listeners = new Set<() => void>()
const snapshot = (): ServerToggle | null => (current === undefined ? (current = readCache()) : current)
let started = false

async function refresh() {
  if (!CONFIGURED) return
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/design_global_settings?select=toggle_config&id=eq.global&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    if (!res.ok) return // e.g. the column does not exist yet: keep what we have
    const rows = (await res.json()) as Array<{ toggle_config?: unknown }>
    const raw = rows[0]?.toggle_config
    const next = parse(raw)
    try {
      if (next) window.localStorage.setItem(CACHE_KEY, JSON.stringify(raw))
      else window.localStorage.removeItem(CACHE_KEY)
    } catch {
      /* storage unavailable */
    }
    if (JSON.stringify(next) !== JSON.stringify(current)) {
      current = next
      listeners.forEach((l) => l())
    }
  } catch {
    /* offline or unreachable: never break the app over a design lookup */
  }
}

function start() {
  if (started) return
  started = true
  void refresh()
  window.setInterval(() => void refresh(), REFRESH_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refresh()
  })
}

function subscribe(cb: () => void) {
  start()
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** The admin's chosen switch design, or null to use the app's built-in switch. */
export function useServerToggle(): ServerToggle | null {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}
