'use strict';
import * as vscode from 'vscode';
import { cs2ts, getCs2TsConfiguration } from './cs2ts';
import { getTs2CsConfiguration, ts2cs } from './ts2cs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "converter" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let cs2tsDisposable = vscode.commands.registerCommand('converter.cs2ts', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        editor.edit(e => {
            var config = getCs2TsConfiguration();
            e.replace(selection, cs2ts(text, config));
        });
    });

    let ts2csDisposable = vscode.commands.registerCommand('converter.ts2cs', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        editor.edit(e => {
            var config = getTs2CsConfiguration();
            e.replace(selection, ts2cs(text, config));
        });
    });

    let pasteAsCs2TsDisposable = vscode.commands.registerCommand('converter.pasteAsCs2Ts', () => {
        // Get the content of the clipboard
        const clipboardContent = vscode.env.clipboard.readText();

        clipboardContent.then((text) => {
            var editor = vscode.window.activeTextEditor;
            if (!editor) { return; }

            var selection = editor.selection;

            editor.edit(e => {
                var config = getCs2TsConfiguration();
                e.replace(selection, cs2ts(text, config));
            });
        });
    });

    let convertCs2TsDisposable = vscode.commands.registerCommand('converter.convertCs2TsFromSidebar', async (resource) => {
        if (resource && resource.fsPath.endsWith('.cs')) {
            try {
                const tsContent = await convertCs2Ts(vscode.Uri.file(resource.fsPath));
                // Tạo một document mới và lưu nội dung convert vào file .ts
                const newTsUri = vscode.Uri.file(resource.fsPath.replace(/\.cs$/, '.ts'));
                await vscode.workspace.fs.writeFile(newTsUri, Buffer.from(tsContent, 'utf-8'));
    
                // Mở tài liệu mới trong trình soạn thảo
                const newTsDocument = await vscode.workspace.openTextDocument(newTsUri);
                await vscode.window.showTextDocument(newTsDocument);
            } catch (error) {
                console.error('Error converting and creating TypeScript file:', error);
            }
        }
    });
    
    

    vscode.window.registerFileDecorationProvider(new CsFileDecorationProvider());

    context.subscriptions.push(cs2tsDisposable);
    context.subscriptions.push(ts2csDisposable);
    context.subscriptions.push(pasteAsCs2TsDisposable);
    context.subscriptions.push(convertCs2TsDisposable);
}



async function convertCs2Ts(uri: vscode.Uri): Promise<string> {
  const document = await vscode.workspace.openTextDocument(uri);
  const config = getCs2TsConfiguration();
  return cs2ts(document.getText(), config);
}

  

class CsFileDecorationProvider implements vscode.FileDecorationProvider {
    provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
        if (uri.fsPath.endsWith('.cs')) {
            return {
                badge: 'C#',
            };
        }
        return null;
    }
}
// This method is called when your extension is deactivated
export function deactivate() { }