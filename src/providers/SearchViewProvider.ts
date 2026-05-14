import * as vscode from 'vscode';
import type { WebviewMessage, HostMessage } from '../shared/messages';
import type { SearchOptions, PersistedState, FileMatch } from '../shared/types';
import { Scanner } from '../engine/Scanner';
import { Parser } from '../engine/Parser';
import { Matcher } from '../engine/Matcher';
import { GitignoreFilter } from '../engine/GitignoreFilter';

const STATE_KEY = 'betterSearch.uiState';

export class SearchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'betterSearch.view';

  private view?: vscode.WebviewView;
  private gitignoreFilter = new GitignoreFilter();
  private scanner = new Scanner(this.gitignoreFilter);
  private parser = new Parser();
  private matcher = new Matcher(this.parser, this.scanner);
  private queryId = 0;
  private signal = { cancelled: false };

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly workspaceState: vscode.Memento
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview')],
    };

    webviewView.webview.html = this.buildHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      if (msg.type === 'search') {
        await this.handleSearch(msg.queryId, msg.options);
      } else if (msg.type === 'reveal') {
        await this.handleReveal(msg.file, msg.line, msg.column);
      } else if (msg.type === 'persistState') {
        await this.workspaceState.update(STATE_KEY, msg.state);
      } else if (msg.type === 'ready') {
        const saved = this.workspaceState.get<PersistedState>(STATE_KEY) ?? null;
        this.post({ type: 'hydrate', state: saved });
      }
    });
  }

  private async handleSearch(queryId: number, options: SearchOptions): Promise<void> {
    this.signal.cancelled = true;
    this.signal = { cancelled: false };
    this.queryId = queryId;

    this.post({ type: 'searching', queryId });

    const batchSize = 10;
    let buffer: FileMatch[] = [];
    let truncatedFinal = false;

    try {
      for await (const fileMatch of this.matcher.search(options, this.signal)) {
        if (this.signal.cancelled || queryId !== this.queryId) {return;}

        const { truncated, ...fm } = fileMatch;
        const displayPath = this.scanner.relativeLabel(fm.file);
        buffer.push({ ...fm, displayPath });

        if (truncated) {
          truncatedFinal = true;
        }

        if (buffer.length >= batchSize || truncated) {
          this.post({ type: 'results', queryId, batch: buffer, done: false, truncated: false });
          buffer = [];
          if (truncated) {
            this.post({ type: 'results', queryId, batch: [], done: true, truncated: true });
            return;
          }
        }
      }
      if (!this.signal.cancelled && queryId === this.queryId) {
        this.post({ type: 'results', queryId, batch: buffer, done: true, truncated: truncatedFinal });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.post({ type: 'error', message });
    }
  }

  private async handleReveal(file: string, line: number, column: number): Promise<void> {
    try {
      const uri = vscode.Uri.file(file);
      const pos = new vscode.Position(Math.max(0, line - 1), Math.max(0, column - 1));
      const range = new vscode.Range(pos, pos);
      await vscode.commands.executeCommand('vscode.open', uri, { selection: range, preview: true });
    } catch (err) {
      vscode.window.showErrorMessage(
        `Better Search: failed to open ${file} — ${err instanceof Error ? err.message : err}`
      );
    }
  }

  private post(msg: HostMessage): void {
    this.view?.webview.postMessage(msg);
  }

  private buildHtml(webview: vscode.Webview): string {
    const distBase = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distBase, 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distBase, 'main.css'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src ${webview.cspSource} 'nonce-${nonce}';
      script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>Better Search</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  dispose(): void {
    this.signal.cancelled = true;
    this.parser.dispose();
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
