import env from "@esbuild-env";

export const ScriptControl = {
  Execute: `${env.EXTENSION_BASE_NAME}.execute`,
  ExecuteCurrentScript: `${env.EXTENSION_BASE_NAME}.executeCurrentScript`,
  ForceCheckUserScriptsFolder: `${env.EXTENSION_BASE_NAME}.forceCheckUserScriptsFolder`,
  CleanUp: `${env.EXTENSION_BASE_NAME}.cleanUp`,
  CleanUpAllSideEffects: `${env.EXTENSION_BASE_NAME}.cleanUpAllSideEffects`,
} as const;
