import * as vscode from "vscode";
import type { CoreAPI } from "../app/message-protocol";

export async function installModule(api: CoreAPI) {
  const moduleId = await vscode.window.showInputBox({
    title: "Input the module ID (npm package name)",
    placeHolder: "e.g. semver",
  });
  if (moduleId === undefined) {
    return;
  }
  const versions = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Searching versions of package "${moduleId}""`,
      cancellable: true,
    },
    (_, token) => {
      return new Promise<string[]>((resolve, reject) => {
        api.ScriptService.listVersions(moduleId).then(resolve);
        const subscription = token.onCancellationRequested(() => {
          subscription.dispose();
          reject(`Canceled searching version of "${moduleId}".`);
        });
      });
    }
  );
  const version = await vscode.window.showQuickPick(["latest", ...versions], {
    canPickMany: false,
    ignoreFocusOut: true,
    title: `pick a version of package "${moduleId}" to install`,
  });
  if (version === undefined) {
    return;
  }
  await api.ScriptService.installPackage(moduleId, version);
}
