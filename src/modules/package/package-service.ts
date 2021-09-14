import * as vscode from "vscode";
import packageJson from "package-json";
import semver from "semver";
import type { ConfigService, PackageService } from "../../types/public-api";
import { intl } from "../../i18n/core/locale";
import {
  askYesNoQuestion,
  divider,
  getErrorMessage,
  output,
} from "../vscode-utils";
import {
  detectNpm,
  detectYarn,
  Installer,
  npmInstallPackages,
  ProcessOutput,
  yarnAddPackages,
} from "../node-utils";
import { PackageManager } from "../../models/configurations";
import { invalidUsage } from "../../errors/invalid-usage";
import { createTaskService, TaskService } from "../tasks/task-service";
import type child_process from "child_process";
import { noop } from "taio/build/utils/typed-function";
import type { StorageService } from "../storage/storage-service";

export type PackageInstallTaskService = TaskService<
  Parameters<Installer>,
  child_process.ChildProcess,
  ProcessOutput
>;

export function createPackageService(
  storage: StorageService,
  config: ConfigService
): [PackageService, PackageInstallTaskService] {
  const { basedOnScripts } = storage;
  const { getConfigs, updateConfigs } = config;
  const installTaskService: PackageInstallTaskService = createTaskService(
    async (param, { resolve, reject }) => {
      const promiseWithChild = (await determinePackageInstaller())(...param);
      promiseWithChild.then(resolve).catch(reject);
      return promiseWithChild.child;
    },
    (task) => {
      task.data?.kill();
    }
  );
  function logInstallPackage(
    packageName: string,
    stdout: string,
    stderr: string
  ) {
    divider(intl("script.logging.installModule", { moduleName: packageName }));
    divider("stdout");
    output.appendLine(stdout);
    divider("stderr");
    output.appendLine(stderr);
    output.show();
  }
  async function determinePackageInstaller(): Promise<Installer> {
    const {
      node: { packageManager },
    } = await getConfigs();
    const [hasNpm, hasYarn] = await Promise.all([detectNpm(), detectYarn()]);
    if (packageManager === PackageManager.yarn) {
      if (hasYarn) {
        return yarnAddPackages;
      }
      if (hasNpm) {
        const userSayUseNpm = await askYesNoQuestion(
          intl("node.packageManager.useNpmInstead")
        );
        if (userSayUseNpm) {
          await updateConfigs({ node: { packageManager: PackageManager.npm } });
          return npmInstallPackages;
        }
      }
    }
    if (hasNpm) {
      return npmInstallPackages;
    }
    return invalidUsage(intl("node.packageManager.noManager"));
  }
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
            token.onCancellationRequested(() => {
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
  return [packageService, installTaskService];
}
