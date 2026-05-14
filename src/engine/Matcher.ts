import {
  SyntaxKind,
  Node,
  VariableDeclaration,
  FunctionDeclaration,
  MethodDeclaration,
  ArrowFunction,
  FunctionExpression,
  StringLiteral,
  NoSubstitutionTemplateLiteral,
} from 'ts-morph';
import type { MatchKind, SearchResult, RawFileMatch, SearchOptions } from '../shared/types';
import { Parser } from './Parser';
import { Scanner } from './Scanner';
import { resolveVariableType } from './TypeResolver';
import { findCandidates } from './Ripgrep';

export class Matcher {
  constructor(private parser: Parser, private scanner: Scanner) {}

  static readonly MAX_RESULTS = 2000;

  async *search(
    options: SearchOptions,
    signal: { cancelled: boolean }
  ): AsyncGenerator<RawFileMatch & { truncated?: boolean }> {
    const { query, kinds, useRegex, caseSensitive, wholeWord, includeGlob, excludeGlob, respectGitignore } = options;
    if (!query.trim()) {return;}

    // Run scanner + ripgrep pre-filter in parallel for maximum speed
    const [allFiles, candidates] = await Promise.all([
      this.scanner.findFiles(includeGlob, excludeGlob, respectGitignore),
      findCandidates({ query, useRegex, caseSensitive, wholeWord }, signal).catch(() => null),
    ]);

    if (signal.cancelled) {return;}

    const files = candidates !== null
      ? (() => { const s = new Set(candidates); return allFiles.filter(f => s.has(f)); })()
      : allFiles;

    const matcher = buildMatcher(query, { useRegex, caseSensitive, wholeWord });
    let totalResults = 0;

    for (const filePath of files) {
      if (signal.cancelled) {return;}

      let sourceFile;
      try {
        sourceFile = this.parser.getSourceFile(filePath);
      } catch {
        continue;
      }

      const fileResults: SearchResult[] = [];
      const fullText = sourceFile.getFullText();
      const lines = fullText.split('\n');

      sourceFile.forEachDescendant(node => {
        if (signal.cancelled || totalResults >= Matcher.MAX_RESULTS) {return;}

        const result = this.matchNode(node, kinds, matcher);
        if (result) {
          const pos = sourceFile.getLineAndColumnAtPos(node.getStart());
          const lineText = lines[pos.line - 1] ?? '';
          fileResults.push({
            ...result,
            file: filePath,
            line: pos.line,
            column: pos.column,
            snippet: lineText.trim().slice(0, 200),
          });
          totalResults++;
        }
      });

      if (fileResults.length) {
        const hitCap = totalResults >= Matcher.MAX_RESULTS;
        yield { file: filePath, results: fileResults, ...(hitCap ? { truncated: true } : {}) };
        if (hitCap) {return;}
      }
    }
  }

  private matchNode(
    node: Node,
    kinds: MatchKind[],
    matcher: RegExp
  ): Omit<SearchResult, 'file' | 'line' | 'column' | 'snippet'> | null {
    switch (node.getKind()) {
      case SyntaxKind.VariableDeclaration: {
        if (!kinds.includes('variable')) {return null;}
        const decl = node as VariableDeclaration;
        const name = decl.getName();
        if (!matcher.test(name)) {return null;}
        return { kind: 'variable', displayName: name, typeText: resolveVariableType(decl) };
      }

      case SyntaxKind.FunctionDeclaration: {
        if (!kinds.includes('function')) {return null;}
        const decl = node as FunctionDeclaration;
        const name = decl.getName() ?? '<anonymous>';
        if (!matcher.test(name)) {return null;}
        return { kind: 'function', displayName: name };
      }

      case SyntaxKind.MethodDeclaration: {
        if (!kinds.includes('function')) {return null;}
        const decl = node as MethodDeclaration;
        const name = decl.getName();
        if (!matcher.test(name)) {return null;}
        return { kind: 'function', displayName: name };
      }

      case SyntaxKind.ArrowFunction: {
        if (!kinds.includes('function')) {return null;}
        const fn = node as ArrowFunction;
        const parent = fn.getParent();
        let name = '<arrow>';
        if (parent && Node.isVariableDeclaration(parent)) {
          name = parent.getName();
        } else if (parent && Node.isPropertyAssignment(parent)) {
          name = parent.getName();
        }
        if (!matcher.test(name)) {return null;}
        return { kind: 'function', displayName: name };
      }

      case SyntaxKind.FunctionExpression: {
        if (!kinds.includes('function')) {return null;}
        const fn = node as FunctionExpression;
        const named = fn.getName();
        const parent = fn.getParent();
        let name = named ?? '<expression>';
        if (!named && parent && Node.isVariableDeclaration(parent)) {
          name = parent.getName();
        }
        if (!matcher.test(name)) {return null;}
        return { kind: 'function', displayName: name };
      }

      case SyntaxKind.StringLiteral: {
        if (!kinds.includes('string')) {return null;}
        const lit = node as StringLiteral;
        const text = lit.getLiteralText();
        if (!matcher.test(text)) {return null;}
        return { kind: 'string', displayName: `"${text.slice(0, 60)}"` };
      }

      case SyntaxKind.NoSubstitutionTemplateLiteral: {
        if (!kinds.includes('string')) {return null;}
        const lit = node as NoSubstitutionTemplateLiteral;
        const text = lit.getLiteralText();
        if (!matcher.test(text)) {return null;}
        return { kind: 'string', displayName: `\`${text.slice(0, 60)}\`` };
      }

      default:
        return null;
    }
  }
}

function buildMatcher(
  query: string,
  opts: { useRegex: boolean; caseSensitive: boolean; wholeWord: boolean }
): RegExp {
  let pattern = opts.useRegex ? query : escapeRegex(query);
  if (opts.wholeWord) {pattern = `\\b${pattern}\\b`;}
  const flags = opts.caseSensitive ? '' : 'i';
  return new RegExp(pattern, flags);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
