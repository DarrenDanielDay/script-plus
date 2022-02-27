import * as vscode from "vscode";
import packageJson from "package-json";
import semver from "semver";
import type { ConfigService, PackageService } from "../../../types/public-api";
import { intl } from "../../i18n/core/locale";
import {
  askYesNoQuestion,
  divider,
  getErrorMessage,
  output,
} from "../../utils/vscode-utils";
import {
  npm,
  yarn,
  ProcessOutput,
  PackageManager,
} from "../../utils/node-utils";
import { PackageManagerKind } from "../../../models/configurations";
import { invalidUsage } from "../../errors/invalid-usage";
import { createTaskService, TaskService } from "../tasks/task-service";
import type child_process from "child_process";
import { noop } from "taio/build/utils/typed-function";
import type { StorageService } from "../storage/storage-service";
import env from "@esbuild-env";

export type PackageInstallTaskService = TaskService<
  Parameters<PackageManager["addPackage"]>,
  child_process.ChildProcess,
  ProcessOutput
>;

export type DependencyInstallTaskService = TaskService<
  Parameters<PackageManager["install"]>,
  child_process.ChildProcess,
  ProcessOutput
>;

export const createPackageService = (
  context: vscode.ExtensionContext,
  storage: StorageService,
  config: ConfigService
): [
  PackageService,
  PackageInstallTaskService,
  DependencyInstallTaskService
] => {
  const { basedOnScripts } = storage;
  const { getConfigs, updateConfigs } = config;
  const installTaskService: PackageInstallTaskService = createTaskService(
    async (param, { resolve, reject }) => {
      const promiseWithChild = (await determinePackageInstaller()).addPackage(
        ...param
      );
      promiseWithChild.then(resolve).catch(reject);
      return promiseWithChild.child;
    },
    (task) => {
      task.data?.kill();
    }
  );
  const installDependencyTaskService: DependencyInstallTaskService =
    createTaskService(
      async (param, { resolve, reject }) => {
        const promiseWithChild = (await determinePackageInstaller()).install(
          ...param
        );
        promiseWithChild.then(resolve).catch(reject);
        return promiseWithChild.child;
      },
      (task) => {
        task.data?.kill();
      }
    );
  const logInstallPackage = (
    packageName: string,
    stdout: string,
    stderr: string
  ) => {
    divider(intl("script.logging.installModule", { moduleName: packageName }));
    divider("stdout");
    output.appendLine(stdout);
    divider("stderr");
    output.appendLine(stderr);
    output.show();
  };
  const determinePackageInstaller = async (): Promise<PackageManager> => {
    const {
      node: { packageManager },
    } = await getConfigs();
    const [hasNpm, hasYarn] = await Promise.all([npm.detect(), yarn.detect()]);
    if (packageManager === PackageManagerKind.yarn) {
      if (hasYarn) {
        return yarn;
      }
      if (hasNpm) {
        const userSayUseNpm = await askYesNoQuestion(
          intl("node.packageManager.useNpmInstead")
        );
        if (userSayUseNpm) {
          await updateConfigs({
            node: { packageManager: PackageManagerKind.npm },
          });
          return npm;
        }
      }
    }
    if (hasNpm) {
      return yarn;
    }
    return invalidUsage(intl("node.packageManager.noManager"));
  };
  const packageService: PackageService = {
    async listVersions(moduleId) {
      try {
        const {
          packages: { includePrerelease },
        } = await getConfigs();
        const packageMeta: Partial<packageJson.AbbreviatedMetadata> =
          await packageJson(moduleId, { allVersions: true });
        return [
          ...Object.keys(packageMeta.versions ?? {})
            .map((version) => new semver.SemVer(version, { includePrerelease }))
            .filter(
              (version) => includePrerelease || !version.prerelease.length
            )
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
    async installExtensionDependencies(config) {
      const taskId = await installDependencyTaskService.create([
        { ...config, cwd: context.extensionUri.fsPath },
      ]);
      installDependencyTaskService
        .waitForResult(taskId)
        .then(({ stderr, stdout }) => {
          logInstallPackage(env.EXTENSION_BASE_NAME, stdout, stderr);
        });
      return taskId;
    },
    async installPackage(packageName, version, options) {
      const id = await packageService.installModules(
        [`${packageName}${version ? `@${version}` : "@latest"}`],
        {
          cwd: basedOnScripts().fsPath,
          global: options?.global,
        },
        undefined,
        true
      );
      await installTaskService.waitForResult(id).catch(noop);
    },
    async installModules(moduleIds, configs, message, showLoading = false) {
      const id = await installTaskService.create([moduleIds, configs]);
      const moduleNames = moduleIds.join("\n");
      const promise = installTaskService
        .waitForResult(id)
        .then(({ stdout, stderr }) => {
          logInstallPackage(message ?? moduleNames, stdout, stderr);
          vscode.window.showInformationMessage(
            intl("module.install.done.message", { moduleNames })
          );
        })
        .catch((reason) =>
          vscode.window.showErrorMessage(getErrorMessage(reason))
        );
      if (showLoading) {
        vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, cancellable: true },
          (progress, token) => {
            progress.report({
              message: intl("module.install.installing.message", {
                moduleNames,
              }),
            });
            const disposable = token.onCancellationRequested(() => {
              disposable.dispose();
              installTaskService.killTask(
                id,
                intl("module.install.canceled.message", {
                  moduleNames,
                })
              );
            });
            return promise;
          }
        );
      }
      return id;
    },
  };
  return [packageService, installTaskService, installDependencyTaskService];
};
