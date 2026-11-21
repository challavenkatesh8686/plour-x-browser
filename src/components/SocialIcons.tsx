import type { ReactNode } from 'react';
import { SOCIAL_LINKS, type SocialLink } from '../config/social';
import './SocialIcons.css';

const GLYPH: Record<SocialLink['id'], { color: string; art: ReactNode }> = {
  facebook: {
    color: '#1877f2',
    art: <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2v2.2H7.7V13h2.7v8z" fill="currentColor" />,
  },
  instagram: {
    color: '#e1306c',
    art: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </>
    ),
  },
  x: {
    color: '#111111',
    art: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor" />,
  },
  linkedin: {
    color: '#0a66c2',
    art: <path d="M6 9H3v12h3zM4.5 3a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6zM21 21h-3v-6c0-1.6-.6-2.6-2-2.6-1.2 0-2 .8-2.3 1.6V21h-3V9h3v1.3c.5-.8 1.6-1.5 3-1.5 2.4 0 4.3 1.5 4.3 4.7z" fill="currentColor" />,
  },
  youtube: {
    color: '#ff0033',
    art: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="currentColor" />
        <path d="M10 9.5v5l4.5-2.5z" fill="#fff" />
      </>
    ),
  },
  reddit: {
    color: '#ff4500',
    art: (
      <>
        <ellipse cx="12" cy="14" rx="8" ry="5.8" fill="currentColor" />
        <circle cx="4.6" cy="11.4" r="2" fill="currentColor" />
        <circle cx="19.4" cy="11.4" r="2" fill="currentColor" />
        <circle cx="16.6" cy="4.4" r="1.7" fill="currentColor" />
        <path d="M12 8.2l1.2-4.4 3.4.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="13" r="1.3" fill="#fff" />
        <circle cx="15" cy="13" r="1.3" fill="#fff" />
        <path d="M9 16.2c1.8 1.2 4.2 1.2 6 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
};

/** The PlourX social icons, like the website's footer: white rounded tiles with a soft shadow, each in its brand colour, lifting on hover.
 *  An icon without an address yet (see config/social.ts) is drawn but is not a link. */
export function SocialIcons() {
  return (
    <div className="plx-social-row">
      <ul className="plx-social" aria-label="PlourX on social media">
        {SOCIAL_LINKS.map((s) => {
          const g = GLYPH[s.id];
          const icon = (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
              {g.art}
            </svg>
          );
          return (
            <li key={s.id}>
              {s.url ? (
                <a className="plx-social__tile" style={{ color: g.color }} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`PlourX on ${s.label}`} title={s.label}>
                  {icon}
                </a>
              ) : (
                <span className="plx-social__tile" style={{ color: g.color }} role="img" aria-label={s.label} title={`${s.label} (link coming soon)`}>
                  {icon}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
