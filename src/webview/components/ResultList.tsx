import React from 'react';
import type { FileMatch, SearchResult } from '../../shared/types';
import { ResultItem } from './ResultItem';

interface Props {
  matches: FileMatch[];
  onReveal: (result: SearchResult) => void;
  truncated?: boolean;
  collapsedFiles: Set<string>;
  onToggleFile: (file: string) => void;
}

export function ResultList({ matches, onReveal, truncated, collapsedFiles, onToggleFile }: Props) {
  const total = matches.reduce((s, m) => s + m.results.length, 0);

  return (
    <div className="result-list">
      <div className="count-bar">
        {total} result{total !== 1 ? 's' : ''} in {matches.length} file{matches.length !== 1 ? 's' : ''}
        {truncated && (
          <span className="count-bar__truncated">
            · Showing first 2000 — refine your query
          </span>
        )}
      </div>
      {matches.map(fm => (
        <FileGroup
          key={fm.file}
          match={fm}
          onReveal={onReveal}
          isOpen={!collapsedFiles.has(fm.file)}
          onToggle={() => onToggleFile(fm.file)}
        />
      ))}
    </div>
  );
}

interface FileGroupProps {
  match: FileMatch;
  onReveal: (r: SearchResult) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function FileGroup({ match, onReveal, isOpen, onToggle }: FileGroupProps) {
  return (
    <div className="file-group">
      <div className="file-group__header" onClick={onToggle}>
        <span className={`file-group__arrow${isOpen ? ' file-group__arrow--open' : ''}`}>▶</span>
        <span className="file-group__name" title={match.file}>{match.displayPath}</span>
        <span className="file-group__count">{match.results.length}</span>
      </div>
      {isOpen && match.results.map((r, i) => (
        <ResultItem
          key={`${r.line}-${r.column}`}
          result={r}
          onClick={onReveal}
          animationDelay={Math.min(i * 15, 150)}
        />
      ))}
    </div>
  );
}
