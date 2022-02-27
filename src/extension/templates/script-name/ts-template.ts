import * as vscode from "vscode";
import type { ScriptRunResult } from "../api";
import type { Config } from "./config";
export const main = async (
  params: Config,
  context: vscode.ExtensionContext
): Promise<ScriptRunResult> => {
  vscode.window.showInformationMessage("Hello, Script Plus!");
};
