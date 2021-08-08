import env from "@esbuild-env";
import * as vscode from "vscode";

export const output = vscode.window.createOutputChannel(
  `${env.EXTENSION_BASE_NAME} Logger`
);
