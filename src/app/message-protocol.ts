// Define your protocol here, and implement them in `modules` with best practice!
import type { UserScript } from "../models/script";
export interface CoreAPI {
  vscode: typeof import("vscode");
  ScriptService: ScriptService;
}

export interface CoreEvents {
  chat: string;
}

export interface ScriptService {
  check(): Promise<void>;
  create(script: UserScript): Promise<void>;
  getList(): Promise<UserScript[]>;
  delete(script: UserScript): Promise<void>;
}
