import env from "@esbuild-env";
import * as vscode from "vscode";
import v8 from "v8";
import { json } from "../../app/src/json-serializer";
import { TextEncoder, TextDecoder } from "util";
import {
  isScriptPlusConfig,
  ScriptPlusConfig,
} from "../../configs/user-config";
import { die } from "taio/build/utils/internal/exceptions";
import type { DeepPartial } from "taio/build/types/object";
import { defineValidator } from "taio/build/utils/validator/utils";
import { isObject } from "taio/build/utils/validator/object";
import { isString } from "taio/build/utils/validator/primitive";
export const output = vscode.window.createOutputChannel(
  `${env.EXTENSION_BASE_NAME} Logger`
);

export const divider = (title: string, char = "=", length = 50) => {
  const left = Math.floor((length - title.length) / 2);
  output.appendLine(
    `${char[0].repeat(left)}${title.padEnd(length - left, char[0])}`
  );
};

export async function openEdit(
  fileUri: vscode.Uri,
  focusPosition?: vscode.Position
) {
  await vscode.commands.executeCommand("vscode.open", fileUri, {
    viewColumn: vscode.ViewColumn.One,
  });
  if (focusPosition instanceof vscode.Position) {
    vscode.commands.executeCommand(
      "editor.action.peekLocations",
      fileUri,
      focusPosition,
      [focusPosition],
      "gotoAndPeek"
    );
  }
}

export const existFile = async (uri: vscode.Uri) => {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.type === vscode.FileType.File;
  } catch (error) {
    return false;
  }
};

export const existDir = async (uri: vscode.Uri) => {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.type === vscode.FileType.Directory;
  } catch (error) {
    return false;
  }
};

export async function readFile(uri: vscode.Uri) {
  const decoder = new TextDecoder("utf-8");
  const uint8Array = await vscode.workspace.fs.readFile(uri);
  return decoder.decode(uint8Array);
}

export async function writeFile(uri: vscode.Uri, content: string) {
  const encoder = new TextEncoder();
  vscode.workspace.fs.writeFile(uri, encoder.encode(content));
}

export async function dumpObjectToFile(uri: vscode.Uri, obj: unknown) {
  const buf = v8.serialize(obj);
  await vscode.workspace.fs.writeFile(uri, buf);
}

export async function loadObjectFromFile(uri: vscode.Uri): Promise<unknown> {
  const buf = await vscode.workspace.fs.readFile(uri);
  return v8.deserialize(buf);
}

const isErrorLike = isObject({
  message: isString,
  stack: isString,
});

export function getErrorMessage(error: unknown): string {
  let displayMessage: string;
  if (isErrorLike(error)) {
    displayMessage = error.stack;
  } else if (typeof error === "object") {
    displayMessage = JSON.stringify(json.serialize(error), undefined, 2);
  } else {
    displayMessage = `${error}`;
  }
  return displayMessage;
}

export function globalErrorHandler(error: unknown): void {
  let displayMessage: string = getErrorMessage(error);
  vscode.window.showErrorMessage(displayMessage);
}

export async function askYesNoQuestion(
  question: string,
  modal = true
): Promise<boolean | undefined> {
  const result = await vscode.window.showInformationMessage<{
    title: "No" | "Yes";
  }>(question, { modal }, { title: "Yes" }, { title: "No" });
  return result && result.title === "Yes";
}
const configRootSection = "script-plus";
function getExtensionConfiguration() {
  return vscode.workspace.getConfiguration(configRootSection);
}

export function getConfigs(): ScriptPlusConfig {
  const config = getExtensionConfiguration();
  return isScriptPlusConfig(config) ? config : die("Impossible");
}

export function updateConfig(patch: DeepPartial<ScriptPlusConfig>) {
  const config = getExtensionConfiguration();
  config.update(configRootSection, patch);
}
