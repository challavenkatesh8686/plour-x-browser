import { useEffect, useRef, useState, type FormEvent } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { useChatbotEnabled } from '../../hooks/useChatbotEnabled'
import { ChatDisabledError, CHAT_APP_NAME, sendChat, setChatPanelOpen, type ChatMessage } from '../../services/chat/chatService'
import { isNativeAndroid } from '../../utils/platform'
import styles from './ChatWidget.module.css'

const LOGO = `${import.meta.env.BASE_URL}ai/plourx-ai-logo-256.png`
const STARTERS = ['What is PlourX?', 'What can this app do?', 'How do I get started?', 'How can I contact support?']

const svgProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
const IconClose = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
const IconSend = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M4 20l17-8L4 4l0 6.5L15 12 4 13.5 4 20Z" />
  </svg>
)

/** The PlourX AI mark: the same round neon logo the PlourX website chatbot uses. */
function AiLogo({ size }: { size: number }) {
  return (
    <span className={styles.logo} aria-hidden="true" style={{ width: size, height: size }}>
      <img src={LOGO} alt="" width={size} height={size} draggable={false} />
    </span>
  )
}

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
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
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

  const send = async (raw: string) => {
    const content = raw.trim()
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

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }

  const showStarters = messages.length === 0 && !loading

  return (
    <div className={styles.root}>
      {!open ? (
        <button type="button" className={styles.launcher} aria-label="Chat with PlourX AI" onClick={() => setOpen(true)}>
          <AiLogo size={56} />
        </button>
      ) : (
        <div className={styles.panel} role="dialog" aria-label="PlourX AI">
          <div className={styles.head}>
            <AiLogo size={28} />
            <span className={styles.title}>PlourX AI</span>
            <button type="button" className={styles.close} aria-label="Close chat" onClick={() => setOpen(false)}>
              <IconClose />
            </button>
          </div>

          <div ref={listRef} className={styles.list} role="log" aria-live="polite" aria-busy={loading}>
            <div className={`${styles.bubble} ${styles.model}`}>Hi! I’m PlourX AI 👋 Ask me anything about {CHAT_APP_NAME} or the PlourX ecosystem.</div>
            {showStarters && (
              <div className={styles.chips} role="group" aria-label="Suggested questions">
                {STARTERS.map((q) => (
                  <button key={q} type="button" className={styles.chip} onClick={() => void send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`${styles.bubble} ${message.role === 'user' ? styles.user : styles.model}`}>
                {message.content}
              </div>
            ))}
            {loading && (
              <div className={`${styles.bubble} ${styles.model} ${styles.typing}`} role="status" aria-label="PlourX AI is typing">
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            )}
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
              <IconSend />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
