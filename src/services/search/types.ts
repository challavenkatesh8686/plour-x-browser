export interface SearchEngine {
  id: string;
  name: string;
  homeUrl: string;
  /** `{query}` is replaced with the encoded search terms. */
  searchUrlTemplate: string;
  faviconUrl: string;
  isBuiltIn: true;
}
