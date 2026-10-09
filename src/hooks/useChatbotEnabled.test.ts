import { afterEach, describe, expect, it, vi } from 'vitest'

vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon')
vi.stubEnv('VITE_API_BASE', 'https://api.example.com/')

const { fetchChatbotEnabled } = await import('./useChatbotEnabled')
const { sendChat, ChatDisabledError } = await import('../services/chat/chatService')

const respond = (status: number, body: unknown) => vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body })

afterEach(() => vi.unstubAllGlobals())

describe('fetchChatbotEnabled', () => {
  it('is on only for an explicit true', async () => {
    vi.stubGlobal('fetch', respond(200, [{ enabled: true }]))
    expect(await fetchChatbotEnabled()).toBe(true)
  })

  it('is off for false, a missing row, and errors', async () => {
    vi.stubGlobal('fetch', respond(200, [{ enabled: false }]))
    expect(await fetchChatbotEnabled()).toBe(false)
    vi.stubGlobal('fetch', respond(200, []))
    expect(await fetchChatbotEnabled()).toBe(false)
    vi.stubGlobal('fetch', respond(404, {}))
    expect(await fetchChatbotEnabled()).toBe(false)
  })

  it('asks for this app only, using the anon key', async () => {
    const fetchMock = respond(200, [])
    vi.stubGlobal('fetch', fetchMock)
    await fetchChatbotEnabled()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/rest/v1/chatbot_app_settings?select=enabled&app_id=eq.browser')
    expect((init.headers as Record<string, string>).apikey).toBe('anon')
  })
})

describe('sendChat', () => {
  it('posts the app id with the conversation and returns the reply', async () => {
    const fetchMock = respond(200, { reply: 'hello' })
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendChat([{ role: 'user', content: 'hi' }])).toBe('hello')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.example.com/api/chat')
    const body = JSON.parse(String(init.body)) as { appId: string; messages: unknown[] }
    expect(body.appId).toBe('browser')
    expect(body.messages).toHaveLength(1)
  })

  it('reports a server-side "not enabled" as ChatDisabledError', async () => {
    vi.stubGlobal('fetch', respond(403, { code: 'disabled' }))
    await expect(sendChat([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(ChatDisabledError)
  })

  it('throws on other failures', async () => {
    vi.stubGlobal('fetch', respond(502, {}))
    await expect(sendChat([{ role: 'user', content: 'hi' }])).rejects.toThrow('502')
  })
})
