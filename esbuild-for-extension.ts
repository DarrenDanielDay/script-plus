import type { ESBuildEnv } from "@esbuild-env";
import esbuild from "esbuild";
import path from "path";
import fs from "fs";
const readFile = (file: string) => fs.readFileSync(file).toString("utf-8");
const resolve = (...paths: string[]) => path.resolve(process.cwd(), ...paths);
const templates: ESBuildEnv["TEMPLATES"] = {
  API_D_TS: readFile(resolve("src", "templates", "api.d.ts")),
  JS_TEMPLATE: readFile(
    resolve("src", "templates", "script-name", "js-template.mjs")
  ),
  TS_TEMPLATE: readFile(
    resolve("src", "templates", "script-name", "ts-template.ts")
  ),
};
//#region Environment variables
const devEnv: ESBuildEnv = {
  ENV: "dev",
  STATIC_FILE_BASE_DIR_NAMES: ["src", "app", "src"],
  EXTENSION_BASE_NAME: "script-plus",
  EXTENSION_NAME: "Script Plus",
  TEMPLATES: templates,
};
const prodEnv: ESBuildEnv = {
  ENV: "prod",
  STATIC_FILE_BASE_DIR_NAMES: ["out", "ui"],
  EXTENSION_BASE_NAME: "script-plus",
  EXTENSION_NAME: "Script Plus",
  TEMPLATES: templates,
};
//#endregion

const isDev = process.argv.includes("--dev");

//#region Extension build options
const extensionCommonBuildOptions: esbuild.BuildOptions = {
  platform: "node",
  entryPoints: [path.resolve("src", "extension.ts")],
  external: ["vscode", "snowpack", "esbuild"],
  outdir: path.resolve("out"),
  plugins: [
    {
      name: "extension-env-resolver",
      setup(builder) {
        builder.onResolve({ filter: /@esbuild-env/ }, () => {
          return {
            path: "@esbuild-env",
            namespace: "@esbuild-env",
          };
        });
        builder.onLoad({ filter: /@esbuild-env/ }, () => {
          return {
            contents: JSON.stringify(isDev ? devEnv : prodEnv),
            loader: "json",
          };
        });
      },
    },
  ],
  bundle: true,
};
//#endregion
/**
 * Trace build message.
 */
function trackMessage(
  message: Pick<esbuild.BuildFailure, "errors" | "warnings">,
  method: (...args: unknown[]) => void
) {
  const date = new Date();
  const timeData = [date.getHours(), date.getMinutes(), date.getSeconds()];
  const prefix = `[${timeData
    .map((time) => `${time}`.padEnd(2, "0"))
    .join(":")}] [esbuild]`;
  method(`${prefix} Extension code rebuild!`);
  const logESBuildErrors = (message: esbuild.Message) => {
    const { location, text } = message;
    const { file, line, column, suggestion } = location!;
    method(`${prefix} ${file}(${line}:${column})`);
    text && method(`${prefix} ${text}`);
    suggestion && method(`${prefix} ${suggestion}`);
  };
  for (const warning of message.warnings) {
    logESBuildErrors(warning);
  }
  for (const error of message.errors) {
    logESBuildErrors(error);
  }
}
if (isDev) {
  esbuild.build({
    ...extensionCommonBuildOptions,
    sourcemap: "both",
    watch:
      typeof global !== "undefined"
        ? undefined
        : {
            onRebuild(error, result) {
              if (error) trackMessage(error, console.error);
              else trackMessage(result!, console.log);
            },
          },
  });
} else {
  esbuild
    .build({
      ...extensionCommonBuildOptions,
      minify: true,
      treeShaking: true,
    })
    .catch(console.error);
}
