import type { CoreEvents, ScriptService } from "../../app/message-protocol";
import {
  isBooleanArgumentField,
  isEnumArgumentField,
  isNumberArgumentField,
  isStringArgumentField,
  isUserScript,
  PassedParameter,
  UserScript,
} from "../../models/script";
import * as vscode from "vscode";
import { globalStateKeys, names, paths } from "../constant";
import { glob, installPackage, path, randomString } from "../node-utils";
import esbuild from "esbuild";
import ts from "typescript";
import vm from "vm";
import { createRequire } from "module";
import packageJson from "package-json";
import { die } from "taio/build/utils/internal/exceptions";
import { enumValues } from "taio/build/utils/enum";
import {
  isNullish,
  isNumber,
  isString,
} from "taio/build/utils/validator/primitive";
import {
  ExecutionTask,
  isCleanUp,
  isLogLevel,
  isScriptRunResultObject,
} from "../../models/execution-task";
import { defineValidator } from "taio/build/utils/validator/utils";
import { isObject } from "taio/build/utils/validator/object";
import type { AnyFunc } from "taio/build/types/concepts";
import type { IEventHubAdapter } from "../../events/event-manager";
import {
  divider,
  existDir,
  existFile,
  globalErrorHandler,
  openEdit,
  output,
  readFile,
  writeFile,
} from "../vscode-utils";
import globalDirectories from "global-dirs";
import * as semver from "semver";
import subMonths from "date-fns/subMonths";
import type { CleanUp, ScriptRunResult } from "../../templates/api";
import env from "@esbuild-env";
const f = ts.factory;
interface ScriptModule {
  main: (
    config: PassedParameter,
    context: vscode.ExtensionContext
  ) => ScriptRunResult;
}

interface LocalExecutionTask extends ExecutionTask {
  promise: Promise<ScriptRunResult>;
  cleanUp?: CleanUp;
  running: boolean;
}

const isScriptModule = defineValidator<ScriptModule>(
  isObject({
    main: (fn): fn is AnyFunc => typeof fn === "function",
  })
);

export function createScriptService(
  context: vscode.ExtensionContext,
  eventHub: IEventHubAdapter<CoreEvents>
): ScriptService {
  const activeTasks = new Map<string, LocalExecutionTask>();
  function basedOnScripts(...fragments: string[]) {
    return vscode.Uri.joinPath(
      context.globalStorageUri,
      paths.userScripts,
      ...fragments
    );
  }
  async function scriptFolderCheck() {
    await vscode.workspace.fs.createDirectory(basedOnScripts());
    const packageJsonFile = basedOnScripts(paths.packageJson);
    if (!(await existFile(packageJsonFile))) {
      output.appendLine("Creating package.json");
      await writeFile(
        packageJsonFile,
        JSON.stringify(
          {
            name: "user-scripts",
            version: "0.0.0",
            description: "Script folder for vscode plugin `Script Plus`.",
            license: "MIT",
          },
          undefined,
          2
        )
      );
    }
    await writeFile(
      basedOnScripts(paths.apiDeclaration),
      env.TEMPLATES.API_D_TS
    );
  }
  async function vscodeVersionCheck() {
    const version = new semver.SemVer(vscode.version);
    const { stdout, stderr } = await installPackage(
      `@types/vscode@${version.major}.${version.minor}`,
      {
        cwd: basedOnScripts().fsPath,
        global: false,
      }
    );
    divider("install @types/vscode stdout");
    output.appendLine(stdout);
    divider("install @types/vscode stderr");
    output.appendLine(stderr);
  }
  function isValidScriptName(name: string) {
    const special = new Set([..."~`!@#$%^&*()_+={}|[]\\:;\"'<>?,./ "]);
    return ![...name].some((char) => special.has(char));
  }
  function getScriptFileName(script: UserScript): string {
    return `${paths.mainScript}.${script.lang}`;
  }
  function getScriptAbsolutePath(script: UserScript) {
    return basedOnScripts(script.name, getScriptFileName(script));
  }

  async function getMeta(folder: vscode.Uri): Promise<UserScript> {
    const content: unknown = JSON.parse(
      await readFile(vscode.Uri.joinPath(folder, paths.meta))
    );
    if (!isUserScript(content)) {
      return die("Invalid meta file");
    }
    return content;
  }

  function writeMeta(script: UserScript): Promise<void> {
    return writeFile(
      basedOnScripts(script.name, paths.meta),
      JSON.stringify(script, undefined, 2)
    );
  }

  function writeDeclaration(script: UserScript): Promise<void> {
    return writeFile(
      basedOnScripts(script.name, paths.declaration),
      `// This file is generated by the extension.
// NEVER MODIFY IT!

${getConfigTsDeclCodeOfUserScript(script)}`
    );
  }

  async function getScriptContent(script: UserScript) {
    const content = await readFile(getScriptAbsolutePath(script));
    return content;
  }

  async function transformTsScript(content: string) {
    const esbuildTransformed = await esbuild.transform(content, {
      format: "cjs",
      loader: "ts",
    });
    return esbuildTransformed.code;
  }

  async function transformJsScript(content: string) {
    const esbuildTransformed = await esbuild.transform(content, {
      format: "cjs",
      loader: "js",
    });
    return esbuildTransformed.code;
  }

  function initExecutionContext(taskId: string) {
    const exports = {};
    const localRequire = createRequire(basedOnScripts("node_modules").fsPath);
    const globalYarnRequire = createRequire(globalDirectories.yarn.packages);
    const globalNpmRequire = createRequire(globalDirectories.npm.packages);
    const tryRequire = (
      nodeRequire: NodeRequire,
      moduleId: string
    ): { module: unknown } | null => {
      try {
        return {
          module: nodeRequire(moduleId),
        };
      } catch (error) {
        return null;
      }
    };
    const customRequire = (moduleId: string) => {
      if (moduleId === "vscode") return vscode;
      for (const nodeRequire of [
        localRequire,
        globalYarnRequire,
        globalNpmRequire,
        require,
      ]) {
        const result = tryRequire(nodeRequire, moduleId);
        if (result) return result.module;
      }
      return die(
        `Cannot find module "${moduleId}", have you installed it in extension or globally?`
      );
    };
    const context = vm.createContext({
      ...Object.getOwnPropertyNames(globalThis).reduce((globalMixin, key) => {
        Reflect.set(globalMixin, key, Reflect.get(globalThis, key));
        return globalMixin;
      }, {}),
      exports,
      console: new Proxy(console, {
        get(target, methodName: keyof typeof console, receiver) {
          const originalMethod: unknown = Reflect.get(
            target,
            methodName,
            receiver
          );
          if (isLogLevel(methodName)) {
            return (...args: unknown[]) => {
              if (typeof originalMethod !== "function") {
                return die("Impossible case.");
              }
              eventHub.dispatcher.emit("task", {
                type: "output",
                output: {
                  level: methodName,
                  payload: args,
                },
                taskId,
              });
              return originalMethod.apply(target, args);
            };
          }
          return originalMethod;
        },
      }),
      require: customRequire,
    });
    return {
      exports,
      context,
    };
  }

  async function createScriptModule(
    script: UserScript,
    context: object,
    exports: object
  ): Promise<ScriptModule> {
    const rawContent = await getScriptContent(script);
    let content: string;
    if (script.lang === "ts") {
      content = await transformTsScript(rawContent);
    } else {
      content = await transformJsScript(rawContent);
    }
    const vmScript = new vm.Script(content, {
      displayErrors: true,
      filename: getScriptFileName(script),
    });
    vmScript.runInContext(context, {
      microtaskMode: "afterEvaluate",
      displayErrors: true,
    });
    if (isScriptModule(exports)) {
      return exports;
    } else {
      return die(`Script "${script.name}" is not written in expected format`);
    }
  }

  async function runScript(
    script: UserScript,
    args: PassedParameter,
    taskId: string
  ) {
    const { context: executionContext, exports } = initExecutionContext(taskId);
    const scriptModule = await createScriptModule(
      script,
      executionContext,
      exports
    );
    return scriptModule.main(args, context);
  }
  function finishTask(taskId: string, result: unknown, hasError?: boolean) {
    const task = activeTasks.get(taskId);
    if (task?.running) {
      task.running = false;
      let trueResult: unknown;
      if (isCleanUp(result)) {
        task.cleanUp = result;
        trueResult = undefined;
      } else if (isScriptRunResultObject(result)) {
        task.cleanUp = result.cleanUp;
        trueResult = result.custom;
      } else if (!isNullish(result) && !hasError) {
        return die("Invalid script return value!");
      }
      eventHub.dispatcher.emit("task", {
        taskId,
        type: "terminate",
        result: trueResult,
      });
    }
  }
  async function cleanUpTaskResource(taskId: string) {
    const task = activeTasks.get(taskId);
    if (!task) {
      return die(`Task id ${taskId} does not exist!`);
    }
    if (task.running) {
      return die(`Task id ${taskId} is still running!`);
    }
    await task.cleanUp?.();
    activeTasks.delete(taskId);
  }

  const scriptService: ScriptService = {
    dispose() {
      activeTasks.forEach((task) => {
        task.cleanUp?.();
      });
    },
    async check(force) {
      await scriptFolderCheck();
      const checked = context.globalState.get(globalStateKeys.checked);
      if (checked && !force) {
        const lastChecked = new Date(`${checked}`);
        if (lastChecked > subMonths(new Date(), 1)) {
          // Skip @types/vscode update if checked in one month.
          return;
        }
      }
      try {
        await vscodeVersionCheck();
        await context.globalState.update(globalStateKeys.checked, new Date());
      } catch (error) {
        globalErrorHandler(error);
      }
    },
    async create(script) {
      if (!isValidScriptName(script.name)) {
        return die(`Script name should not include the following symbols and white spaces (kebab-case is recommended):
~\`!@#$%^&*()_+={}|[]\\:;\"\'<>?,./`);
      }
      if (!isUserScript(script)) {
        vscode.window.showInformationMessage(`Invalid script object!`);
        return;
      }
      const scriptHome = basedOnScripts(script.name);
      if (await existDir(scriptHome)) {
        vscode.window.showInformationMessage(
          `Script <${script.name}> already exists`
        );
        return;
      }
      await vscode.workspace.fs.createDirectory(scriptHome);
      await Promise.all([
        writeMeta(script),
        writeDeclaration(script),
        writeFile(
          basedOnScripts(script.name, getScriptFileName(script)),
          script.lang === "ts" ? getTsTemplate() : getJsTemplate()
        ),
      ]);
    },
    async delete(script) {
      const scriptHost = basedOnScripts(script.name);
      if (!(await existDir(scriptHost))) {
        return die(`Script ${script.name} not found!`);
      }
      await vscode.workspace.fs.delete(scriptHost, {
        useTrash: false,
        recursive: true,
      });
      vscode.window.showInformationMessage(`Script ${script.name} Removed.`);
    },
    async getList() {
      const base = basedOnScripts();
      const metas = await glob(`**/${paths.meta}`, {
        cwd: base.fsPath,
      });
      const jsons = await Promise.all(
        metas.map(async (meta) =>
          JSON.parse(await readFile(vscode.Uri.joinPath(base, meta)))
        )
      );
      return jsons.filter(isUserScript);
    },
    async updateScript(script) {
      if (!isUserScript(script)) {
        return die(`Invalid script object!`);
      }
      await Promise.all([writeDeclaration(script), writeMeta(script)]);
    },
    async editScript(script) {
      await openEdit(getScriptAbsolutePath(script));
    },
    async execute(script, params) {
      const taskId = randomString(8);
      const executionTask = {
        taskId,
        taskName: script.name,
      };
      const promise = runScript(script, params, taskId);
      activeTasks.set(taskId, {
        ...executionTask,
        promise,
        running: true,
      });
      promise
        .then((result) => {
          finishTask(taskId, result);
        })
        .catch((error) => {
          globalErrorHandler(error);
          finishTask(taskId, error, true);
        });
      return executionTask;
    },

    async executeCurrent() {
      const currentFile = vscode.window.activeTextEditor?.document.uri;
      if (currentFile) {
        const folder = vscode.Uri.joinPath(currentFile, "..");
        const meta = await getMeta(folder);
        const defaults = Object.entries(
          meta.argumentConfig
        ).reduce<PassedParameter>((defaultArgs, [key, value]) => {
          defaultArgs[key] = value.defaultValue;
          return defaultArgs;
        }, {});
        scriptService.execute(meta, defaults);
      }
    },
    async getTasks() {
      return [...activeTasks.values()].map((localTask) => ({
        taskId: localTask.taskId,
        taskName: localTask.taskName,
      }));
    },
    async cleanUp(taskId) {
      await cleanUpTaskResource(taskId);
    },
    async listVersions(moduleId) {
      try {
        const packageMeta: Partial<packageJson.AbbreviatedMetadata> =
          await packageJson(moduleId, { allVersions: true });
        return [
          ...Object.keys(packageMeta.versions ?? {})
            .map(
              (version) =>
                new semver.SemVer(version, { includePrerelease: true })
            )
            .filter((version) => !version.prerelease.length)
            .reduce((set, semver) => {
              set.add(semver.format());
              return set;
            }, new Set<string>())
            .keys(),
        ].sort((a, b) => (semver.lt(a, b) ? 1 : semver.gt(a, b) ? -1 : 0));
      } catch (error) {
        if (error instanceof packageJson.PackageNotFoundError) {
          vscode.window.showErrorMessage(error.message);
          return [];
        } else {
          throw error;
        }
      }
    },
    async installPackage(packageName, version, options) {
      const { stdout, stderr } = await installPackage(
        `${packageName}${version ? `@${version}` : ""}`,
        {
          cwd: basedOnScripts().fsPath,
          global: options?.global,
        }
      );
      divider(`install ${packageName}`);
      divider("stdout");
      output.appendLine(stdout);
      divider("stderr");
      output.appendLine(stderr);
      output.show();
    },
  };
  return scriptService;
}

function getTextOfTsAstNode(node: ts.Node) {
  return ts
    .createPrinter()
    .printNode(
      ts.EmitHint.Unspecified,
      node,
      ts.createSourceFile(paths.declaration, "", ts.ScriptTarget.ES2015)
    );
}

function getConfigTsDeclCodeOfUserScript(script: UserScript): string {
  return getTextOfTsAstNode(
    f.createInterfaceDeclaration(
      /** decorators */ undefined,
      /** modifiers */ [f.createModifier(ts.SyntaxKind.ExportKeyword)],
      f.createIdentifier(names.configName),
      /** type parameters */ [],
      /** heritage clauses */ [],
      /** members */ Object.entries(script.argumentConfig).map(([key, field]) =>
        f.createPropertySignature(
          [f.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
          key,
          undefined,
          isStringArgumentField(field)
            ? f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
            : isNumberArgumentField(field)
            ? f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
            : isBooleanArgumentField(field)
            ? f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
            : isEnumArgumentField(field)
            ? f.createUnionTypeNode(
                enumValues(field.enumOptions.enumObject).map((value) =>
                  f.createLiteralTypeNode(
                    isString(value)
                      ? f.createStringLiteral(value)
                      : isNumber(value)
                      ? f.createNumericLiteral(value)
                      : die()
                  )
                )
              )
            : die()
        )
      )
    )
  );
}

function getTsTemplate() {
  return env.TEMPLATES.TS_TEMPLATE;
}

function getJsTemplate() {
  return env.TEMPLATES.JS_TEMPLATE;
}
