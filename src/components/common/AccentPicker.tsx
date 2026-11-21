import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { accentLabels, hexToHsv, hsvToHex, normalizeHex, type Hsv } from '../../utils/customAccent'
import './AccentPicker.css'

/** Refuses an accent that would not show on the page in the current mode, by the same idea as the Website Builder's body-colour rule:
 *  at least 3:1 against the page, so no white or very light accent in light mode and no black or very dark accent in dark mode. */
function accentProblem(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return 'Enter a colour like #e8489e.'
  const n = parseInt(m[1], 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const lum = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  const theme = document.documentElement.getAttribute('data-theme')
  const dark = theme ? theme === 'dark' : !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const page = dark ? 0.004 : 1
  const contrast = (Math.max(lum, page) + 0.05) / (Math.min(lum, page) + 0.05)
  if (contrast >= 3) return null
  return dark ? 'Too dark for dark mode: it would not show on the dark page. Pick a lighter colour.' : 'Too light for light mode: it would not show on the white page. Pick a darker colour.'
}


interface AccentPickerProps {
  initial: string
  onApply: (hex: string) => void
  onCancel: () => void
  /** Refuses a colour: returns a message, which is shown and blocks Apply. Defaults to the built-in accent rule. */
  validate?: (hex: string) => string | null
}

export function AccentPicker({ initial, onApply, onCancel, validate }: AccentPickerProps) {
  const labels = accentLabels()
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(initial))
  const hex = hsvToHex(hsv)
  const [text, setText] = useState(hex)
  const areaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const update = (next: Hsv) => {
    setHsv(next)
    setText(hsvToHex(next))
  }

  const pickArea = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = areaRef.current!.getBoundingClientRect()
    const s = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const v = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    update({ ...hsv, s, v })
  }

  const onText = (value: string) => {
    setText(value)
    const valid = normalizeHex(value)
    if (valid) setHsv(hexToHsv(valid))
  }

  const validText = normalizeHex(text) !== null
  const problem = validate ? validate(hex) : accentProblem(hex)

  return createPortal(
    <div className="px-ap-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="px-ap" role="dialog" aria-modal="true" aria-label={labels.title}>
        <p className="px-ap-title">{labels.title}</p>
        <div
          ref={areaRef}
          className="px-ap-area"
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            pickArea(e)
          }}
          onPointerMove={(e) => e.buttons && pickArea(e)}
        >
          <span className="px-ap-thumb" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }} />
        </div>
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h)}
          className="px-ap-hue"
          aria-label={labels.hue}
          onChange={(e) => update({ ...hsv, h: Number(e.target.value) })}
        />
        <div className="px-ap-fields">
          <span className="px-ap-preview" style={{ background: hex }} role="img" aria-label={labels.preview} />
          <input
            className="px-ap-hex"
            value={text}
            maxLength={7}
            spellCheck={false}
            aria-label="HEX"
            aria-invalid={!validText}
            onChange={(e) => onText(e.target.value)}
          />
        </div>
        {problem && <p role="alert" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.35, color: '#ef4444' }}>{problem}</p>}
        <div className="px-ap-actions">
          <button type="button" className="px-ap-btn" onClick={onCancel}>
            {labels.cancel}
          </button>
          <button type="button" className="px-ap-btn px-ap-btn-primary" disabled={!validText || !!problem} onClick={() => onApply(hex)}>
            {labels.apply}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
