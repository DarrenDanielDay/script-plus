import * as vscode from "vscode";
import type { ScriptRunResult } from "../api";
import type { Config } from "./config";
export async function main(params: Config): Promise<ScriptRunResult> {
  vscode.window.showInformationMessage("Hello, Script Plus!");
}
