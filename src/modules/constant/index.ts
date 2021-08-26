export const paths = {
  userScripts: "user-scripts",
  meta: "meta.json",
  declaration: "config.d.ts",
  apiDeclaration: "api.d.ts",
  mainScript: "index",
  packageJson: "package.json",
} as const;

export const names = {
  configName: "Config",
} as const;

export const globalStateKeys = {
  checked: "START_UP_CHECKED",
} as const;
