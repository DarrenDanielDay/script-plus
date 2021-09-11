import * as vscode from "vscode";
import env from "@esbuild-env";
import { createWebviewManager } from "./webview-handler";
import { createEventHubAdapter } from "./events/event-manager";
import { Commands } from "./commands";
import { loadSnowpackConfig } from "./debug/snowpack-dev";
import { createCoreAPI } from "./modules/core-module";
import { createMessageHandler } from "./messages/message-manager";
import type { CoreEvents } from "./app/message-protocol";
import { createModuleManager } from "./modules/module-manager";
import { askScript, cleanUp, execute } from "./actions/script";
import { installModule } from "./actions/module";
import { devConfigReady, factory, startUpReady } from "./commands/factory";
import { createPublicAPI } from "./api/public-api";

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
  context.subscriptions.push(globalModuleManager.api.ScriptService);
  const { open: doOpen, reload, close } = webviewManager;
  const open = async () => {
    doOpen();
    webviewManager.messageHandler ??
      webviewManager.attach(globalMessageHandler);
    globalEventHubAdapter.attach(webviewManager.panel!);
    webviewManager.onClose(() => {
      globalModuleManager.api.ScriptService.cleanUpAll({
        includeMounted: false,
      });
      globalEventHubAdapter.detach(webviewManager.panel!);
    });
  };
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.WebviewControll.Open,
      factory(open)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.WebviewControll.Close,
      factory(close)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.WebviewControll.Reload,
      factory(reload)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.Execute,
      factory(() => execute(globalModuleManager.api))
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.ExecuteCurrentScript,
      factory(() => globalModuleManager.api.ScriptService.executeCurrent())
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.ForceCheckUserScriptsFolder,
      factory(() => globalModuleManager.api.ScriptService.check(true))
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.CleanUp,
      factory(() => cleanUp(globalModuleManager.api))
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.CleanUpAllSideEffects,
      factory(() =>
        globalModuleManager.api.ScriptService.cleanUpAll({
          includeMounted: true,
        })
      )
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.InstallModule,
      factory(() => installModule(globalModuleManager.api))
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.ScriptControl.EditScript,
      factory(() =>
        askScript(globalModuleManager.api).then(
          (script) =>
            script && globalModuleManager.api.ScriptService.editScript(script)
        )
      )
    )
  );
  if (env.ENV === "dev") {
    loadSnowpackConfig(context)
      .then((config) => {
        webviewManager.devServerConfig = {
          port: config.devOptions.port,
          hmrSocketPort: config.devOptions.hmrPort ?? config.devOptions.port,
        };
      })
      .then(devConfigReady);
  } else {
    devConfigReady();
  }
  globalModuleManager.api.ScriptService.check().finally(startUpReady);
  return createPublicAPI(globalModuleManager.api);
}

export function deactivate() {
  // Do nothing
}
