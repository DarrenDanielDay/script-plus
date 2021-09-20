import type { ScriptPlusConfig } from "../configs/user-config";

export enum InstallPosition {
  Local = "local",
  Global = "global",
}
export enum PackageManagerKind {
  npm = "npm",
  yarn = "yarn",
}

export enum TransformerKind {
  esbuild = "esbuild",
  babel = "babel",
}

export interface ConfigUpdateSignal {
  fullConfig: ScriptPlusConfig;
}
