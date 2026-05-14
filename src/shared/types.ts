export type MatchKind = 'variable' | 'function' | 'string';

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  snippet: string;
  kind: MatchKind;
  displayName: string;
  typeText?: string;
}

/** Raw match from the engine — no display label yet */
export interface RawFileMatch {
  file: string;
  results: SearchResult[];
}

/** FileMatch with host-decorated display label for the webview */
export interface FileMatch extends RawFileMatch {
  displayPath: string;
}

export interface SearchOptions {
  query: string;
  kinds: MatchKind[];
  useRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  includeGlob: string;
  excludeGlob: string;
  respectGitignore: boolean;
}

export interface PersistedState {
  kinds: MatchKind[];
  useRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  includeGlob: string;
  excludeGlob: string;
  respectGitignore: boolean;
}
