import type * as vscode from "vscode";
import type { CoreAPI, CoreEvents } from "../../types/public-api";
import type { IEventHubAdapter } from "../events/event-manager";
import { createConfigService } from "./config/config-service";
import { createPackageService } from "./package/package-service";
import { createScriptService } from "./script/script-service";
import { createStorageService } from "./storage/storage-service";
import { createStartUpService } from "./start/start-up-service";
import { createTransformService } from "./code/code-service";

function createCoreAPI(
  context: vscode.ExtensionContext,
  eventHub: IEventHubAdapter<CoreEvents>
): CoreAPI {
  const storageService = createStorageService(context);
  const configService = createConfigService(eventHub);
  const [packageService, installTaskSercice, installDependencyTaskService] =
    createPackageService(context, storageService, configService);
  const transformService = createTransformService(configService);
  const scriptService = createScriptService(
    context,
    eventHub,
    storageService,
    packageService,
    transformService
  );
  const startUpService = createStartUpService(
    packageService,
    storageService,
    configService,
    installTaskSercice,
    installDependencyTaskService
  );
  const coreApi: CoreAPI = {
    ConfigService: configService,
    PackageService: packageService,
    ScriptService: scriptService,
    StartUpService: startUpService,
  };
  return coreApi;
}

export { createCoreAPI };
