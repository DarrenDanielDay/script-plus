import * as vscode from "vscode";
/**
 * @param params {import('./config').Config}
 * @returns {import("../api").ScriptRunResult}
 */
export async function main(params) {
  vscode.window.showInformationMessage("Hello, Script Plus!");
}
