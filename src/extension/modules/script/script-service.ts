import type {
  CoreEvents,
  PackageService,
  ScriptService,
} from "../../../types/public-api";
import {
  Dependencies,
  isBooleanArgumentField,
  isEnumArgumentField,
  isNumberArgumentField,
  isScriptPlusBundle,
  isStringArgumentField,
  isUserScript,
  PassedParameter,
  ScriptPlusBundle,
  UserScript,
} from "../../../models/script";
import * as vscode from "vscode";
import { names, paths, scriptBundleFilter } from "../constant";
import {
  glob,
  parsePackageJson,
  path,
  randomString,
} from "../../utils/node-utils";
import esbuild from "esbuild";
import ts from "typescript";
import vm from "vm";
import { tmpdir, homedir } from "os";
import { builtinModules } from "module";
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
} from "../../../models/execution-task";
import { defineValidator } from "taio/build/utils/validator/utils";
import { isObject } from "taio/build/utils/validator/object";
import type { AnyFunc } from "taio/build/types/concepts";
import type { IEventHubAdapter } from "../../events/event-manager";
import {
  askForOptions,
  askYesNoQuestion,
  dumpObjectToFile,
  existDir,
  getErrorMessage,
  globalErrorHandler,
  loadObjectFromFile,
  openEdit,
  output,
  readFile,
  writeFile,
} from "../../utils/vscode-utils";
import globalDirectories from "global-dirs";
import * as semver from "semver";
import type { CleanUp, ScriptRunResult } from "../../templates/api";
import env from "@esbuild-env";
import { intl } from "../../i18n/core/locale";
import { invalidUsage } from "../../errors/invalid-usage";
import { impossible } from "../../errors/internal-error";
import { getDisplay } from "../../../common/object-display";
import type { StorageService } from "../storage/storage-service";
import type { CodeService } from "../code/code-service";
const f = ts.factory;
interface ScriptModule {
  main: (
    config: PassedParameter,
    context: vscode.ExtensionContext
  ) => ScriptRunResult;
}

interface LocalExecutionTask extends ExecutionTask {
  promise: Promise<ScriptRunResult>;
  reqiredPaths: string[];
  mount: boolean;
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
  eventHub: IEventHubAdapter<CoreEvents>,
  storage: StorageService,
  pkg: PackageService,
  transform: CodeService
): ScriptService {
  const activeTasks = new Map<string, LocalExecutionTask>();
  const { basedOnScripts, getGlobalStates, updateGlobalState } = storage;
  const { installModules } = pkg;
  const userConsole = vscode.window.createOutputChannel(
    intl("script.execute.console.name")
  );
  function isValidScriptName(name: string) {
    const specialChars = "~`!@#$%^&*()_+={}|[]\\:;\"'<>?,./ ";
    const special = new Set([...specialChars]);
    return [...name].some((char) => special.has(char))
      ? intl("script.create.validate.name", { special: specialChars })
      : "";
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
      return invalidUsage(intl("script.meta.invalidFile"));
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
  function emitScriptListUpdate() {
    eventHub.dispatcher.emit("script-list-update", undefined);
  }
  async function installScript(bundle: ScriptPlusBundle) {
    const { content, meta, dependencies } = bundle;
    const scriptHome = basedOnScripts(meta.name);
    const scripts = await scriptService.getList();
    const scriptNameExists = (value: string): boolean => {
      return scripts.some((script) => script.name === value);
    };
    if (await existDir(scriptHome)) {
      const message = intl("script.install.exists.promote", {
        scriptName: meta.name,
      });
      const overwrite = intl("script.install.exists.overwrite");
      const rename = intl("script.install.exists.rename");
      const action = await askForOptions(message, true, overwrite, rename);
      if (action === undefined) {
        return;
      }
      if (action === rename) {
        const newName = await vscode.window.showInputBox({
          prompt: intl("script.install.rename.promote", {
            scriptName: meta.name,
          }),
          value: meta.name,
          async validateInput(value) {
            return (
              isValidScriptName(value) ||
              (scriptNameExists(value)
                ? intl("script.install.rename.validate.exists", { value })
                : "")
            );
          },
        });
        if (newName) {
          meta.name = newName;
        } else {
          vscode.window.showInformationMessage(
            intl("script.install.abort.message", { scriptName: meta.name })
          );
          return;
        }
      }
    }
    await vscode.workspace.fs.createDirectory(scriptHome);
    await Promise.all([
      writeMeta(meta),
      writeDeclaration(meta),
      writeFile(basedOnScripts(meta.name, getScriptFileName(meta)), content),
      (async () => {
        const packages = Object.entries(dependencies).map(
          ([pkg, version]) => `${pkg}@${version}`
        );
        if (packages.length) {
          const userSayYes = await askYesNoQuestion(
            intl("script.install.dependencies.promote", {
              scriptName: meta.name,
              dependencies: packages.join("\n"),
            })
          );
          if (userSayYes) {
            await installModules(
              packages,
              {
                cwd: basedOnScripts().fsPath,
              },
              intl("script.logging.installDependencies", {
                scriptName: meta.name,
              })
            );
          }
        }
      })(),
    ]);
    emitScriptListUpdate();
  }

  async function findInstalledVersionFor(importPath: string) {
    const tryFindWith = async (
      packageJsonFolderUri: vscode.Uri
    ): Promise<{ name: string; version: semver.SemVer } | null> => {
      try {
        const uri = vscode.Uri.joinPath(
          packageJsonFolderUri,
          paths.packageJson
        );
        const content = await readFile(uri);
        const packageJSONContent = parsePackageJson(content);
        if (
          packageJSONContent &&
          importPath.startsWith(packageJSONContent.name)
        ) {
          const version = semver.parse(packageJSONContent.version);
          if (version) {
            return {
              name: packageJSONContent.name,
              version,
            };
          }
        }
        output.appendLine(
          intl("script.logging.invalidPackageJson", { fileName: uri.fsPath })
        );
      } catch (error) {}
      return null;
    };
    const requirePaths = getRequirePaths();
    for (const requirePath of requirePaths) {
      const baseUri = vscode.Uri.file(requirePath);
      for (
        let packageJsonFolderUri = vscode.Uri.joinPath(baseUri, importPath);
        packageJsonFolderUri.fsPath !== baseUri.fsPath;
        packageJsonFolderUri = vscode.Uri.joinPath(packageJsonFolderUri, "..")
      ) {
        const trial = await tryFindWith(packageJsonFolderUri);
        if (trial) {
          return trial;
        }
      }
    }
    return null;
  }

  async function analyseDependencies(
    script: UserScript,
    contents: string
  ): Promise<Dependencies> {
    const importPaths = new Set<string>();
    const dependencies: Dependencies = {};
    await esbuild.build({
      stdin: {
        contents,
        loader: script.lang === "ts" ? "ts" : "js",
      },
      bundle: true,
      platform: "node",
      outfile: path.resolve(tmpdir(), "script-plus-esbuild-temp.js"),
      plugins: [
        {
          name: "dependency-analyser-plugin",
          setup(build) {
            build.onResolve({ filter: /.*/ }, ({ path }) => {
              if (!builtinModules.includes(path)) {
                importPaths.add(path);
              }
              return {
                external: true,
              };
            });
          },
        },
      ],
    });
    const notResolvedPackages = (
      await Promise.all(
        [...importPaths].map(async (importPath) => {
          if (importPath === "vscode") {
            return;
          }
          const installedVersion = await findInstalledVersionFor(importPath);
          if (!installedVersion) {
            dependencies[importPath] = "latest";
            return importPath;
          }
          const { name, version } = installedVersion;
          dependencies[name] = version.format();
        })
      )
    ).filter(isString);
    if (notResolvedPackages.length) {
      const dependencies = notResolvedPackages
        .map((pkg) => `"${pkg}"`)
        .join(" ");
      vscode.window.showWarningMessage(
        intl("script.export.dependencies.unresolved", { dependencies })
      );
    }
    return dependencies;
  }

  async function getScriptContent(script: UserScript) {
    const content = await readFile(getScriptAbsolutePath(script));
    return content;
  }
  function getRequirePaths(): string[] {
    return [
      basedOnScripts(paths.nodeModules).fsPath,
      globalDirectories.yarn.packages,
      globalDirectories.npm.packages,
    ];
  }

  function initExecutionContext(taskId: string) {
    const exports = {};
    const tryResolve = (packagePath: string, moduelId: string) => {
      try {
        return require.resolve(moduelId, { paths: [packagePath] });
      } catch (error) {
        return null;
      }
    };
    const task = activeTasks.get(taskId)!;
    const customRequire = (moduleId: string): unknown => {
      if (moduleId === "vscode") return vscode;
      for (const packagesPath of getRequirePaths()) {
        const resolved = tryResolve(packagesPath, moduleId);
        if (resolved != null) {
          task.reqiredPaths.push(resolved);
          return require.call(undefined, resolved);
        }
      }
      return invalidUsage(intl("module.notFound", { moduleId }));
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
                return impossible(
                  intl("script.execute.consoleMethodHasToBeFunction", {
                    methodName,
                  })
                );
              }
              const logs = args.map(getDisplay);
              eventHub.dispatcher.emit("task", {
                type: "output",
                output: {
                  level: methodName,
                  payload: logs,
                },
                taskId,
              });
              for (const logItem of logs) {
                userConsole.append(logItem + " ");
              }
              userConsole.appendLine("");
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
    const transformed = await transform.transform(rawContent, script.lang);
    const vmScript = new vm.Script(transformed.code, {
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
      return invalidUsage(
        intl("script.execute.invalid.script.format", {
          scriptName: script.name,
        })
      );
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
        return invalidUsage(intl("script.execute.invalid.script.returnValue"));
      }
      if (!task.cleanUp) {
        activeTasks.delete(taskId);
      }
      eventHub.dispatcher.emit("task", {
        taskId,
        type: "terminate",
        result: trueResult,
        hasCleanUp: !!task.cleanUp,
      });
    }
  }
  async function cleanUpTaskResource(taskId: string) {
    const task = activeTasks.get(taskId);
    if (!task) {
      return invalidUsage(
        intl("script.execute.task.invalid.notFound", { taskId })
      );
    }
    if (task.running) {
      return invalidUsage(
        intl("script.execute.task.invalid.running", { taskId })
      );
    }
    await task.cleanUp?.();
    for (const requiredPath of task.reqiredPaths) {
      // Delete module cache for pure context.
      // When running a new script, the module should be reloaded.
      delete require.cache[requiredPath];
    }
    activeTasks.delete(taskId);
  }

  const scriptService: ScriptService = {
    dispose() {
      activeTasks.forEach((task) => {
        task.cleanUp?.();
      });
    },
    async create(script) {
      const validateMessage = isValidScriptName(script.name);
      if (validateMessage) {
        return invalidUsage(validateMessage);
      }
      if (!isUserScript(script)) {
        return impossible(intl("script.invalid.scriptObject"));
      }
      await installScript({
        meta: script,
        content: script.lang === "js" ? getJsTemplate() : getTsTemplate(),
        dependencies: {},
      });
      emitScriptListUpdate();
    },
    async delete(script, directly?) {
      const scriptHost = basedOnScripts(script.name);
      if (!directly) {
        const result = await askYesNoQuestion(
          intl("script.delete.confirm", { scriptName: script.name })
        );
        if (!result) {
          return;
        }
      }
      if (!(await existDir(scriptHost))) {
        return invalidUsage(
          intl("script.delete.notFound", { scriptName: script.name })
        );
      }
      await vscode.workspace.fs.delete(scriptHost, {
        useTrash: false,
        recursive: true,
      });
      vscode.window.showInformationMessage(
        intl("script.delete.done", { scriptName: script.name })
      );
      emitScriptListUpdate();
    },
    async getList() {
      const base = basedOnScripts();
      const metas = await glob(`*/${paths.meta}`, {
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
        return impossible(intl("script.invalid.scriptObject"));
      }
      await Promise.all([writeDeclaration(script), writeMeta(script)]);
    },
    async editScript(script) {
      await openEdit(getScriptAbsolutePath(script));
    },
    async import() {
      const spps = await vscode.window.showOpenDialog({
        title: intl("script.import.title"),
        filters: scriptBundleFilter,
        canSelectFiles: true,
        canSelectFolders: false,
      });
      if (spps) {
        await Promise.all(
          spps.map(async (spp) => {
            try {
              const bundle = await loadObjectFromFile(spp);
              if (!isScriptPlusBundle(bundle)) {
                return invalidUsage(
                  intl("script.import.invalid.bundle", { fileName: spp.fsPath })
                );
              }
              await installScript(bundle);
            } catch (error) {
              const message = getErrorMessage(error);
              vscode.window.showWarningMessage(message);
              return;
            }
          })
        );
      }
    },
    async export(script) {
      const askLocation = await vscode.window.showSaveDialog({
        title: intl("script.export.title", { scriptName: script.name }),
        filters: scriptBundleFilter,
        defaultUri: vscode.Uri.joinPath(
          vscode.Uri.file(homedir()),
          `${script.name}.${names.extension}`
        ),
      });
      if (askLocation) {
        const content = await getScriptContent(script);
        const bundle: ScriptPlusBundle = {
          meta: script,
          content,
          dependencies: await analyseDependencies(script, content),
        };
        await dumpObjectToFile(askLocation, bundle);
      }
    },
    async execute(script, params) {
      await updateGlobalState({ lastExecutedScript: script.name });
      let taskId = randomString(8);
      while (activeTasks.has(taskId)) {
        taskId = randomString(8);
      }
      const executionTask: LocalExecutionTask = {
        taskId,
        taskName: script.name,
        startTime: new Date().toLocaleString(),
        running: false,
        mount: false,
        promise: Promise.resolve({}),
        reqiredPaths: [],
      };
      activeTasks.set(taskId, executionTask);
      const promise = runScript(script, params, taskId);
      executionTask.running = true;
      executionTask.promise = promise;
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
        const task = await scriptService.execute(meta, defaults);
        const { taskId } = task;
        const { promise } = activeTasks.get(taskId)!;
        promise.then(async (result) => {
          if (isCleanUp(result) || isScriptRunResultObject(result)) {
            const userSayYes = await askYesNoQuestion(
              intl("script.executeCurrent.cleanUpNow.promote", task),
              false
            );
            if (userSayYes) {
              await cleanUpTaskResource(taskId);
            } else {
              scriptService.mountTask(taskId);
            }
          }
        });
      }
    },
    async getTasks() {
      return [...activeTasks.values()].map((localTask) => ({
        taskId: localTask.taskId,
        taskName: localTask.taskName,
        startTime: localTask.startTime,
      }));
    },
    async getLastExecutedScriptName() {
      return getGlobalStates().lastExecutedScript;
    },
    async mountTask(taskId) {
      const task = activeTasks.get(taskId);
      if (task) {
        task.mount = true;
      }
    },
    async cleanUp(taskId) {
      await cleanUpTaskResource(taskId);
    },
    async cleanUpAll(config = { includeMounted: false }) {
      try {
        await Promise.all(
          [...activeTasks.entries()].map(([taskId, task]) =>
            config.includeMounted || !task.mount
              ? cleanUpTaskResource(taskId)
              : Promise.resolve()
          )
        );
      } catch (error) {
        // do nothing
      }
    },
    validateScriptNamePattern(name) {
      return isValidScriptName(name);
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
                      : impossible(
                          intl("script.create.code.generate.unexpectedEnumType")
                        )
                  )
                )
              )
            : impossible(
                intl("script.create.code.generate.unexpectedArgumentType")
              )
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