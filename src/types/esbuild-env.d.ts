// Custom env declaration of esbuild
declare module "@esbuild-env" {
  interface ESBuildEnv {
    ENV: "dev" | "prod";
    STATIC_FILE_BASE_DIR_NAMES: string[];
    EXTENSION_BASE_NAME: "script-plus";
    TEMPLATES: {
      TS_TEMPLATE: string;
      JS_TEMPLATE: string;
      API_D_TS: string;
    };
  }
  const env: ESBuildEnv;
  export type { ESBuildEnv };
  export default env;
}
