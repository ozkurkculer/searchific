import { spawn } from 'child_process';
import * as vscode from 'vscode';

// Lazy-load @vscode/ripgrep via dynamic import (it's ESM-only; static require() fails from CJS)
let rgPathPromise: Promise<string | null> | undefined;

function loadRgPath(): Promise<string | null> {
  if (!rgPathPromise) {
    rgPathPromise = import('@vscode/ripgrep')
      .then((m: { rgPath: string }) => m.rgPath)
      .catch(() => null);
  }
  return rgPathPromise;
}

interface RgOptions {
  query: string;
  useRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
}

/**
 * Returns absolute paths of files containing the query text, or null on failure (caller falls back to Scanner).
 */
export async function findCandidates(
  opts: RgOptions,
  signal: { cancelled: boolean }
): Promise<string[] | null> {
  const roots = vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath);
  if (!roots?.length || signal.cancelled) {return null;}

  const rgPath = await loadRgPath();
  if (!rgPath || signal.cancelled) {return null;}

  const pattern = opts.useRegex ? opts.query : escapeRipgrep(opts.query);
  const args: string[] = [
    '--no-config',
    '--no-ignore-parent',
    '-l',
    '--glob', '*.{ts,tsx,js,jsx}',
  ];
  if (!opts.caseSensitive) {args.push('-i');}
  if (opts.wholeWord) {args.push('-w');}
  args.push('-e', pattern, ...roots);

  return new Promise(resolve => {
    let out = '';
    let child;
    try {
      child = spawn(rgPath, args);
    } catch {
      resolve(null);
      return;
    }
    child.stdout.on('data', (c: Buffer) => { out += c.toString(); });
    child.on('close', code => {
      if (signal.cancelled || code === 2) { resolve(null); return; }
      resolve(out.split('\n').map(l => l.trim()).filter(Boolean));
    });
    child.on('error', () => resolve(null));
  });
}

function escapeRipgrep(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
