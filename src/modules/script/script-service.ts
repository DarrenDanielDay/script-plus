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
import { names, paths } from "../constant";
import {
  existDir,
  existFile,
  fsextra,
  glob,
  installPackage,
  path,
  randomString,
} from "../node-utils";
import esbuild from "esbuild";
import ts from "typescript";
import vm from "vm";
import { createRequire } from "module";
import packageJson from "package-json";
import { die } from "taio/build/utils/internal/exceptions";
import { enumValues } from "taio/build/utils/enum";
import { isNumber, isString } from "taio/build/utils/validator/primitive";
import { typed } from "taio/build/utils/typed-function";
import { ExecutionTask, isLogLevel } from "../../models/execution-task";
import { defineValidator } from "taio/build/utils/validator/utils";
import { isObject } from "taio/build/utils/validator/object";
import type { AnyFunc } from "taio/build/types/concepts";
import type { IEventHubAdapter } from "../../events/event-manager";
import { globalErrorHandler, openEdit, output } from "../vscode-utils";
import globalDirectories from "global-dirs";
import { SemVer } from "semver";

const f = ts.factory;
interface ScriptModule {
  main: (config: PassedParameter) => Promise<void> | void;
}

interface LocalExecutionTask extends ExecutionTask {
  promise: Promise<unknown>;
  running: boolean;
}

const isScriptModule = defineValidator<ScriptModule>(
  isObject({
    main: (fn): fn is AnyFunc => typeof fn === "function" && fn.length === 1,
  })
);

export function createScriptService(
  context: vscode.ExtensionContext,
  eventHub: IEventHubAdapter<CoreEvents>
): ScriptService {
  const activeTasks = new Map<string, LocalExecutionTask>();
  function basedOnExtension(...fragments: string[]) {
    return path.resolve(context.extensionPath, ...fragments);
  }
  function basedOnScripts(...fragments: string[]) {
    return basedOnExtension(paths.userScripts, ...fragments);
  }
  function isValidScriptName(name: string) {
    const special = new Set([..."~`!@#$%^&*()_+={}|[]\\:;\"'<>?,./"]);
    return ![...name].some((char) => special.has(char));
  }
  function getScriptFileName(script: UserScript): string {
    return `${paths.mainScript}.${script.lang}`;
  }
  function getScriptAbsolutePath(script: UserScript): string {
    return basedOnScripts(script.name, getScriptFileName(script));
  }

  async function getMeta(folder: string): Promise<UserScript> {
    const content: unknown = await fsextra.readJSON(
      path.join(folder, paths.meta)
    );
    if (!isUserScript(content)) {
      return die("Invalid meta file");
    }
    return content;
  }

  function writeMeta(script: UserScript): Promise<void> {
    return fsextra.writeJSON(basedOnScripts(script.name, paths.meta), script, {
      spaces: 2,
    });
  }

  function writeDeclaration(script: UserScript): Promise<void> {
    return fsextra.writeFile(
      basedOnScripts(script.name, paths.declaration),
      `// This file is generated by the extension.
// NEVER MODIFY IT!

${getConfigTsDeclCodeOfUserScript(script)}`
    );
  }

  async function getScriptContent(script: UserScript) {
    const content = await fsextra.promises.readFile(
      getScriptAbsolutePath(script)
    );
    return content.toString("utf-8");
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
        globalYarnRequire,
        globalNpmRequire,
        require,
      ]) {
        const result = tryRequire(nodeRequire, moduleId);
        if (result) return result.module;
      }
      return die(
        `Cannot find module "${moduleId}", have you installed it as global module?`
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
    const { context, exports } = initExecutionContext(taskId);
    const scriptModule = await createScriptModule(script, context, exports);
    const promise = scriptModule.main(args);
    await promise;
  }

  const scriptService: ScriptService = {
    async check() {
      await fsextra.ensureDir(basedOnScripts());
      const packageJsonFile = basedOnScripts(paths.packageJson);
      if (!(await existFile(packageJsonFile))) {
        await fsextra.writeJSON(
          packageJsonFile,
          {
            name: "user-scripts",
            version: "0.0.0",
            description: "Script folder for vscode plugin `Script Plus`.",
            license: "MIT",
          },
          { spaces: 2, encoding: "utf-8" }
        );
      }
    },
    async create(script) {
      if (!isValidScriptName(script.name)) {
        return die(`Invalid script name!`);
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
      await fsextra.ensureDir(scriptHome);
      await Promise.all([
        writeMeta(script),
        writeDeclaration(script),
        fsextra.writeFile(
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
      fsextra.rmSync(scriptHost, { force: true, recursive: true });
      vscode.window.showInformationMessage(`Script ${script.name} Removed.`);
    },
    async getList() {
      const base = basedOnScripts();
      const metas = await glob(`**/${paths.meta}`, {
        cwd: base,
      });
      const jsons = await Promise.all(
        metas.map((meta) => fsextra.readJSON(path.resolve(base, meta)))
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
          const task = activeTasks.get(taskId);
          if (task?.running) {
            task.running = false;
            eventHub.dispatcher.emit("task", {
              taskId,
              type: "terminate",
            });
            activeTasks.delete(taskId);
          }
        })
        .catch((e) => {
          globalErrorHandler(e);
        });
      return executionTask;
    },
    async executeCurrent() {
      const currentFile = vscode.window.activeTextEditor?.document.fileName;
      if (currentFile) {
        const folder = path.resolve(currentFile, "..");
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
    async listVersions(moduleId) {
      try {
        const packageMeta = await packageJson(moduleId, { allVersions: true });
        return [
          ...Object.keys(packageMeta.versions)
            .map((version) => new SemVer(version, { includePrerelease: true }))
            .filter((version) => !version.prerelease.length)
            .reduce((set, semver) => {
              set.add(semver.format());
              return set;
            }, new Set<string>())
            .keys(),
        ]
          .sort()
          .reverse();
      } catch (error) {
        if (error instanceof packageJson.PackageNotFoundError) {
          return [];
        } else {
          throw error;
        }
      }
    },
    async installPackage(script, version, options) {
      const { stdout, stderr } = await installPackage(
        `${script}${version ? `@${version}` : ""}`,
        {
          cwd: basedOnScripts(),
          global: options?.global,
        }
      );
      output.appendLine(`${"=".repeat(10)}install stdout${"=".repeat(10)}`);
      output.appendLine(stdout);
      output.appendLine(`${"=".repeat(10)}install stderr${"=".repeat(10)}`);
      output.appendLine(stderr);
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
  const importVscodeNode = f.createImportDeclaration(
    [],
    [],
    f.createImportClause(
      false,
      undefined,
      f.createNamespaceImport(f.createIdentifier("vscode"))
    ),
    f.createStringLiteral("vscode")
  );
  const mainFunctionNode = f.createFunctionDeclaration(
    /** decorators */ undefined,
    /** modifiers */ [
      f.createModifier(ts.SyntaxKind.ExportKeyword),
      f.createModifier(ts.SyntaxKind.AsyncKeyword),
    ],
    /** asterisk(*) */ undefined,
    /** name */ names.entry,
    /** type parameters <T> */ [],
    /** parameters */ [
      f.createParameterDeclaration(
        /** decorators */ [],
        /** modifiers */ [],
        /** ... */ undefined,
        /** name */ names.param,
        /** ? */ undefined,
        /** type */ f.createImportTypeNode(
          /** import(xxx) */ f.createLiteralTypeNode(
            f.createStringLiteral(`./${paths.declarationBase}`)
          ),
          /** .yyy */ f.createIdentifier(names.configName)
        )
      ),
    ],
    /** return type */ f.createTypeReferenceNode("Promise", [
      f.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
    ]),
    /** function body */ f.createBlock([
      f.createExpressionStatement(
        f.createCallExpression(
          f.createPropertyAccessExpression(
            f.createPropertyAccessExpression(
              f.createIdentifier("vscode"),
              "window"
            ),
            "showInformationMessage"
          ),
          [],
          [f.createStringLiteral("Hello, Script Plus!")]
        )
      ),
    ])
  );
  return `${getTextOfTsAstNode(importVscodeNode)}
${getTextOfTsAstNode(mainFunctionNode)}`;
}
vscode.window.showInformationMessage;
function getJsTemplate() {
  return `export async function main() {}`;
}
