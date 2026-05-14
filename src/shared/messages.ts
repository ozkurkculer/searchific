import type { FileMatch, SearchOptions, PersistedState } from './types';

// Webview → Host
export type WebviewMessage =
  | { type: 'search'; queryId: number; options: SearchOptions }
  | { type: 'reveal'; file: string; line: number; column: number }
  | { type: 'persistState'; state: PersistedState }
  | { type: 'ready' };

// Host → Webview
export type HostMessage =
  | { type: 'results'; queryId: number; batch: FileMatch[]; done: boolean; truncated: boolean }
  | { type: 'error'; message: string }
  | { type: 'searching'; queryId: number }
  | { type: 'hydrate'; state: PersistedState | null };
