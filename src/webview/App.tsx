import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { MatchKind, FileMatch, SearchResult, PersistedState } from '../shared/types';
import type { HostMessage } from '../shared/messages';
import { SearchBar } from './components/SearchBar';
import { FilterChips } from './components/FilterChips';
import { GlobFields } from './components/GlobFields';
import { HeaderActions } from './components/HeaderActions';
import { ResultList } from './components/ResultList';
import { EmptyState } from './components/EmptyState';
import { useVscodeApi } from './hooks/useVscodeApi';
import { useDebouncedQuery } from './hooks/useDebouncedQuery';

const ALL_KINDS: MatchKind[] = ['variable', 'function', 'string'];

type UIState = 'idle' | 'loading' | 'results' | 'no-results' | 'error';

export function App() {
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [activeKinds, setActiveKinds] = useState<Set<MatchKind>>(new Set(ALL_KINDS));
  const [includeGlob, setIncludeGlob] = useState('');
  const [excludeGlob, setExcludeGlob] = useState('');
  const [respectGitignore, setRespectGitignore] = useState(true);

  const [uiState, setUiState] = useState<UIState>('idle');
  const [matches, setMatches] = useState<FileMatch[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  const [refreshTick, setRefreshTick] = useState(0);

  const queryIdRef = useRef(0);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debouncedQuery = useDebouncedQuery(query);

  const handleMessage = useCallback((msg: HostMessage) => {
    if (msg.type === 'hydrate') {
      if (msg.state) {
        setActiveKinds(new Set(msg.state.kinds));
        setUseRegex(msg.state.useRegex);
        setCaseSensitive(msg.state.caseSensitive);
        setWholeWord(msg.state.wholeWord);
        setIncludeGlob(msg.state.includeGlob);
        setExcludeGlob(msg.state.excludeGlob);
        setRespectGitignore(msg.state.respectGitignore ?? true);
      }
      setHydrated(true);
    } else if (msg.type === 'searching') {
      if (msg.queryId === queryIdRef.current) {
        setUiState('loading');
        setMatches([]);
        setTruncated(false);
        setCollapsedFiles(new Set());
      }
    } else if (msg.type === 'results') {
      if (msg.queryId !== queryIdRef.current) {return;}
      setMatches(prev => {
        const merged = [...prev];
        for (const fm of msg.batch) {
          const existing = merged.find(m => m.file === fm.file);
          if (existing) {
            existing.results.push(...fm.results);
          } else {
            merged.push({ ...fm });
          }
        }
        if (msg.done) {
          setUiState(merged.length > 0 ? 'results' : 'no-results');
          if (msg.truncated) {setTruncated(true);}
        }
        return merged;
      });
    } else if (msg.type === 'error') {
      setErrorMessage(msg.message);
      setUiState('error');
    }
  }, []);

  const { post } = useVscodeApi(handleMessage);

  useEffect(() => {
    post({ type: 'ready' });
  }, [post]);

  // Persist filter state (not the query) — 200ms debounce
  useEffect(() => {
    if (!hydrated) {return;}
    clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      const state: PersistedState = {
        kinds: Array.from(activeKinds),
        useRegex,
        caseSensitive,
        wholeWord,
        includeGlob,
        excludeGlob,
        respectGitignore,
      };
      post({ type: 'persistState', state });
    }, 200);
    return () => clearTimeout(persistTimerRef.current);
  }, [activeKinds, useRegex, caseSensitive, wholeWord, includeGlob, excludeGlob, respectGitignore, hydrated, post]);

  // Trigger search
  useEffect(() => {
    if (!hydrated) {return;}
    if (!debouncedQuery.trim()) {
      setUiState('idle');
      setMatches([]);
      return;
    }
    const id = ++queryIdRef.current;
    setMatches([]);
    setTruncated(false);
    setCollapsedFiles(new Set());
    setUiState('loading');
    post({
      type: 'search',
      queryId: id,
      options: {
        query: debouncedQuery,
        kinds: Array.from(activeKinds),
        useRegex,
        caseSensitive,
        wholeWord,
        includeGlob,
        excludeGlob,
        respectGitignore,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, activeKinds, useRegex, caseSensitive, wholeWord, includeGlob, excludeGlob, respectGitignore, hydrated, post, refreshTick]);

  const toggleKind = useCallback((kind: MatchKind) => {
    setActiveKinds(prev => {
      const next = new Set(prev);
      if (next.has(kind)) {
        if (next.size === 1) {return prev;}
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  }, []);

  const handleReveal = useCallback((result: SearchResult) => {
    post({ type: 'reveal', file: result.file, line: result.line, column: result.column });
  }, [post]);

  const handleRefresh = useCallback(() => {
    if (!debouncedQuery.trim()) {return;}
    setRefreshTick(t => t + 1);
  }, [debouncedQuery]);

  const handleClear = useCallback(() => {
    setQuery('');
    setMatches([]);
    setTruncated(false);
    setUiState('idle');
    setCollapsedFiles(new Set());
  }, []);

  const handleCollapseAll = useCallback(() => {
    setCollapsedFiles(prev => new Set([...prev, ...matches.map(m => m.file)]));
  }, [matches]);

  const handleToggleFile = useCallback((file: string) => {
    setCollapsedFiles(prev => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  }, []);

  if (!hydrated) {
    return (
      <div className="app">
        <div className="state-container">
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  const showResults = uiState === 'results' || (uiState === 'loading' && matches.length > 0);

  return (
    <div className="app">
      <div className="app__header">
        <HeaderActions
          onRefresh={handleRefresh}
          onClear={handleClear}
          onCollapseAll={handleCollapseAll}
          hasResults={matches.length > 0}
        />
        <SearchBar
          value={query}
          onChange={setQuery}
          useRegex={useRegex}
          caseSensitive={caseSensitive}
          wholeWord={wholeWord}
          onToggleRegex={() => setUseRegex(v => !v)}
          onToggleCase={() => setCaseSensitive(v => !v)}
          onToggleWord={() => setWholeWord(v => !v)}
        />
        <FilterChips active={activeKinds} onToggle={toggleKind} />
        <GlobFields
          include={includeGlob}
          exclude={excludeGlob}
          onIncludeChange={setIncludeGlob}
          onExcludeChange={setExcludeGlob}
          respectGitignore={respectGitignore}
          onRespectGitignoreChange={setRespectGitignore}
        />
      </div>
      <div className="app__results">
        {showResults ? (
          <ResultList
            matches={matches}
            onReveal={handleReveal}
            truncated={truncated}
            collapsedFiles={collapsedFiles}
            onToggleFile={handleToggleFile}
          />
        ) : (
          <EmptyState
            state={uiState === 'idle' ? 'idle' : uiState === 'loading' ? 'loading' : uiState === 'no-results' ? 'no-results' : 'error'}
            errorMessage={errorMessage}
            query={debouncedQuery}
          />
        )}
      </div>
    </div>
  );
}
