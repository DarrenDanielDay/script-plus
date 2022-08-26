import { token } from "func-di";
import type * as vscode from "vscode";
import type {
  ConfigService,
  CoreEvents,
  PackageService,
  ScriptService,
  StartUpService,
} from "../../../types/public-api";
import type { IEventHubAdapter } from "../../events/event-manager";
import type { CodeService } from "../code/code-service";
import type {
  DependencyInstallTaskService,
  PackageInstallTaskService,
} from "../package/package-service";
import type { StorageService } from "../storage/storage-service";

const context = token<vscode.ExtensionContext>("context");
const startUpService = token<StartUpService>("StartUpService");
const packageService = token<PackageService>("PackageService");
const codeService = token<CodeService>("CodeService");
const scriptService = token<ScriptService>("ScriptService");
const configService = token<ConfigService>("ConfigService");
const storageService = token<StorageService>("StorageService");
const eventHub = token<IEventHubAdapter<CoreEvents>>(
  "IEventHubAdapter<CoreEvents>"
);
const legacyTuple =
  token<
    [PackageService, PackageInstallTaskService, DependencyInstallTaskService]
  >("<internal legacy>");
const installTask = token<PackageInstallTaskService>(
  "PackageInstallTaskService"
);
const dependencyTask = token<DependencyInstallTaskService>(
  "DependencyInstallTaskService"
);
export {
  context,
  startUpService,
  packageService,
  codeService,
  scriptService,
  configService,
  storageService,
  eventHub,
  installTask,
  legacyTuple,
  dependencyTask,
};
