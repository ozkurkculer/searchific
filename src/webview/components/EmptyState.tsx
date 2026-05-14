import React from 'react';

type State = 'idle' | 'loading' | 'no-results' | 'error';

interface Props {
  state: State;
  errorMessage?: string;
  query: string;
}

export function EmptyState({ state, errorMessage, query }: Props) {
  if (state === 'idle') {
    return (
      <div className="state-container">
        <div className="state-container__icon">⌕</div>
        <p className="state-container__title">Better Search</p>
        <p className="state-container__sub">
          Filter by variable, function, or string.
          <br />
          Type to search your workspace.
        </p>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="state-container">
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <p className="state-container__title">Searching…</p>
      </div>
    );
  }

  if (state === 'no-results') {
    return (
      <div className="state-container">
        <div className="state-container__icon">∅</div>
        <p className="state-container__title">No results for "{query}"</p>
        <p className="state-container__sub">Try different filters or a broader query.</p>
      </div>
    );
  }

  return (
    <div className="state-container">
      <div className="state-container__icon">⚠</div>
      <p className="state-container__title">Search error</p>
      <p className="state-container__sub">{errorMessage}</p>
    </div>
  );
}
