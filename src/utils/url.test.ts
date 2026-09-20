import { describe, expect, it } from 'vitest';
import { getDisplayHost, looksLikeUrl, normalizeUrl, resolveAddressBarInput } from './url';

describe('looksLikeUrl', () => {
  it('accepts bare domains', () => {
    expect(looksLikeUrl('example.com')).toBe(true);
    expect(looksLikeUrl('www.example.com')).toBe(true);
  });

  it('accepts full URLs with scheme, path, and query', () => {
    expect(looksLikeUrl('https://example.com')).toBe(true);
    expect(looksLikeUrl('http://example.com/path')).toBe(true);
    expect(looksLikeUrl('https://example.com/path?query=1')).toBe(true);
  });

  it('accepts localhost with or without a port', () => {
    expect(looksLikeUrl('localhost')).toBe(true);
    expect(looksLikeUrl('localhost:3000')).toBe(true);
  });

  it('accepts a bare IP address', () => {
    expect(looksLikeUrl('192.168.1.1')).toBe(true);
  });

  it('rejects search queries with spaces', () => {
    expect(looksLikeUrl('hello world')).toBe(false);
    expect(looksLikeUrl('PlourX Browser')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(looksLikeUrl('')).toBe(false);
    expect(looksLikeUrl('   ')).toBe(false);
  });

  it('rejects a single word with no dot (would be a bad guess as a domain)', () => {
    expect(looksLikeUrl('example')).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('adds https:// to a bare domain', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('leaves an explicit scheme untouched', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
  });
});

describe('resolveAddressBarInput', () => {
  it('resolves a bare domain to a direct https navigation, not a search', () => {
    expect(resolveAddressBarInput('example.com')).toBe('https://example.com');
  });

  it('resolves a natural-language query to a search URL using the default engine', () => {
    const result = resolveAddressBarInput('hello world');
    expect(result).toContain('google.com/search');
    expect(result).toContain('hello%20world');
  });
});

describe('getDisplayHost', () => {
  it('strips the scheme and a leading www.', () => {
    expect(getDisplayHost('https://www.example.com/path')).toBe('example.com');
  });

  it('falls back to the raw input for an unparsable URL', () => {
    expect(getDisplayHost('not a url')).toBe('not a url');
  });
});
