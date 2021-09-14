import type * as vscode from "vscode";
import type { CoreAPI, CoreEvents } from "../types/public-api";
import type { IEventHubAdapter } from "../events/event-manager";
import { createConfigService } from "./config/config-service";
import { createPackageService } from "./package/package-service";
import { createScriptService } from "./script/script-service";
import { createStorageService } from "./storage/storage-service";
import { createStartUpService } from "./start/start-up-service";

function createCoreAPI(
  context: vscode.ExtensionContext,
  eventHub: IEventHubAdapter<CoreEvents>
): CoreAPI {
  const storageService = createStorageService(context);
  const configService = createConfigService(eventHub);
  const [packageService, installTaskSercice] = createPackageService(
    storageService,
    configService
  );
  const coreApi: CoreAPI = {
    ConfigService: configService,
    PackageService: packageService,
    ScriptService: createScriptService(
      context,
      eventHub,
      storageService,
      packageService
    ),
    StartUpService: createStartUpService(
      packageService,
      storageService,
      configService,
      installTaskSercice
    ),
  };
  return coreApi;
}

export { createCoreAPI };
