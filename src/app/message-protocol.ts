// Define your protocol here, and implement them in `modules` with best practice!
import type { PassedParameter, UserScript } from "../models/script";
import type {
  ExecutionTask,
  TaskExecutionSignal,
} from "../models/execution-task";
export interface CoreAPI {
  vscode: typeof import("vscode");
  ScriptService: ScriptService;
}

export interface CoreEvents {
  task: TaskExecutionSignal;
}

export interface ScriptService {
  dispose(): void;
  check(force?: boolean): Promise<void>;
  create(script: UserScript): Promise<void>;
  getList(): Promise<UserScript[]>;
  updateScript(script: UserScript): Promise<void>;
  editScript(script: UserScript): Promise<void>;
  delete(script: UserScript): Promise<void>;
  execute(script: UserScript, params: PassedParameter): Promise<ExecutionTask>;
  executeCurrent(): Promise<void>;
  getTasks(): Promise<ExecutionTask[]>;
  cleanUp(taskId: string): Promise<void>;
  listVersions(moduleId: string): Promise<string[]>;
  installPackage(
    moduleId: string,
    version: string,
    options?: { global?: boolean }
  ): Promise<void>;
}
