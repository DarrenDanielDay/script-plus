export const paths = {
  userScripts: "user-scripts",
  meta: "meta.json",
  declaration: "config.d.ts",
  apiDeclaration: "api.d.ts",
  mainScript: "index",
  packageJson: "package.json",
  nodeModules: "node_modules",
} as const;

export const names = {
  configName: "Config",
  extension: "scriptplus",
} as const;

export const namespaces = {
  commands: "commands",
  configs: "configs",
  globalStates: "globalStates",
} as const;

export const scriptBundleFilter = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "Script Plus Bundle": [names.extension],
};
