import { beforeEach, describe, expect, it } from 'vitest';
import { buildSearchUrl, getSearchEngines, getSelectedSearchEngine, setSelectedSearchEngine } from './searchEngineService';
import { DEFAULT_SEARCH_ENGINES } from './searchEngines';

beforeEach(() => {
  localStorage.clear();
});

describe('getSearchEngines', () => {
  it('returns all 7 built-in engines', () => {
    expect(getSearchEngines()).toHaveLength(7);
    expect(getSearchEngines()).toBe(DEFAULT_SEARCH_ENGINES);
  });
});

describe('getSelectedSearchEngine / setSelectedSearchEngine', () => {
  it('defaults to Google when nothing has been selected', () => {
    expect(getSelectedSearchEngine().id).toBe('google');
  });

  it('persists the user selection across calls', () => {
    setSelectedSearchEngine('duckduckgo');
    expect(getSelectedSearchEngine().id).toBe('duckduckgo');
  });

  it('falls back to the first engine if the stored id no longer exists', () => {
    setSelectedSearchEngine('some-removed-custom-engine');
    expect(getSelectedSearchEngine().id).toBe(getSearchEngines()[0].id);
  });
});

describe('buildSearchUrl', () => {
  it('encodes the query into the selected engine’s search URL', () => {
    setSelectedSearchEngine('bing');
    const url = buildSearchUrl('hello world');
    expect(url).toBe('https://www.bing.com/search?q=hello%20world');
  });

  it('accepts an explicit engine override, ignoring the stored preference', () => {
    setSelectedSearchEngine('google');
    const ecosia = getSearchEngines().find((e) => e.id === 'ecosia')!;
    expect(buildSearchUrl('plants', ecosia)).toBe('https://www.ecosia.org/search?q=plants');
  });
});
