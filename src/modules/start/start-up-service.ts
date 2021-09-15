import env from "@esbuild-env";
import semver from "semver";
import { isString, isUndefined } from "taio/build/utils/validator/primitive";
import * as vscode from "vscode";
import { intl } from "../../i18n/core/locale";
import type {
  ConfigService,
  PackageService,
  StartUpService,
} from "../../types/public-api";
import { paths } from "../constant";
import { parsePackageJson } from "../node-utils";
import type { PackageInstallTaskService } from "../package/package-service";
import type { StorageService } from "../storage/storage-service";
import {
  askYesNoQuestion,
  existFile,
  output,
  promoteReinstall,
  readFile,
  writeFile,
} from "../vscode-utils";

export function createStartUpService(
  context: vscode.ExtensionContext,
  pkg: PackageService,
  storage: StorageService,
  config: ConfigService,
  installTask: PackageInstallTaskService
): StartUpService {
  const { installModules } = pkg;
  const { basedOnScripts } = storage;
  const { getConfigs, updateConfigs } = config;
  const startUpService: StartUpService = {
    async checkAll(force) {
      await startUpService.checkExtensionDependencies(force);
      if (!force) {
        const {
          startUp: { autoCheck },
        } = await getConfigs();
        if (!autoCheck) {
          return;
        }
      }
      return vscode.window.withProgress(
        {
          cancellable: true,
          location: vscode.ProgressLocation.Notification,
          title: intl("script.check.progress.title"),
        },
        (report, token) => {
          return new Promise<void>(async (resolve, reject) => {
            token.onCancellationRequested(() => {
              currentId &&
                installTask.killTask(
                  currentId,
                  intl("script.check.cancel.message")
                );
              askYesNoQuestion(
                intl("script.check.cancel.doNotCheckAgain"),
                false
              ).then((yes) => {
                yes && updateConfigs({ startUp: { autoCheck: false } });
              });
              reject();
            });
            let currentId = "";
            report.report({
              message: intl("script.check.progress.checkingStorageFolder"),
            });
            await startUpService.checkFolder();
            if (token.isCancellationRequested) {
              return;
            }
            report.report({
              message: intl("script.check.progress.checkingVersions"),
            });
            currentId = await startUpService.checkVSCodeAndNodeJS();
            installTask.waitForResult(currentId).then(() => resolve());
          });
        }
      );
    },
    async checkExtensionDependencies(force) {
      if (!force) {
        const {
          startUp: { checkExtensionDependencies },
        } = await getConfigs();
        if (!checkExtensionDependencies) {
          return;
        }
      }
      await updateConfigs({ startUp: { checkExtensionDependencies: false } });
      const extensionPackageJson = parsePackageJson(
        await readFile(
          vscode.Uri.joinPath(context.extensionUri, paths.packageJson)
        )
      );
      if (!extensionPackageJson) {
        return promoteReinstall();
      }
      try {
        const moduleIds = await Promise.all(
          Object.keys(extensionPackageJson.dependencies ?? {}).map(
            async (moduleId) => {
              const uri = vscode.Uri.joinPath(
                context.extensionUri,
                paths.nodeModules,
                moduleId,
                paths.packageJson
              );
              const text = await readFile(uri);
              const dependencyJson = parsePackageJson(text);
              if (!dependencyJson) {
                output.appendLine(
                  intl("script.logging.invalidPackageJson", {
                    fileName: uri.fsPath,
                  })
                );
                return undefined;
              }
              const version = new semver.SemVer(dependencyJson.version);
              return `${dependencyJson.name}@${version.major}.${version.minor}.${version.patch}`;
            }
          )
        );
        if (moduleIds.some(isUndefined)) {
          return promoteReinstall();
        }
        const dependenciesInstallTaskId = await installModules(
          moduleIds.filter(isString),
          { cwd: context.extensionUri.fsPath },
          undefined
        );
        await installTask.waitForResult(dependenciesInstallTaskId);
      } catch (error) {
        return promoteReinstall();
      }
    },
    async checkFolder() {
      await vscode.workspace.fs.createDirectory(basedOnScripts());
      const packageJsonFile = basedOnScripts(paths.packageJson);
      if (!(await existFile(packageJsonFile))) {
        output.appendLine(intl("script.logging.createPackageJson"));
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
    },
    async checkVSCodeAndNodeJS() {
      const version = new semver.SemVer(vscode.version);
      return installModules(
        [
          `@types/vscode@${version.major}.${version.minor}`,
          `@types/node@latest`,
        ],
        {
          cwd: basedOnScripts().fsPath,
          global: false,
        },
        "@types/vscode @types/node"
      );
    },
  };
  return startUpService;
}
