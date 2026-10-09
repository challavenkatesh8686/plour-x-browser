import { useEffect, useState } from 'react'
import { CHAT_API_BASE, CHAT_APP_ID } from '../services/chat/chatService'

const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
const REFRESH_MS = 5 * 60 * 1000

/** Reads this app's admin switch (chatbot_app_settings, public read). Anything but an explicit `true` means off. */
export async function fetchChatbotEnabled(): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/chatbot_app_settings?select=enabled&app_id=eq.${encodeURIComponent(CHAT_APP_ID)}&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return false
  const rows = (await res.json()) as Array<{ enabled?: boolean }>
  return rows[0]?.enabled === true
}

/**
 * Whether to show the PlourX AI assistant: an admin has enabled it for this app, and the app knows where the chat API
 * is (VITE_API_BASE) and where the setting lives (Supabase). Checked at startup, when the app returns to the
 * foreground, and every few minutes, so an admin change reaches users without a new release.
 */
export function useChatbotEnabled(): boolean {
  const configured = Boolean(CHAT_API_BASE && SUPABASE_URL && SUPABASE_ANON_KEY)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!configured) return
    let active = true
    const check = () => {
      fetchChatbotEnabled()
        .then((value) => active && setEnabled(value))
        .catch(() => active && setEnabled(false))
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

  return configured && enabled
}
