import type { PassedParameter, UserScript } from "../models/script";
import type { ScriptPlusConfig } from "../configs/user-config";
import type {
  ExecutionTask,
  TaskExecutionSignal,
} from "../models/execution-task";
import type { InstallConfig } from "../modules/node-utils";
import type { DeepPartial } from "taio/build/types/object";
import type { ConfigUpdateSignal } from "../models/configurations";
export interface CoreAPI {
  ConfigService: ConfigService;
  PackageService: PackageService;
  ScriptService: ScriptService;
  StartUpService: StartUpService;
}

export interface CoreEvents {
  task: TaskExecutionSignal;
  config: ConfigUpdateSignal;
}

export interface StartUpService {
  checkAll(force?: boolean): Promise<void>;
  checkExtensionDependencies(force?: boolean): Promise<void>;
  checkFolder(): Promise<void>;
  checkVSCodeAndNodeJS(): Promise<string>;
}

export interface PackageService {
  listVersions(moduleId: string): Promise<string[]>;
  installPackage(
    moduleId: string,
    version: string,
    options?: { global?: boolean }
  ): Promise<void>;
  installModules(
    moduleIds: string[],
    config: InstallConfig,
    message?: string,
    showLoading?: boolean
  ): Promise<string>;
}

export interface ScriptService {
  dispose(): void;
  create(script: UserScript): Promise<void>;
  getList(): Promise<UserScript[]>;
  updateScript(script: UserScript): Promise<void>;
  editScript(script: UserScript): Promise<void>;
  delete(script: UserScript, directly?: boolean): Promise<void>;
  export(script: UserScript): Promise<void>;
  import(): Promise<void>;
  execute(script: UserScript, params: PassedParameter): Promise<ExecutionTask>;
  executeCurrent(): Promise<void>;
  getTasks(): Promise<ExecutionTask[]>;
  getLastExecutedScriptName(): Promise<string | undefined>;
  mountTask(taskId: string): Promise<void>;
  cleanUp(taskId: string): Promise<void>;
  cleanUpAll(config?: { includeMounted?: boolean }): Promise<void>;
}

export interface ConfigService {
  dispose(): void;
  getConfigs(): Promise<ScriptPlusConfig>;
  updateConfigs(patch: DeepPartial<ScriptPlusConfig>): Promise<void>;
}
