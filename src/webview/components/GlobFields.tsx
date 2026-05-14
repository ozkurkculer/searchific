import React, { useState } from 'react';

interface Props {
  include: string;
  exclude: string;
  onIncludeChange: (v: string) => void;
  onExcludeChange: (v: string) => void;
  respectGitignore: boolean;
  onRespectGitignoreChange: (v: boolean) => void;
}

export function GlobFields({
  include,
  exclude,
  onIncludeChange,
  onExcludeChange,
  respectGitignore,
  onRespectGitignoreChange,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glob-fields">
      <div className="glob-fields__row">
        <button
          type="button"
          className="glob-fields__toggle"
          onClick={() => setOpen(o => !o)}
        >
          <span className={`glob-fields__arrow${open ? ' glob-fields__arrow--open' : ''}`}>▶</span>
          Files to include / exclude
        </button>
        <label className="checkbox-row__label">
          <input
            type="checkbox"
            className="checkbox-row__input"
            checked={respectGitignore}
            onChange={e => onRespectGitignoreChange(e.target.checked)}
          />
          .gitignore
        </label>
      </div>
      {open && (
        <div className="glob-fields__inputs">
          <div className="glob-input">
            <span className="glob-input__label">Include</span>
            <input
              className="glob-input__field"
              placeholder="e.g. src/**/*.ts"
              value={include}
              onChange={e => onIncludeChange(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="glob-input">
            <span className="glob-input__label">Exclude</span>
            <input
              className="glob-input__field"
              placeholder="e.g. **/*.test.ts"
              value={exclude}
              onChange={e => onExcludeChange(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
