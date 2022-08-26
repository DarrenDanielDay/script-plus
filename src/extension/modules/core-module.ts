import { container, implementation, provide } from "func-di";
import type * as vscode from "vscode";
import type { CoreAPI, CoreEvents } from "../../types/public-api";
import type { IEventHubAdapter } from "../events/event-manager";
import { codeServiceImpl } from "./code/code-service";
import { configServiceImpl } from "./config/config-service";
import {
  dependencyTaskImpl,
  installTaskImpl,
  legacyTupleImpl,
  packageServiceImpl,
} from "./package/package-service";
import { scriptServiceImpl } from "./script/script-service";
import { startUpServiceImpl } from "./start/start-up-service";
import { storageServiceImpl } from "./storage/storage-service";
import * as tokens from "./tokens";

const createCoreAPI = (
  context: vscode.ExtensionContext,
  eventHub: IEventHubAdapter<CoreEvents>
): CoreAPI => {
  const ioc = container([
    provide.stateful(implementation(tokens.context, context)),
    provide.stateful(implementation(tokens.eventHub, eventHub)),
    provide.stateful(codeServiceImpl),
    provide.stateful(configServiceImpl),
    provide.stateful(packageServiceImpl),
    provide.stateful(scriptServiceImpl),
    provide.stateful(startUpServiceImpl),
    provide.stateful(storageServiceImpl),
    provide.stateful(installTaskImpl),
    provide.stateful(dependencyTaskImpl),
    provide.stateful(legacyTupleImpl),
  ]);
  const config = ioc.request(tokens.configService);
  const pkg = ioc.request(tokens.packageService);

  const script = ioc.request(tokens.scriptService);
  const startUp = ioc.request(tokens.startUpService);
  const coreApi: CoreAPI = {
    ConfigService: config,
    PackageService: pkg,
    ScriptService: script,
    StartUpService: startUp,
  };
  return coreApi;
};

export { createCoreAPI };
