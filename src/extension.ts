import * as vscode from "vscode";
import env from "@esbuild-env";
import { createWebviewManager } from "./webview-handler";
import { createEventHubAdapter } from "./events/event-manager";
import { Command, Commands } from "./commands/names";
import { loadSnowpackConfig } from "./debug/snowpack-dev";
import { createCoreAPI } from "./modules/core-module";
import { createMessageHandler } from "./messages/message-manager";
import type { CoreAPI, CoreEvents } from "./types/public-api";
import { createModuleManager } from "./modules/module-manager";
import { askScript, cleanUp, execute } from "./actions/script";
import { installModule } from "./actions/module";
import { handlerFactory } from "./commands/factory";
import { createPublicAPI } from "./api/public-api";
import { generate } from "./debug/generator";
import type { Func } from "taio/build/types/concepts";
import { startUp } from "./start/start-up";

export function activate(context: vscode.ExtensionContext): CoreAPI {
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
    env.EXTENSION_NAME,
    context
  );
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
  const commandsMapping: Record<Command, Func<[], void>> = {
    [Commands.WebviewControl.Open]: open,
    [Commands.WebviewControl.Close]: close,
    [Commands.WebviewControl.Reload]: reload,
    [Commands.ScriptControl.Execute]: () => execute(globalModuleManager.api),
    [Commands.ScriptControl.ExecuteCurrentScript]: () =>
      globalModuleManager.api.ScriptService.executeCurrent(),
    [Commands.ScriptControl.ForceCheckUserScriptsFolder]: () =>
      globalModuleManager.api.ScriptService.check(true),
    [Commands.ScriptControl.CleanUp]: () => cleanUp(globalModuleManager.api),
    [Commands.ScriptControl.CleanUpAllSideEffects]: () =>
      globalModuleManager.api.ScriptService.cleanUpAll({
        includeMounted: true,
      }),
    [Commands.PackageManage.InstallModule]: () =>
      installModule(globalModuleManager.api),
    [Commands.ScriptControl.EditScript]: () =>
      askScript(globalModuleManager.api).then(
        (script) =>
          script && globalModuleManager.api.ScriptService.editScript(script)
      ),
  };
  Object.entries(commandsMapping).forEach(([command, handler]) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handlerFactory(handler))
    );
  });
  if (env.ENV === "dev") {
    loadSnowpackConfig(context)
      .then((config) => {
        webviewManager.devServerConfig = {
          port: config.devOptions.port,
          hmrSocketPort: config.devOptions.hmrPort ?? config.devOptions.port,
        };
      })
      .then(() => import("./start/dev").then((mod) => mod.devServer.done()));
    generate(context);
  }
  globalModuleManager.api.ScriptService.check().finally(startUp.done);
  return createPublicAPI(globalModuleManager.api);
}

export function deactivate() {
  // Do nothing
}
