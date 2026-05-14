import { Project, SourceFile } from 'ts-morph';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Parser {
  private project: Project;
  private mtimeCache = new Map<string, number>();

  constructor() {
    this.project = this.createProject();
    this.watchChanges();
  }

  private createProject(): Project {
    const tsconfig = this.findTsConfig();
    if (tsconfig) {
      return new Project({ tsConfigFilePath: tsconfig, skipAddingFilesFromTsConfig: true });
    }
    return new Project({
      compilerOptions: {
        allowJs: true,
        jsx: 2, // React
        strict: false,
        noEmit: true,
      },
    });
  }

  private findTsConfig(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) {return undefined;}
    const candidate = path.join(folders[0].uri.fsPath, 'tsconfig.json');
    return fs.existsSync(candidate) ? candidate : undefined;
  }

  private watchChanges(): void {
    vscode.workspace.onDidSaveTextDocument(doc => {
      this.invalidate(doc.uri.fsPath);
    });
  }

  getSourceFile(filePath: string): SourceFile {
    const mtime = this.getMtime(filePath);
    const cached = this.mtimeCache.get(filePath);

    if (cached !== mtime || !this.project.getSourceFile(filePath)) {
      // Remove stale version before refreshing
      const existing = this.project.getSourceFile(filePath);
      if (existing) {existing.refreshFromFileSystemSync();}
      else {this.project.addSourceFileAtPath(filePath);}
      this.mtimeCache.set(filePath, mtime);
    }

    return this.project.getSourceFileOrThrow(filePath);
  }

  private invalidate(filePath: string): void {
    this.mtimeCache.delete(filePath);
  }

  private getMtime(filePath: string): number {
    try {
      return fs.statSync(filePath).mtimeMs;
    } catch {
      return 0;
    }
  }

  dispose(): void {
    // ts-morph Project has no explicit dispose, GC handles it
  }
}
