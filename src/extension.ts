'use strict';
import * as vscode from 'vscode';
import { cs2ts, getCs2TsConfiguration } from './cs2ts';
const path = require('path'); 
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let cs2tsDisposable = vscode.commands.registerCommand('converter.cs2ts', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        editor.edit(async e => {
            var config = getCs2TsConfiguration();
            e.replace(selection, await cs2ts(text, config));
        });
    });

    let pasteAsCs2TsDisposable = vscode.commands.registerCommand('converter.pasteAsCs2Ts', () => {
        // Get the content of the clipboard
        const clipboardContent = vscode.env.clipboard.readText();

        clipboardContent.then((text) => {
            var editor = vscode.window.activeTextEditor;
            if (!editor) { return; }

            var selection = editor.selection;

            editor.edit(async e => {
                var config = getCs2TsConfiguration();
                e.replace(selection, await cs2ts(text, config));
            });
        });
    });

    let convertCs2TsDisposable = vscode.commands.registerCommand('converter.convertCs2TsFromSidebar', async (resource) => {
        if (resource && resource.fsPath.endsWith('.cs')) {
            try {
                // Hiển thị hộp thoại prompt để người dùng nhập đường dẫn mới cho file .ts
                const newTsPath = await vscode.window.showInputBox({ prompt: 'Enter the new path for the TypeScript file' });

                if (!newTsPath) {
                    // Người dùng đã hủy bỏ hoặc không nhập đường dẫn mới
                    return;
                }

                // Tạo nội dung TypeScript từ file C#
                const tsContent = await convertCs2Ts(vscode.Uri.file(resource.fsPath));

                // Tạo đường dẫn mới cho file TypeScript
                const newTsUri = vscode.Uri.file(path.join(newTsPath, path.basename(resource.fsPath, '.cs').toLowerCase() + '.ts'));

                // Lưu nội dung convert vào file .ts
                await vscode.workspace.fs.writeFile(newTsUri, Buffer.from(tsContent, 'utf-8'));
    
                // Đổi tên file .ts để di chuyển đến đường dẫn mới
                await vscode.workspace.fs.rename(newTsUri, vscode.Uri.file(newTsUri.fsPath.replace(/\.cs\.ts$/, '.ts')));

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