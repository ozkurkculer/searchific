import React from 'react';
import type { MatchKind } from '../../shared/types';

const KINDS: { kind: MatchKind; label: string; icon: string }[] = [
  { kind: 'variable', label: 'Variable', icon: '𝑥' },
  { kind: 'function', label: 'Function', icon: 'ƒ' },
  { kind: 'string', label: 'String', icon: '"' },
];

interface Props {
  active: Set<MatchKind>;
  onToggle: (kind: MatchKind) => void;
}

export function FilterChips({ active, onToggle }: Props) {
  return (
    <div className="filter-chips">
      {KINDS.map(({ kind, label, icon }) => (
        <button
          key={kind}
          type="button"
          className={`chip chip--${kind}${active.has(kind) ? '' : ' chip--off'}`}
          onClick={() => onToggle(kind)}
          title={`Filter: ${label}`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
