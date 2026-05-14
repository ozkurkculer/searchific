import React from 'react';

interface Props {
  onRefresh: () => void;
  onClear: () => void;
  onCollapseAll: () => void;
  hasResults: boolean;
}

export function HeaderActions({ onRefresh, onClear, onCollapseAll, hasResults }: Props) {
  return (
    <div className="header-actions">
      <button
        type="button"
        className="header-actions__btn"
        onClick={onRefresh}
        title="Refresh"
        aria-label="Refresh search"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M13 2.5v4h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 6.5A5.5 5.5 0 1 1 9.3 2.65" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
      <button
        type="button"
        className="header-actions__btn"
        onClick={onClear}
        title="Clear search"
        aria-label="Clear search"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
      <button
        type="button"
        className="header-actions__btn"
        onClick={onCollapseAll}
        title="Collapse all"
        aria-label="Collapse all results"
        disabled={!hasResults}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <line x1="1.5" y1="4" x2="14.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="1.5" y1="8.5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <polyline points="10.5,6.5 13.5,8.5 10.5,10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="1.5" y1="13" x2="14.5" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
