import type { ScriptPlusConfig } from "../extension/configs/user-config";

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

export enum DependencyStrategy {
  AlwaysLatest = "always latest",
  LocalInstalled = "local installed",
}

export interface ConfigUpdateSignal {
  fullConfig: ScriptPlusConfig;
}
