import * as vscode from 'vscode';
import { SearchViewProvider } from './providers/SearchViewProvider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new SearchViewProvider(context.extensionUri, context.workspaceState);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SearchViewProvider.viewId, provider),
    new vscode.Disposable(() => provider.dispose())
  );
}

export function deactivate() {}
