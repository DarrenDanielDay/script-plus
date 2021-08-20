import env from "@esbuild-env";
import * as vscode from "vscode";
import { json } from "../../app/src/json-serializer";

export const output = vscode.window.createOutputChannel(
  `${env.EXTENSION_BASE_NAME} Logger`
);

export async function openEdit(
  fileAbsolutePath: string,
  focusPosition?: vscode.Position
) {
  const fileUri = vscode.Uri.file(fileAbsolutePath);
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
