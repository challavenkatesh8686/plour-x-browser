import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { accentLabels, hexToHsv, hsvToHex, normalizeHex, type Hsv } from '../../utils/customAccent'
import './AccentPicker.css'

interface AccentPickerProps {
  initial: string
  onApply: (hex: string) => void
  onCancel: () => void
}

export function AccentPicker({ initial, onApply, onCancel }: AccentPickerProps) {
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
        <div className="px-ap-actions">
          <button type="button" className="px-ap-btn" onClick={onCancel}>
            {labels.cancel}
          </button>
          <button type="button" className="px-ap-btn px-ap-btn-primary" disabled={!validText} onClick={() => onApply(hex)}>
            {labels.apply}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
