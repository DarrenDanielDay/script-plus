import type * as vscode from "vscode";
import type { CoreAPI, CoreEvents } from "../app/message-protocol";
import type { IEventHubAdapter } from "../events/event-manager";
import { createConfigService } from "./config/config-service";
import { createPackageService } from "./package/package-service";
import { createScriptService } from "./script/script-service";
import { createStorageService } from "./storage/storage-service";

function createCoreAPI(
  context: vscode.ExtensionContext,
  eventHub: IEventHubAdapter<CoreEvents>
): CoreAPI {
  const storageService = createStorageService(context);
  const configService = createConfigService(eventHub);
  const packageService = createPackageService(storageService, configService);
  const coreApi: CoreAPI = {
    ScriptService: createScriptService(
      context,
      eventHub,
      storageService,
      packageService
    ),
    ConfigService: configService,
    PackageService: packageService,
  };
  return coreApi;
}

export { createCoreAPI };
