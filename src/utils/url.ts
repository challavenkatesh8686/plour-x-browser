import { buildSearchUrl } from '../services/search/searchEngineService';

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
// A bare "word.tld" or "word.tld/path" with no spaces, e.g. "example.com" or "localhost:3000".
const BARE_DOMAIN_RE = /^[^\s/]+\.[^\s/]{2,}(\/.*)?$/i;
const LOCALHOST_RE = /^localhost(:\d+)?(\/.*)?$/i;

export function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  if (SCHEME_RE.test(trimmed)) return true;
  if (LOCALHOST_RE.test(trimmed)) return true;
  return BARE_DOMAIN_RE.test(trimmed);
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  return SCHEME_RE.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Resolves address-bar / new-tab input into a URL: direct navigation for URL-shaped input, search otherwise. */
export function resolveAddressBarInput(input: string): string {
  const trimmed = input.trim();
  return looksLikeUrl(trimmed) ? normalizeUrl(trimmed) : buildSearchUrl(trimmed);
}

export function getDisplayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
