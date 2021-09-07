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
import { isObject, isObjectLike } from "taio/build/utils/validator/object";
import { isPrimitive, isString } from "taio/build/utils/validator/primitive";
import { dfs } from "taio/build/libs/custom/algorithms/search";
import * as R from "ramda";
import type { ArrayItem } from "taio/build/types/array";
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

export async function askForOptions<Options extends readonly string[]>(
  question: string,
  modal: boolean,
  ...options: Options
) {
  const result = await vscode.window.showInformationMessage<{
    title: ArrayItem<Options>;
  }>(question, { modal }, ...options.map((option) => ({ title: option })));
  return result?.title;
}

const configRootSection = "script-plus";
function getExtensionConfiguration() {
  return vscode.workspace.getConfiguration(configRootSection);
}

export function getConfigs(): ScriptPlusConfig & vscode.WorkspaceConfiguration {
  const config = getExtensionConfiguration();
  return isScriptPlusConfig(config) ? config : die("Impossible");
}

export async function updateConfig(patch: DeepPartial<ScriptPlusConfig>) {
  const config = getConfigs();
  type Pair = [string[], unknown];
  const iterator = dfs<Pair, Pair>(
    [[], patch],
    ([path, obj]) => {
      return isObjectLike(obj)
        ? Object.entries(obj).map(([key, value]) => [[...path, key], value])
        : [];
    },
    R.identity
  );
  const configPaths = [...iterator].filter(([, value]) => isPrimitive(value));
  await Promise.all(
    configPaths.map(([path, value]) =>
      config.update(path.join("."), value, vscode.ConfigurationTarget.Global)
    )
  );
}
