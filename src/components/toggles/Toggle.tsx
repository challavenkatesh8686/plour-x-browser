import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { DESIGN_BODIES } from './designs/bodies';
import { pickToggleType, useToggleSettings } from './provider';
import { getToggleDef } from './registry';
import { resolveToggleConfig, toggleCssVars } from './resolveConfig';
import type { ToggleConfig, ToggleId } from './types';
import './toggles.css';
import './toggles-a.css';
import './toggles-b.css';
import './toggles-c.css';

export interface ToggleProps {
  /** Design. Omit to use the global default from <ToggleSettingsProvider> (built-in default: classic). */
  type?: ToggleId;
  /** Controlled value. Omit for uncontrolled (see defaultChecked). */
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Focusable and announced, but the value cannot be changed. */
  readOnly?: boolean;
  /** Per-toggle config override (wins over the global defaults and per-design admin config). */
  config?: ToggleConfig;
  /** Visible label; clicking it toggles, and it names the switch. */
  label?: ReactNode;
  name?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  title?: string;
}

export function Toggle({
  type, checked, defaultChecked = false, onChange, disabled = false, readOnly = false, config, label, name, id, className, style, title, ...aria
}: ToggleProps) {
  const settings = useToggleSettings();
  const kind = pickToggleType(type, settings);
  const def = getToggleDef(kind);
  const kindConfig = settings.configs[kind];
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- inputs are listed explicitly
  const cfg = useMemo(() => resolveToggleConfig(kind, settings.defaults, kindConfig, config), [kind, settings.defaults, kindConfig, config]);

  const controlled = checked !== undefined;
  const [inner, setInner] = useState(defaultChecked);
  const on = controlled ? checked : inner;

  // Entrance animations must not play on mount, only after the value actually changes.
  const [touched, setTouched] = useState(false);
  const prev = useRef(on);
  useEffect(() => {
    if (prev.current !== on) {
      prev.current = on;
      setTouched(true);
    }
  }, [on]);

  const autoId = useId();
  const btnId = id ?? `tgl-${autoId}`;
  const labelId = `${btnId}-label`;

  const toggle = useCallback(() => {
    if (disabled || readOnly) return;
    const next = !on;
    if (!controlled) setInner(next);
    onChange?.(next);
  }, [disabled, readOnly, on, controlled, onChange]);

  const Body = DESIGN_BODIES[kind];
  const reverse = cfg.direction === 'reverse';
  const hasAnim = def.relevant.includes('animation') && cfg.animation !== 'slide';

  const button = (
    <button
      type="button"
      role="switch"
      id={btnId}
      className={`tgl${className ? ` ${className}` : ''}`}
      aria-checked={on}
      aria-readonly={readOnly || undefined}
      aria-label={aria['aria-label']}
      aria-labelledby={aria['aria-labelledby'] ?? (label != null && !aria['aria-label'] ? labelId : undefined)}
      aria-describedby={aria['aria-describedby']}
      title={title}
      disabled={disabled}
      onClick={toggle}
      data-type={kind}
      data-state={on ? 'on' : 'off'}
      data-end={on !== reverse ? 'true' : 'false'}
      data-dir={cfg.direction}
      data-appearance={cfg.appearance}
      data-anim={hasAnim ? cfg.animation : undefined}
      data-touched={touched ? 'true' : undefined}
      data-readonly={readOnly ? 'true' : undefined}
      style={{ ...toggleCssVars(cfg), ...style }}
    >
      <Body cfg={cfg} />
    </button>
  );

  return (
    <span className="tgl-root" data-disabled={disabled ? 'true' : undefined}>
      {button}
      {label != null && (
        <label id={labelId} htmlFor={btnId} className="tgl-label">
          {label}
        </label>
      )}
      {name !== undefined && <input type="hidden" name={name} value={on ? 'on' : ''} disabled={disabled} />}
    </span>
  );
}
