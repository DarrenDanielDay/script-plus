import * as vscode from "vscode";
/**
 * @param params {import('./config').Config}
 * @param context {vscode.ExtensionContext}
 * @returns {import("../api").ScriptRunResult}
 */
export const main = async (params, context) => {
  vscode.window.showInformationMessage("Hello, Script Plus!");
};
