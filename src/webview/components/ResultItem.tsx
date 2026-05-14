import React from 'react';
import type { SearchResult } from '../../shared/types';

interface Props {
  result: SearchResult;
  onClick: (result: SearchResult) => void;
  animationDelay?: number;
}

export function ResultItem({ result, onClick, animationDelay = 0 }: Props) {
  return (
    <div
      className="result-item"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={() => onClick(result)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(result)}
    >
      <span className={`result-item__badge result-item__badge--${result.kind}`}>
        {result.kind === 'variable' ? 'var' : result.kind === 'function' ? 'fn' : 'str'}
      </span>
      <div className="result-item__body">
        <div className="result-item__name">
          {result.displayName}
          {result.kind === 'variable' && result.typeText && (
            <span className="result-item__type">{result.typeText}</span>
          )}
        </div>
        {result.snippet && (
          <div className="result-item__snippet">{result.snippet}</div>
        )}
        <div className="result-item__line">Line {result.line}</div>
      </div>
    </div>
  );
}
