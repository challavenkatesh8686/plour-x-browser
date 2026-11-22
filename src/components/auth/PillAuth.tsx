import { useState, useEffect, useRef, type ReactNode } from 'react';
import { ArrowRight, ChevronDown } from '../../lib/flatIcons/icons';
import './pillAuth.css';

/** Shared pieces of the PlourX sign in / sign up look: P mark head, pill fields (icon + bold label + hint inside), gradient button, disabled social row. */

const SOCIAL = ['Google', 'Microsoft', 'Apple'] as const;

function SocialGlyph({ name }: { name: (typeof SOCIAL)[number] }) {
  if (name === 'Google') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
        <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" />
        <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" />
      </svg>
    );
  }
  if (name === 'Microsoft') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
        <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
        <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
        <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.5 1.3-2.6 0 0-2.5-1-2.5-3.8zM14.1 5.8c.6-.8 1.1-1.8.9-2.8-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.3z" />
    </svg>
  );
}

/** Google / Microsoft / Apple row (disabled for now). */
export function PillSocial() {
  return (
    <div className="pxa-social" role="group" aria-label="Social sign-in (coming soon)">
      {SOCIAL.map((p) => (
        <button key={p} type="button" disabled title={`${p} sign-in is coming soon`} aria-label={`${p} sign-in (coming soon)`}>
          <SocialGlyph name={p} />
        </button>
      ))}
    </div>
  );
}

/** P mark above "PlourX", then the heading and subtitle. */
export function PillHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pxa-head">
      <span className="pxa-brand">
        <img src="/plourx-p-mark.png" alt="" width={64} height={64} decoding="async" />
        <span>PlourX</span>
      </span>
      <h1 className="pxa-title">{title}</h1>
      {subtitle && <p className="pxa-sub">{subtitle}</p>}
    </div>
  );
}

type FieldBase = { label: string; icon: ReactNode; error?: string | undefined };

/** Animated eye: blinks every few seconds, the lid and iris pop when toggled, and a slash draws across while the password is visible. */
function PxaEye({ shown }: { shown: boolean }) {
  const [clicked, setClicked] = useState(false);
  const prev = useRef(shown);
  useEffect(() => {
    if (prev.current !== shown) {
      prev.current = shown;
      setClicked(true);
    }
  }, [shown]);
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} className={`pxa-eyeicon${shown ? ' pxa-eye-shown' : ''}`} aria-hidden="true">
      <g key={shown ? 'on' : 'off'} className={`pxa-eye-open${clicked ? ' pxa-eye-click' : ''}`}>
        <path className="pxa-eye-shape" d="M2 12S5.8 5 12 5s10 7 10 7-3.8 7-10 7S2 12 2 12z" />
        <circle className="pxa-eye-iris" cx="12" cy="12" r="3.4" />
        <circle className="pxa-eye-pupil" cx="12" cy="12" r="1.3" />
      </g>
      <path className="pxa-eye-slash" d="M4 20 20 4" pathLength={1} />
    </svg>
  );
}

/** Pill field: leading icon, bold label above the input, and a show/hide button (with a small pop animation) for passwords. */
export function PillField({ label, icon, error, type = 'text', ...props }: FieldBase & React.InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="pxa-group">
      <label className={`pxa-field${error ? ' pxa-invalid' : ''}`}>
        <span className="pxa-icon" aria-hidden="true">{icon}</span>
        <span className="pxa-body">
          <span className="pxa-label">{label}</span>
          <input type={isPassword && shown ? 'text' : type} aria-invalid={Boolean(error)} {...props} />
        </span>
        {isPassword && (
          <button type="button" className="pxa-eye" onClick={() => setShown((v) => !v)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
            <PxaEye shown={shown} />
          </button>
        )}
      </label>
      {error && <span className="pxa-error" role="alert">{error}</span>}
    </div>
  );
}

/** Pill wrapper around a native select. */
export function PillSelect({ label, icon, error, children, ...props }: FieldBase & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="pxa-group">
      <label className={`pxa-field${error ? ' pxa-invalid' : ''}`}>
        <span className="pxa-icon" aria-hidden="true">{icon}</span>
        <span className="pxa-body">
          <span className="pxa-label">{label}</span>
          <select aria-invalid={Boolean(error)} {...props} style={{ color: props.value ? undefined : 'var(--pxa-muted)', ...props.style }}>
            {children}
          </select>
        </span>
        <ChevronDown className="pxa-chev" aria-hidden />
      </label>
      {error && <span className="pxa-error" role="alert">{error}</span>}
    </div>
  );
}

/** Pill wrapper around a custom control (e.g. a searchable country list). The control renders its own trigger and panel. */
export function PillBox({ label, icon, error, children }: FieldBase & { children: ReactNode }) {
  return (
    <div className="pxa-group">
      <div className={`pxa-field pxa-box${error ? ' pxa-invalid' : ''}`}>
        <span className="pxa-icon" aria-hidden="true">{icon}</span>
        <span className="pxa-body">
          <span className="pxa-label">{label}</span>
          {children}
        </span>
        <ChevronDown className="pxa-chev" aria-hidden />
      </div>
      {error && <span className="pxa-error" role="alert">{error}</span>}
    </div>
  );
}

/** Gradient submit button with the trailing arrow. */
export function PillSubmit({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="submit" className="pxa-submit" {...props}>
      {children}
      <ArrowRight aria-hidden />
    </button>
  );
}
