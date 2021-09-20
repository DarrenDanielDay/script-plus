import env from "@esbuild-env";
import semver from "semver";
import * as vscode from "vscode";
import { intl } from "../../i18n/core/locale";
import { TransformerKind } from "../../models/configurations";
import type {
  ConfigService,
  PackageService,
  StartUpService,
} from "../../types/public-api";
import { paths } from "../constant";
import type {
  DependencyInstallTaskService,
  PackageInstallTaskService,
} from "../package/package-service";
import type { StorageService } from "../storage/storage-service";
import {
  askYesNoQuestion,
  existFile,
  output,
  writeFile,
} from "../vscode-utils";

export function createStartUpService(
  pkg: PackageService,
  storage: StorageService,
  config: ConfigService,
  installTask: PackageInstallTaskService,
  dependencyTask: DependencyInstallTaskService
): StartUpService {
  const { installModules, installExtensionDependencies } = pkg;
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
          title: intl("startUp.check.progress.title"),
        },
        (report, token) => {
          return new Promise<void>(async (resolve, reject) => {
            token.onCancellationRequested(() => {
              currentId &&
                installTask.killTask(
                  currentId,
                  intl("startUp.check.cancel.message")
                );
              askYesNoQuestion(
                intl("startUp.check.cancel.doNotCheckAgain"),
                false
              ).then((yes) => {
                yes && updateConfigs({ startUp: { autoCheck: false } });
              });
              reject();
            });
            let currentId = "";
            report.report({
              message: intl("startUp.check.progress.checkingStorageFolder"),
            });
            await startUpService.checkFolder();
            if (token.isCancellationRequested) {
              return;
            }
            report.report({
              message: intl("startUp.check.progress.checkingVersions"),
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
      const taskId = await installExtensionDependencies({
        useLock: false,
        production: true,
      });
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: intl("startUp.dependency.install.title"),
          cancellable: true,
        },
        (_, token) =>
          new Promise<void>(async (resolve, reject) => {
            try {
              const disposable = token.onCancellationRequested(() => {
                disposable.dispose();
                dependencyTask
                  .killTask(taskId, intl("startUp.dependency.cancel.problem"))
                  .then(() => {
                    updateConfigs({
                      script: { transformer: TransformerKind.babel },
                    });
                  });
              });
              await dependencyTask.waitForResult(taskId);
              resolve();
            } catch (error) {
              reject(error);
            }
          })
      );
      await updateConfigs({ startUp: { checkExtensionDependencies: false } });
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
