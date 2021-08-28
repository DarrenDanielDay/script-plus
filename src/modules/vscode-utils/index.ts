import env from "@esbuild-env";
import * as vscode from "vscode";
import { json } from "../../app/src/json-serializer";
import { TextEncoder, TextDecoder } from "util";
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

export function getErrorMessage(error: unknown): string {
  let displayMessage: string;
  if (error instanceof Error) {
    displayMessage = error.message;
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
