# Better Search

Semantic search sidebar for TypeScript and JavaScript. Find variables, functions, and string literals by name — with inferred types shown inline.

## Features

- **AST-powered search** — matches identifiers exactly, not just text
- **Filter by kind** — Variable / Function / String pills to narrow results
- **Type inference** — shows the inferred TypeScript type next to each variable result
- **Fast** — ripgrep pre-filters candidate files before AST parsing
- **Gitignore aware** — respects `.gitignore` by default (toggleable)
- **Streaming results** — results appear as files are scanned
- **Persistent state** — filter settings survive window reloads

## Usage

Click the search icon in the Activity Bar. Type a symbol name to search across all TypeScript and JavaScript files in the workspace.

### Filters

| Control | What it does |
| --- | --- |
| `.*` | Treat query as a regular expression |
| `Aa` | Case-sensitive match |
| `\b` | Whole-word match only |
| Variable / Function / String | Toggle which AST node kinds to include |
| Files to include / exclude | Glob patterns (e.g. `src/**/*.ts`) |
| .gitignore | Respect `.gitignore` when scanning |

### Header actions

| Button | Action |
| --- | --- |
| Refresh | Re-run the current query |
| Clear | Clear the search input and results |
| Collapse all | Fold all file groups |

## Requirements

- VS Code 1.120+
- A TypeScript or JavaScript workspace
