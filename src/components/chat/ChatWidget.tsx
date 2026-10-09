import { useEffect, useRef, useState, type FormEvent } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { MessageCircle, Send, X } from 'lucide-react'
import { useChatbotEnabled } from '../../hooks/useChatbotEnabled'
import { ChatDisabledError, CHAT_APP_NAME, sendChat, setChatPanelOpen, type ChatMessage } from '../../services/chat/chatService'
import { isNativeAndroid } from '../../utils/platform'
import { IconButton } from '../common/IconButton'
import styles from './ChatWidget.module.css'

/**
 * Floating PlourX AI assistant. It only appears when an admin has enabled it for this app (PlourX website admin
 * settings): a launcher button that opens a chat panel backed by the shared /api/chat function. The server re-checks
 * the admin switch on every request.
 */
export function ChatWidget() {
  const allowed = useChatbotEnabled()
  const [revoked, setRevoked] = useState(false)
  const [open, setOpen] = useState(false)
  // The greeting is rendered separately and is not part of the history sent to the model.
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, loading, error])

  useEffect(() => {
    setChatPanelOpen(open)
    if (!open) return
    inputRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    // Android back closes the panel. useHardwareBackButton skips its own handling while the panel is open.
    const sub = isNativeAndroid() ? CapacitorApp.addListener('backButton', () => setOpen(false)) : null
    return () => {
      window.removeEventListener('keydown', onKey)
      void sub?.then((handle) => handle.remove())
      setChatPanelOpen(false)
    }
  }, [open])

  if (!allowed || revoked) return null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || loading) return

    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setError(false)
    setLoading(true)
    try {
      const reply = await sendChat(next)
      setMessages((current) => [...current, { role: 'model', content: reply }])
    } catch (err) {
      // An admin switched the assistant off after this screen loaded: close and hide it.
      if (err instanceof ChatDisabledError) {
        setOpen(false)
        setRevoked(true)
      } else {
        setError(true)
      }
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className={styles.root}>
      {!open ? (
        <button type="button" className={styles.launcher} aria-label="Chat with PlourX AI" onClick={() => setOpen(true)}>
          <MessageCircle aria-hidden="true" />
        </button>
      ) : (
        <div className={styles.panel} role="dialog" aria-label="PlourX AI">
          <div className={styles.head}>
            <span className={styles.title}>PlourX AI</span>
            <IconButton size="sm" label="Close chat" icon={<X size={18} />} onClick={() => setOpen(false)} />
          </div>

          <div ref={listRef} className={styles.list} aria-live="polite">
            <div className={`${styles.bubble} ${styles.model}`}>Hi! I’m PlourX AI 👋 Ask me anything about {CHAT_APP_NAME} or the PlourX ecosystem.</div>
            {messages.map((message, index) => (
              <div key={index} className={`${styles.bubble} ${message.role === 'user' ? styles.user : styles.model}`}>
                {message.content}
              </div>
            ))}
            {loading && <div className={`${styles.bubble} ${styles.model}`}>Typing…</div>}
            {error && (
              <p role="alert" className={styles.error}>
                Couldn’t reach PlourX AI right now. Please try again in a moment.
              </p>
            )}
          </div>

          <form onSubmit={submit} className={styles.form}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about PlourX…"
              aria-label="Message"
              maxLength={2000}
              disabled={loading}
            />
            <button type="submit" className={styles.send} aria-label="Send" disabled={loading || !input.trim()}>
              <Send aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
