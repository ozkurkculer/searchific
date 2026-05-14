import React from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  useRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  onToggleRegex: () => void;
  onToggleCase: () => void;
  onToggleWord: () => void;
}

export function SearchBar({
  value, onChange,
  useRegex, caseSensitive, wholeWord,
  onToggleRegex, onToggleCase, onToggleWord,
}: Props) {
  return (
    <div className="search-bar">
      <input
        className="search-bar__input"
        type="text"
        placeholder="Search…"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus
        spellCheck={false}
      />
      <Toggle label=".*" active={useRegex} title="Use Regular Expression" onClick={onToggleRegex} />
      <Toggle label="Aa" active={caseSensitive} title="Match Case" onClick={onToggleCase} />
      <Toggle label="\b" active={wholeWord} title="Match Whole Word" onClick={onToggleWord} />
    </div>
  );
}

function Toggle({ label, active, title, onClick }: {
  label: string; active: boolean; title: string; onClick: () => void;
}) {
  return (
    <button
      className={`search-bar__toggle${active ? ' search-bar__toggle--active' : ''}`}
      title={title}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
