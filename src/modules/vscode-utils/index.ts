import env from "@esbuild-env";
import * as vscode from "vscode";

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
