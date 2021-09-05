import type { ScriptPlusConfig } from "../configs/user-config";

export enum InstallPosition {
  Local = "local",
  Global = "global",
}
export enum PackageManager {
  npm = "npm",
  yarn = "yarn",
}

export interface ConfigUpdateSignal {
  fullConfig: ScriptPlusConfig;
}
