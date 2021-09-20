import * as vscode from "vscode";
import env from "@esbuild-env";
import { createWebviewManager } from "./webview-handler";
import { createEventHubAdapter } from "./events/event-manager";
import { Command, Commands } from "./commands/names";
import { loadSnowpackConfig } from "./debug/snowpack-dev";
import { createCoreAPI } from "./modules/core-module";
import { createMessageHandler } from "./messages/message-manager";
import type { CoreAPI, CoreEvents } from "../types/public-api";
import { createModuleManager } from "./modules/module-manager";
import { create, cleanUp, deleteScript, edit, execute } from "./actions/script";
import { installModule } from "./actions/module";
import { handlerFactory } from "./commands/factory";
import { createPublicAPI } from "./api/public-api";
import { generate } from "./debug/generator";
import type { Func } from "taio/build/types/concepts";
import { startUp } from "./start/start-up";
import { createTreeViewService } from "./modules/views/tree-view-service";
import { defaultConfig } from "./configs/user-config";

export function activate(context: vscode.ExtensionContext): CoreAPI {
  const globalEventHubAdapter = createEventHubAdapter<CoreEvents>();
  const globalModuleManager = createModuleManager(
    createCoreAPI(context, globalEventHubAdapter)
  );
  const { api } = globalModuleManager;
  const treeViewService = createTreeViewService(api.ScriptService);
  treeViewService.register();
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
  context.subscriptions.push(api.ScriptService);
  context.subscriptions.push(api.ScriptService);
  const { open: doOpen, reload, close } = webviewManager;
  const open = async () => {
    doOpen();
    webviewManager.messageHandler ??
      webviewManager.attach(globalMessageHandler);
    globalEventHubAdapter.attach(webviewManager.panel!);
    webviewManager.onClose(() => {
      api.ScriptService.cleanUpAll({
        includeMounted: false,
      });
      globalEventHubAdapter.detach(webviewManager.panel!);
    });
  };
  const commandsMapping: Record<Command, Func<[], void>> = {
    [Commands.Configuration.Reset]: () =>
      api.ConfigService.updateConfigs(defaultConfig),
    [Commands.PackageManage.InstallModule]: () => installModule(api),
    [Commands.ScriptControl.Execute]: (...args: unknown[]) =>
      execute(api, ...args),
    [Commands.ScriptControl.ExecuteCurrentScript]: () =>
      api.ScriptService.executeCurrent(),
    [Commands.ScriptControl.ForceCheckUserScriptsFolder]: () =>
      api.StartUpService.checkAll(true),
    [Commands.ScriptControl.CleanUp]: (...args: unknown[]) =>
      cleanUp(api, ...args),
    [Commands.ScriptControl.CleanUpAllSideEffects]: () =>
      api.ScriptService.cleanUpAll({
        includeMounted: true,
      }),
    [Commands.ScriptControl.Create]: () => create(api),
    [Commands.ScriptControl.Delete]: (...args: unknown[]) =>
      deleteScript(api, ...args),
    [Commands.ScriptControl.EditScript]: (...args: unknown[]) =>
      edit(api, ...args),
    [Commands.TreeViewControl.Refresh]: treeViewService.refresh,
    [Commands.WebviewControl.Open]: open,
    [Commands.WebviewControl.Close]: close,
    [Commands.WebviewControl.Reload]: reload,
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
  context.subscriptions.push({
    dispose: globalEventHubAdapter.dispatcher.on("script-list-update", () => {
      treeViewService.refresh();
    }),
  });
  const publicAPI = createPublicAPI(api);
  publicAPI.StartUpService.checkAll().finally(startUp.done);
  return publicAPI;
}

export function deactivate() {
  // Do nothing
}
