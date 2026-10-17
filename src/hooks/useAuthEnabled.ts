import { useEffect, useState } from 'react'
import { CHAT_APP_ID as APP_SLUG } from '../services/chat/chatService'

const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
const REFRESH_MS = 5 * 60 * 1000

/**
 * Reads this app's admin authentication switch (auth_app_settings, public read). Fails open: a missing row, a missing
 * table or a network error all mean sign-in is available, so a settings outage never locks everyone out.
 */
export async function fetchAuthEnabled(): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/auth_app_settings?select=enabled&app_id=eq.${encodeURIComponent(APP_SLUG)}&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return true
  const rows = (await res.json()) as Array<{ enabled?: boolean }>
  return rows[0]?.enabled !== false
}

/** Whether an admin has left sign-in / sign-up on for this app. Rechecked at startup, on foreground and every few minutes. */
export function useAuthEnabled(): boolean {
  const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (!configured) return
    let active = true
    const check = () => {
      fetchAuthEnabled()
        .then((value) => active && setEnabled(value))
        .catch(() => active && setEnabled(true))
    }
    check()
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(check, REFRESH_MS)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [configured])

  return enabled
}
