/**
 * PlourX social media accounts shown in the footer. Put each account's full address in `url`
 * (for example "https://www.instagram.com/yourhandle"). An entry with an empty `url` is still drawn, but is not a link yet.
 */
export interface SocialLink {
  id: 'facebook' | 'instagram' | 'x' | 'linkedin' | 'youtube' | 'reddit';
  label: string;
  url: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { id: 'facebook', label: 'Facebook', url: '' },
  { id: 'instagram', label: 'Instagram', url: '' },
  { id: 'x', label: 'X (Twitter)', url: '' },
  { id: 'linkedin', label: 'LinkedIn', url: '' },
  { id: 'youtube', label: 'YouTube', url: '' },
  { id: 'reddit', label: 'Reddit', url: '' },
];

/**
 * Mobile app store pages shown under "Download Mobile App" in the footer. Put the full address in `url`;
 * an entry with an empty `url` is still drawn, but is not a link yet.
 */
export const APP_STORE_LINKS: { id: 'google-play' | 'app-store'; label: string; url: string }[] = [
  { id: 'google-play', label: 'Google Play', url: '' },
  { id: 'app-store', label: 'App Store', url: '' },
];
