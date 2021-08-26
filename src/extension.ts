import * as vscode from "vscode";
import env from "@esbuild-env";
import { createWebviewManager, IWebviewManager } from "./webview-handler";
import { createEventHubAdapter } from "./events/event-manager";
import { Commands } from "./commands";
import { loadSnowpackConfig } from "./debug/snowpack-dev";
import { createCoreAPI } from "./modules/core-module";
import { createMessageHandler } from "./messages/message-manager";
import type { CoreEvents } from "./app/message-protocol";
import { createModuleManager } from "./modules/module-manager";

export function activate(context: vscode.ExtensionContext) {
  const globalEventHubAdapter = createEventHubAdapter<CoreEvents>();
  const globalModuleManager = createModuleManager(
    createCoreAPI(context, globalEventHubAdapter)
  );
  const globalMessageHandler = createMessageHandler({
    moduleManager: globalModuleManager,
    eventAdapter: globalEventHubAdapter,
  });
  const webviewManager = createWebviewManager(
    "ui",
    "Extension UI of React",
    context
  );
  context.subscriptions.push(webviewManager);
  context.subscriptions.push(globalEventHubAdapter);
  context.subscriptions.push(globalModuleManager.api.ScriptService);
  const { open: doOpen, reload, close } = webviewManager;
  const open = async function (this: IWebviewManager) {
    await globalModuleManager.api.ScriptService.check();
    doOpen.call(this);
    webviewManager.messageHandler ??
      webviewManager.attach(globalMessageHandler);
    globalEventHubAdapter.attach(webviewManager.panel!.webview);
    webviewManager.onClose(() =>
      globalEventHubAdapter.detach(webviewManager.panel!.webview)
    );
  };
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.WebviewControll.Open,
      open.bind(webviewManager)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.WebviewControll.Close,
      close.bind(webviewManager)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.WebviewControll.Reload,
      reload.bind(webviewManager)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.ExecuteCurrentScript,
      () => globalModuleManager.api.ScriptService.executeCurrent()
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.ForceCheckUserScriptsFolder,
      () => globalModuleManager.api.ScriptService.check(true)
    )
  );
  if (env.ENV === "dev") {
    loadSnowpackConfig(context).then((config) => {
      webviewManager.devServerConfig = {
        port: config.devOptions.port,
        hmrSocketPort: config.devOptions.hmrPort ?? config.devOptions.port,
      };
      vscode.commands.executeCommand(Commands.WebviewControll.Open).then(() => {
        console.log("Successfully opened webview");
      });
    });
  }
}

export function deactivate() {
  // Do nothing
}
