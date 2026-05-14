import * as vscode from 'vscode';
import * as path from 'path';
import type { GitignoreFilter } from './GitignoreFilter';

export class Scanner {
  constructor(private gitignoreFilter: GitignoreFilter) {}

  async findFiles(includeGlob: string, excludeGlob: string, respectGitignore = false): Promise<string[]> {
    const include = includeGlob || '**/*.{ts,tsx,js,jsx}';

    const vsExcludes = this.buildVscodeExcludes();
    const exclude = excludeGlob || vsExcludes;

    const uris = await vscode.workspace.findFiles(include, exclude, 5000);
    let paths = uris.map(u => u.fsPath);

    if (respectGitignore) {
      paths = paths.filter(p => !this.gitignoreFilter.isIgnored(p));
    }

    return paths;
  }

  private buildVscodeExcludes(): string {
    const config = vscode.workspace.getConfiguration();
    const searchExclude: Record<string, boolean> = config.get('search.exclude') ?? {};
    const filesExclude: Record<string, boolean> = config.get('files.exclude') ?? {};

    const patterns = [
      ...Object.keys(searchExclude).filter(k => searchExclude[k]),
      ...Object.keys(filesExclude).filter(k => filesExclude[k]),
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/.git/**',
    ];

    return `{${[...new Set(patterns)].join(',')}}`;
  }

  relativeLabel(fsPath: string): string {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) {return fsPath;}
    for (const folder of folders) {
      const rel = path.relative(folder.uri.fsPath, fsPath);
      if (!rel.startsWith('..')) {return rel;}
    }
    return fsPath;
  }
}
