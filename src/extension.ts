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
    let cs2tsdisposable = vscode.commands.registerCommand('converter.cs2ts', () => {
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
    let ts2csdisposable = vscode.commands.registerCommand('converter.ts2cs', () => {
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
    context.subscriptions.push(cs2tsdisposable);
    context.subscriptions.push(ts2csdisposable);
}
// This method is called when your extension is deactivated
export function deactivate() { }