import * as vscode from "vscode";
import type { CoreAPI } from "../../types/public-api";
import { intl } from "../i18n/core/locale";

export async function installModule(api: CoreAPI) {
  const moduleId = await vscode.window.showInputBox({
    title: intl("actions.module.install.moduleId.promote"),
    placeHolder: intl("actions.module.install.moduleId.placeholder"),
  });
  if (moduleId === undefined) {
    return;
  }
  const versions = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: intl("actions.module.install.version.search.searching", {
        moduleId,
      }),
      cancellable: true,
    },
    (_, token) => {
      return new Promise<string[]>((resolve, reject) => {
        api.PackageService.listVersions(moduleId).then(resolve);
        const subscription = token.onCancellationRequested(() => {
          subscription.dispose();
          reject(
            intl("actions.module.install.version.search.canceled", { moduleId })
          );
        });
      });
    }
  );
  const version = await vscode.window.showQuickPick(["latest", ...versions], {
    canPickMany: false,
    ignoreFocusOut: true,
    title: intl("actions.module.install.version.pick.title", { moduleId }),
  });
  if (version === undefined) {
    return;
  }
  await api.PackageService.installPackage(moduleId, version);
}
