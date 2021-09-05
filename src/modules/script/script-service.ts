import type { CoreEvents, ScriptService } from "../../app/message-protocol";
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
} from "../../models/script";
import * as vscode from "vscode";
import { names, paths, scriptBundleFilter } from "../constant";
import {
  glob,
  yarnAddPackages,
  path,
  randomString,
  detectYarn,
  detectNpm,
  npmInstallPackages,
  InstallConfig,
  Installer,
} from "../node-utils";
import esbuild from "esbuild";
import ts from "typescript";
import vm from "vm";
import { tmpdir, homedir } from "os";
import { builtinModules } from "module";
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
  isScriptRunResult,
  isScriptRunResultObject,
} from "../../models/execution-task";
import { defineValidator } from "taio/build/utils/validator/utils";
import { isObject } from "taio/build/utils/validator/object";
import type { AnyFunc } from "taio/build/types/concepts";
import type { IEventHubAdapter } from "../../events/event-manager";
import {
  askYesNoQuestion,
  divider,
  dumpObjectToFile,
  existDir,
  existFile,
  getConfigs,
  globalErrorHandler,
  loadObjectFromFile,
  openEdit,
  output,
  readFile,
  writeFile,
} from "../vscode-utils";
import globalDirectories from "global-dirs";
import * as semver from "semver";
import type { CleanUp, ScriptRunResult } from "../../templates/api";
import env from "@esbuild-env";
import { noop } from "taio/build/utils/typed-function";
import { PackageManager } from "../../models/configurations";
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
  async function determinePackageManager(): Promise<Installer> {
    return die("No package manager can be found.");
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
    vscode.workspace.getConfiguration();
    const version = new semver.SemVer(vscode.version);
    const detectedPackageManagers = await Promise.all([
      detectYarn().then((ok) => [ok, yarnAddPackages] as const),
      detectNpm().then((ok) => [ok, npmInstallPackages] as const),
    ]);
    const manager = detectedPackageManagers.find(([ok]) => ok)?.[1];
    if (!manager) {
      return die(
        "No package manager detected. You need to install `npm` or `yarn` for this extension."
      );
    }
    const { stdout, stderr } = await manager(
      [`@types/vscode@${version.major}.${version.minor}`],
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
    return [...name].some((char) => special.has(char))
      ? `Script name should not include the following symbols and white spaces (kebab-case is recommended):
    ~\`!@#$%^&*()_+={}|[]\\:;\"\'<>?,./`
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

  function logInstallPackage(
    packageName: string,
    stdout: string,
    stderr: string
  ) {
    divider(`install ${packageName}`);
    divider("stdout");
    output.appendLine(stdout);
    divider("stderr");
    output.appendLine(stderr);
    output.show();
  }

  async function installScript(bundle: ScriptPlusBundle) {
    const { content, meta, dependencies } = bundle;
    const scriptHome = basedOnScripts(meta.name);
    if (await existDir(scriptHome)) {
      const message = `Script "${meta.name}" already exists, use another name?`;
      if (await askYesNoQuestion(message)) {
        const newName = await vscode.window.showInputBox({
          prompt: `Input a new script name instead of "${meta.name}"`,
          value: meta.name,
          async validateInput(value) {
            return isValidScriptName(value) ||
              (await scriptService.getList()).some(
                (script) => script.name === value
              )
              ? `Script "${value}" already exists`
              : "";
          },
        });
        if (newName) {
          meta.name = newName;
        } else {
          vscode.window.showInformationMessage(
            `Install script "${meta.name}" aborted.`
          );
          return;
        }
      } else {
        return;
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
            `Script "${meta.name}" has the following dependencies:
${packages.join("\n")}
Do you want to install them?`
          );
          if (userSayYes) {
            const { stderr, stdout } = await yarnAddPackages(packages, {
              cwd: basedOnScripts().fsPath,
            });
            logInstallPackage(
              `dependencies of script "${meta.name}"`,
              stdout,
              stderr
            );
          }
        }
      })(),
    ]);
  }

  async function findInstalledVersionFor(importPath: string) {
    const tryFindWith = async (
      packageJsonFolderUri: vscode.Uri
    ): Promise<{ name: string; version: semver.SemVer } | null> => {
      try {
        const uri = vscode.Uri.joinPath(packageJsonFolderUri, "package.json");
        const content = await readFile(uri);
        const packageJSONContent: unknown = JSON.parse(content);
        if (
          isObject({ version: isString, name: isString })(packageJSONContent) &&
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
        output.appendLine(`Invalid package.json found: ${uri.fsPath}`);
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
      vscode.window.showWarningMessage(
        `Versions for the following import path can not be resolved, marked as "latest": ${notResolvedPackages
          .map((pkg) => `"${pkg}"`)
          .join(",")}`
      );
    }
    return dependencies;
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

  function getRequirePaths(): string[] {
    return [
      basedOnScripts("node_modules").fsPath,
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
          return require.call(undefined, moduleId);
        }
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
    for (const requiredPath of task.reqiredPaths) {
      // Delete module cache for pure context.
      // When running a new script, the module should be reloaded.
      delete require.cache[requiredPath];
    }
    activeTasks.delete(taskId);
  }

  async function installModules(moduleIds: string[], configs: InstallConfig) {
    const config = getConfigs();
    const hasNpm = await detectNpm();
    const hasYarn = await detectYarn();
    if (config.node.packageManager === PackageManager.npm) {
      if (!hasNpm) {
        return die("Cannot find npm. Installation aborted.");
      }
      return npmInstallPackages(moduleIds, configs);
    }
    if (!hasYarn) {
      if (hasNpm) {
        const userSayYes = await askYesNoQuestion(
          "Yarn is not detected. Use npm instead?"
        );
        if (userSayYes) {
          return npmInstallPackages(moduleIds, configs);
        }
      }
      return die("Cannot find yarn. Installation aborted.");
    }
    return yarnAddPackages(moduleIds, configs);
  }

  const scriptService: ScriptService = {
    dispose() {
      activeTasks.forEach((task) => {
        task.cleanUp?.();
      });
    },
    async check(force) {
      await scriptFolderCheck();
      await vscodeVersionCheck();
    },
    async create(script) {
      const validateMessage = isValidScriptName(script.name);
      if (validateMessage) {
        return die(validateMessage);
      }
      if (!isUserScript(script)) {
        vscode.window.showInformationMessage(`Invalid script object!`);
        return;
      }
      await installScript({
        meta: script,
        content: script.lang === "js" ? getJsTemplate() : getTsTemplate(),
        dependencies: {},
      });
    },
    async delete(script) {
      const scriptHost = basedOnScripts(script.name);
      if (!(await existDir(scriptHost))) {
        return die(`Script "${script.name}" not found!`);
      }
      await vscode.workspace.fs.delete(scriptHost, {
        useTrash: false,
        recursive: true,
      });
      vscode.window.showInformationMessage(`Script "${script.name}" Removed.`);
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
    async import() {
      const spps = await vscode.window.showOpenDialog({
        title: "Import script",
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
                return die();
              }
              await installScript(bundle);
            } catch (error) {
              vscode.window.showWarningMessage(
                `File "${spp.fsPath}" is not a valid script plus bundle`
              );
              return;
            }
          })
        );
      }
    },
    async export(script) {
      const askLocation = await vscode.window.showSaveDialog({
        title: `Export script "${script.name}"`,
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
      let taskId = randomString(8);
      while (activeTasks.has(taskId)) {
        taskId = randomString(8);
      }
      const executionTask: LocalExecutionTask = {
        taskId,
        taskName: script.name,
        startTime: new Date().toLocaleString(),
        running: false,
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
        const { taskId, taskName } = await scriptService.execute(
          meta,
          defaults
        );
        const { promise } = activeTasks.get(taskId)!;
        promise.then(async (result) => {
          if (isCleanUp(result) || isScriptRunResultObject(result)) {
            const userSayYes = await askYesNoQuestion(
              `Do you want to clean up side effect of task "${taskName}" (taskId=${taskId}) now?`,
              false
            );
            if (userSayYes) {
              await cleanUpTaskResource(taskId);
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
    async cleanUp(taskId) {
      await cleanUpTaskResource(taskId);
    },
    cleanUpAll() {
      return Promise.all(
        [...activeTasks.keys()].map((taskId) => cleanUpTaskResource(taskId))
      )
        .then(noop)
        .catch(noop);
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
      const { stdout, stderr } = await installModules(
        [`${packageName}${version ? `@${version}` : "@latest"}`],
        {
          cwd: basedOnScripts().fsPath,
          global: options?.global,
        }
      );
      logInstallPackage(packageName, stdout, stderr);
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
