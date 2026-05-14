# Searchific

**Semantic search for TypeScript & JavaScript — not just text, but meaning.**

[![Version](https://img.shields.io/badge/version-0.0.1-blue?style=flat-square)](https://github.com/ozkurkculer/searchific/releases)
[![VSCode](https://img.shields.io/badge/VSCode-%5E1.74-007ACC?style=flat-square&logo=visualstudiocode)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

Searchific adds a semantic search sidebar to VS Code. Instead of grepping raw text, it walks the **AST** of your TypeScript and JavaScript files — finding variables, functions, and string literals by their actual identity. Variable results display their **inferred TypeScript type** inline, so you can see what something *is*, not just where it appears.

---

## Features

### AST-powered search

Searchific uses [ts-morph](https://ts-morph.com/) to parse your code and match identifiers at the AST level. A search for `handleSubmit` finds the function declaration — not a comment, import path, or string that happens to contain those characters.

### Ripgrep pre-filter

Before AST parsing, Searchific runs [ripgrep](https://github.com/BurntSushi/ripgrep) across your workspace to narrow down candidate files. Only files that contain the query text get parsed by ts-morph. On large codebases this delivers **order-of-magnitude speedups** over naive AST-everything approaches.

### Filter by kind

Three toggle pills let you control which AST node types appear in results:

| Kind | Matches |
| --- | --- |
| **Variable** | `const`, `let`, `var` declarations |
| **Function** | Function declarations, methods, arrow functions, function expressions |
| **String** | String literals and no-substitution template literals |

### Inline type inference

Variable results show their TypeScript-inferred type in a small badge alongside the name — `string`, `User[]`, `Promise<void>` — without you having to hover or navigate anywhere.

### Gitignore aware

Searchific respects your `.gitignore` by default. A checkbox in the filter bar lets you toggle this on/off. Disabling it reveals files like `dist/` that are normally hidden — useful when you need to debug a build artifact.

### Streaming results

Results stream in as files are scanned. You see matches appear file by file, so large workspaces feel responsive instead of frozen.

### Persistent state

Filter settings (kind toggles, regex/case/word flags, glob patterns, gitignore toggle) survive window reloads. Your search configuration is always where you left it.

---

## Installation

### From VSIX

Download `searchific-0.0.1.vsix` from [Releases](https://github.com/ozkurkculer/searchific/releases), then:

```bash
code --install-extension searchific-0.0.1.vsix
```

Or via the VS Code UI: **Extensions** (`Cmd+Shift+X`) → `···` → **Install from VSIX…**

---

## Usage

Click the **Searchific icon** in the Activity Bar (left sidebar). The panel opens with a search input at the top.

```text
┌─────────────────────────────────────┐
│  ↻  ✕  ⫷                           │  ← header actions
├─────────────────────────────────────┤
│  🔍  handleSubmit          .* Aa \b │  ← search bar + toggles
├─────────────────────────────────────┤
│  [Variable]  [Function]  [String]   │  ← kind filter chips
├─────────────────────────────────────┤
│  ▶ Files to include / exclude  .gitignore ✓ │
├─────────────────────────────────────┤
│  12 results in 4 files              │
│  ▼ src/handlers/form.ts        3    │
│      fn  handleSubmit               │
│      fn  handleSubmitError          │
│      fn  handleSubmitSuccess        │
│  ▶ src/components/Form.tsx     5    │
│  ▶ src/hooks/useForm.ts        4    │
└─────────────────────────────────────┘
```

### Search controls

| Control | Description |
| --- | --- |
| `.*` | Treat the query as a **regular expression** |
| `Aa` | **Case-sensitive** matching |
| `\b` | **Whole-word** matching only |
| **Variable** / **Function** / **String** | Toggle AST node kinds (at least one must be active) |
| **Files to include** | Glob pattern — e.g. `src/**/*.ts` |
| **Files to exclude** | Glob pattern — e.g. `**/*.test.ts` |
| **.gitignore** | Respect `.gitignore` when scanning (default: on) |

### Header actions

| Button | Action |
| --- | --- |
| **↻ Refresh** | Re-run the current query without changing the input |
| **✕ Clear** | Empty the search bar and reset results to idle |
| **⫷ Collapse all** | Fold every file group (click a group header to expand) |

### Clicking a result

Click any result row to **open the file at the exact line and column** in the editor.

---

## How it works

```text
User types query
       │
       ▼
   150ms debounce
       │
       ├──────────────────────────────┐
       ▼                              ▼
 ripgrep -l (fast text scan)    Scanner.findFiles
 returns candidate file paths   returns glob-filtered paths
       │                              │
       └──────────┬───────────────────┘
                  ▼
          Intersection of both sets
                  │
                  ▼
         ts-morph AST parse
         (only candidate files)
                  │
                  ▼
         forEachDescendant walk
         matchNode → SearchResult
                  │
                  ▼
         Stream batches → webview
         (10 FileMatches per flush)
```

**Cancel:** Every new search increments a `queryId`. Old results with a stale `queryId` are silently dropped. A `signal.cancelled` flag stops the generator between files.

**Cap:** Hard limit of **2000 matches** across all files. A warning banner appears when the cap is hit.

---

## Architecture

```text
searchific/
├── src/
│   ├── extension.ts              # Activation entry point
│   ├── providers/
│   │   └── SearchViewProvider.ts # IPC bridge, result batching, state persistence
│   ├── engine/
│   │   ├── Scanner.ts            # vscode.workspace.findFiles + gitignore filter
│   │   ├── Parser.ts             # ts-morph Project, mtime-based SourceFile cache
│   │   ├── Matcher.ts            # Async generator search engine
│   │   ├── TypeResolver.ts       # Variable type inference (≤80 chars)
│   │   ├── GitignoreFilter.ts    # .gitignore parsing via `ignore` package
│   │   └── Ripgrep.ts            # @vscode/ripgrep pre-filter (dynamic import)
│   ├── shared/
│   │   ├── types.ts              # SearchResult, FileMatch, SearchOptions, PersistedState
│   │   └── messages.ts           # Typed IPC contract (WebviewMessage / HostMessage)
│   └── webview/                  # React 18 app (built by Vite)
│       ├── App.tsx               # Root state, IPC dispatch, debounced search
│       ├── components/
│       │   ├── HeaderActions.tsx # Refresh / Clear / Collapse All buttons
│       │   ├── SearchBar.tsx     # Input + regex/case/word toggles
│       │   ├── FilterChips.tsx   # Variable / Function / String kind pills
│       │   ├── GlobFields.tsx    # Collapsible include/exclude + gitignore checkbox
│       │   ├── ResultList.tsx    # File-grouped results + count bar + truncation banner
│       │   ├── ResultItem.tsx    # Single result row with kind badge + type pill
│       │   └── EmptyState.tsx    # idle / loading / no-results / error states
│       ├── hooks/
│       │   ├── useVscodeApi.ts   # acquireVsCodeApi + message listener
│       │   └── useDebouncedQuery.ts
│       └── styles/
│           ├── tokens.css        # --bs-* tokens mapped from --vscode-* variables
│           └── app.css           # BEM-like component styles, motion-aware
├── esbuild.js                    # Extension host build (CJS, vscode + ripgrep external)
├── vite.config.ts                # Webview build (fixed output: main.js + main.css)
└── scripts/
    └── build-webview.mjs         # Vite build wrapper
```

**Two build targets:**

| Target | Tool | Output | Format |
| --- | --- | --- | --- |
| Extension host | esbuild | `dist/extension.js` | CJS, minified in prod |
| Webview | Vite | `dist/webview/main.{js,css}` | ESM bundle |

---

## Development

```bash
# Install dependencies
yarn install

# Start watch mode (host + webview rebuild on save)
yarn watch

# Then press F5 in VS Code to launch Extension Development Host

# One-shot build (type-check → lint → esbuild → vite)
yarn compile

# Type-check only
yarn check-types

# Lint only
yarn lint
```

### Package as VSIX

```bash
npx @vscode/vsce package
# → searchific-0.0.1.vsix
```

See [`docs/PACKAGING.md`](docs/PACKAGING.md) for full packaging and installation instructions.

### Adding a new search kind

1. Add to `MatchKind` union in [`src/shared/types.ts`](src/shared/types.ts)
2. Add a `case SyntaxKind.X` branch in `Matcher.matchNode`
3. Add a chip entry in [`FilterChips.tsx`](src/webview/components/FilterChips.tsx)
4. Add CSS for `.chip--x` and `.result-item__badge--x` in [`app.css`](src/webview/styles/app.css)

### Adding a new IPC message

1. Add to `WebviewMessage` or `HostMessage` in [`src/shared/messages.ts`](src/shared/messages.ts)
2. Handle in `SearchViewProvider.onDidReceiveMessage` (host side)
3. Handle in `App.handleMessage` (webview side)

---

## Requirements

- **VS Code 1.74+** (or any compatible fork)
- A TypeScript or JavaScript workspace

---

## License

[MIT](LICENSE) © ozkurkculer
