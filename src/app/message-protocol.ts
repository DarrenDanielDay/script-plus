// Define your protocol here, and implement them in `modules` with best practice!
import type { UserScript } from "../models/script";
import type { ExecutionTask } from "../models/execution-task";
export interface CoreAPI {
  vscode: typeof import("vscode");
  ScriptService: ScriptService;
}

export interface CoreEvents {
  task: string;
}

export interface ScriptService {
  check(): Promise<void>;
  create(script: UserScript): Promise<void>;
  getList(): Promise<UserScript[]>;
  updateScript(script: UserScript): Promise<void>;
  delete(script: UserScript): Promise<void>;
  execute(
    script: UserScript,
    params: Record<string, unknown>
  ): Promise<ExecutionTask>;
}
