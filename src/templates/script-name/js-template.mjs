import * as vscode from "vscode";
/**
 * @param params {import('./config').Config}
 * @param context {vscode.ExtensionContext}
 * @returns {import("../api").ScriptRunResult}
 */
export async function main(params, context) {
  vscode.window.showInformationMessage("Hello, Script Plus!");
}
