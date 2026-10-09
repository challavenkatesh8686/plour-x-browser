export const CHAT_APP_ID = 'browser'
export const CHAT_APP_NAME = 'PlourX Browser'

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

/** Thrown when the server says an admin has not enabled the assistant for this app. */
export class ChatDisabledError extends Error {
  constructor() {
    super('The assistant is not enabled for this app.')
    this.name = 'ChatDisabledError'
  }
}

/**
 * Origin of the deployed PlourX API that serves /api/chat (the PlourX website deployment). Without it there is no
 * assistant: the apps are bundled with the device, so there is no same-origin server to call.
 */
export const CHAT_API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? '').replace(/\/$/, '')

/** True while the chat panel is open, so other back-button handlers can leave the press to the chat. */
let chatPanelOpen = false
export const isChatPanelOpen = () => chatPanelOpen
export const setChatPanelOpen = (open: boolean) => {
  chatPanelOpen = open
}

/** Sends the conversation and returns the assistant's reply. The server checks the admin switch for this app. */
export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${CHAT_API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId: CHAT_APP_ID, messages: messages.slice(-20) }),
    signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 403) throw new ChatDisabledError()
  if (!response.ok) throw new Error(`Chat request failed (${response.status})`)
  return ((await response.json()) as { reply: string }).reply
}
