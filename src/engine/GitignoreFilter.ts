import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import ignore = require('ignore');

export class GitignoreFilter {
  private ig = ignore();
  private root = '';

  constructor() {
    this.root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    this.reload();
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (path.basename(doc.fileName) === '.gitignore') {
        this.reload();
      }
    });
  }

  private reload(): void {
    this.ig = ignore();
    if (!this.root) {return;}
    const gitignorePath = path.join(this.root, '.gitignore');
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      this.ig.add(content);
    } catch {
      // no .gitignore at workspace root
    }
  }

  isIgnored(absolutePath: string): boolean {
    if (!this.root) {return false;}
    const rel = path.relative(this.root, absolutePath).replace(/\\/g, '/');
    if (rel.startsWith('..') || path.isAbsolute(rel)) {return false;}
    try {
      return this.ig.ignores(rel);
    } catch {
      return false;
    }
  }
}
