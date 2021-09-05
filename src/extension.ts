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
import type { UserScript } from "./models/script";
import { askScript, cleanUp, execute } from "./actions/script";

export function activate(context: vscode.ExtensionContext) {
  const globalEventHubAdapter = createEventHubAdapter<CoreEvents>();
  const globalModuleManager = createModuleManager(
    createCoreAPI(context, globalEventHubAdapter)
  );
  const globalMessageHandler = createMessageHandler({
    moduleManager: globalModuleManager,
    eventAdapter: globalEventHubAdapter,
  });
  const webviewManager = createWebviewManager("ui", "Script Plus", context);
  context.subscriptions.push(webviewManager);
  context.subscriptions.push(globalEventHubAdapter);
  context.subscriptions.push(globalModuleManager.api.ScriptService);
  const { open: doOpen, reload, close } = webviewManager;
  const open = async function () {
    await globalModuleManager.api.ScriptService.check();
    doOpen();
    webviewManager.messageHandler ??
      webviewManager.attach(globalMessageHandler);
    globalEventHubAdapter.attach(webviewManager.panel!);
    webviewManager.onClose(() => {
      globalModuleManager.api.ScriptService.cleanUpAll();
      globalEventHubAdapter.detach(webviewManager.panel!);
    });
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
    vscode.commands.registerCommand(Commands.ScriptControl.Execute, () =>
      execute({ scriptService: globalModuleManager.api.ScriptService })
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
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.ScriptControl.CleanUp, () =>
      cleanUp({ scriptService: globalModuleManager.api.ScriptService })
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.CleanUpAllSideEffects,
      () => globalModuleManager.api.ScriptService.cleanUpAll()
    )
  );
  if (env.ENV === "dev") {
    loadSnowpackConfig(context).then((config) => {
      webviewManager.devServerConfig = {
        port: config.devOptions.port,
        hmrSocketPort: config.devOptions.hmrPort ?? config.devOptions.port,
      };
    });
  }
}

export function deactivate() {
  // Do nothing
}
