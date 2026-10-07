import { beforeEach, describe, expect, it } from 'vitest';
import { addBookmark, clearAll, listBookmarks } from './bookmarksService';

describe('bookmarksService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears every bookmark', () => {
    addBookmark({ url: 'https://example.com', title: 'Example', faviconUrl: null });
    addBookmark({ url: 'https://example.org', title: 'Example Org', faviconUrl: null });
    expect(listBookmarks()).toHaveLength(2);

    clearAll();
    expect(listBookmarks()).toHaveLength(0);
  });
});
