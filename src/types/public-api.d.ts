import type { PassedParameter, UserScript } from "../models/script";
import type { ScriptPlusConfig } from "../extension/configs/user-config";
import type {
  ExecutionTask,
  TaskExecutionSignal,
} from "../models/execution-task";
import type {
  AddPackageConfig,
  DependencyInstallConfig,
} from "../extension/utils/node-utils";
import type { DeepPartial } from "taio/build/types/object";
import type { ConfigUpdateSignal } from "../models/configurations";
export interface CoreAPI {
  ConfigService: ConfigService;
  PackageService: PackageService;
  ScriptService: ScriptService;
  StartUpService: StartUpService;
}

export interface CoreEvents {
  config: ConfigUpdateSignal;
  ["script-list-update"]: void;
  task: TaskExecutionSignal;
}

export interface StartUpService {
  checkAll(force?: boolean): Promise<void>;
  checkExtensionDependencies(force?: boolean): Promise<void>;
  checkFolder(): Promise<void>;
  checkVSCodeAndNodeJS(): Promise<string>;
}

export interface PackageService {
  listVersions(moduleId: string): Promise<string[]>;
  installExtensionDependencies(
    config: Pick<DependencyInstallConfig, "production" | "useLock">
  ): Promise<string>;
  installModules(
    moduleIds: string[],
    config: AddPackageConfig,
    message?: string,
    showLoading?: boolean
  ): Promise<string>;
  installPackage(
    moduleId: string,
    version: string,
    options?: { global?: boolean }
  ): Promise<void>;
}

export interface ScriptService {
  cleanUp(taskId: string): Promise<void>;
  cleanUpAll(config?: { includeMounted?: boolean }): Promise<void>;
  create(script: UserScript): Promise<void>;
  delete(script: UserScript, directly?: boolean): Promise<void>;
  dispose(): void;
  editScript(script: UserScript): Promise<void>;
  execute(script: UserScript, params: PassedParameter): Promise<ExecutionTask>;
  executeCurrent(): Promise<void>;
  export(script: UserScript): Promise<void>;
  getLastExecutedScriptName(): Promise<string | undefined>;
  getList(): Promise<UserScript[]>;
  getTasks(): Promise<ExecutionTask[]>;
  import(): Promise<void>;
  mountTask(taskId: string): Promise<void>;
  openUserScriptsFolder(): Promise<void>;
  updateScript(script: UserScript): Promise<void>;
  validateScriptNamePattern(name: string): string;
}

export interface ConfigService {
  dispose(): void;
  getConfigs(): Promise<ScriptPlusConfig>;
  updateConfigs(patch: DeepPartial<ScriptPlusConfig>): Promise<void>;
}
