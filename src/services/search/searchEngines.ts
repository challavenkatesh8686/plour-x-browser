import type { SearchEngine } from './types';

function favicon(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
}

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    homeUrl: 'https://www.google.com',
    searchUrlTemplate: 'https://www.google.com/search?q={query}',
    faviconUrl: favicon('google.com'),
    isBuiltIn: true,
  },
  {
    id: 'bing',
    name: 'Bing',
    homeUrl: 'https://www.bing.com',
    searchUrlTemplate: 'https://www.bing.com/search?q={query}',
    faviconUrl: favicon('bing.com'),
    isBuiltIn: true,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    homeUrl: 'https://duckduckgo.com',
    searchUrlTemplate: 'https://duckduckgo.com/?q={query}',
    faviconUrl: favicon('duckduckgo.com'),
    isBuiltIn: true,
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    homeUrl: 'https://www.yahoo.com',
    searchUrlTemplate: 'https://search.yahoo.com/search?p={query}',
    faviconUrl: favicon('yahoo.com'),
    isBuiltIn: true,
  },
  {
    id: 'brave',
    name: 'Brave Search',
    homeUrl: 'https://search.brave.com',
    searchUrlTemplate: 'https://search.brave.com/search?q={query}',
    faviconUrl: favicon('search.brave.com'),
    isBuiltIn: true,
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    homeUrl: 'https://www.ecosia.org',
    searchUrlTemplate: 'https://www.ecosia.org/search?q={query}',
    faviconUrl: favicon('ecosia.org'),
    isBuiltIn: true,
  },
  {
    id: 'startpage',
    name: 'Startpage',
    homeUrl: 'https://www.startpage.com',
    searchUrlTemplate: 'https://www.startpage.com/sp/search?query={query}',
    faviconUrl: favicon('startpage.com'),
    isBuiltIn: true,
  },
];
