import * as vscode from "vscode";
import packageJson from "package-json";
import semver from "semver";
import type {
  ConfigService,
  PackageService,
  StorageService,
} from "../../types/public-api";
import { intl } from "../../i18n/core/locale";
import { askYesNoQuestion, divider, output } from "../vscode-utils";
import {
  detectNpm,
  detectYarn,
  InstallConfig,
  Installer,
  npmInstallPackages,
  yarnAddPackages,
} from "../node-utils";
import { PackageManager } from "../../models/configurations";
import { invalidUsage } from "../../errors/invalid-usage";

export function createPackageService(
  storage: StorageService,
  config: ConfigService
): PackageService {
  const { basedOnScripts } = storage;
  const { getConfigs, updateConfigs } = config;
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
  async function installModules(
    moduleIds: string[],
    configs: InstallConfig,
    message?: string
  ) {
    const { stdout, stderr } = await (
      await determinePackageInstaller()
    )(moduleIds, configs);
    logInstallPackage(message ?? moduleIds.join(" "), stdout, stderr);
  }
  return {
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
      await installModules(
        [`${packageName}${version ? `@${version}` : "@latest"}`],
        {
          cwd: basedOnScripts().fsPath,
          global: options?.global,
        }
      );
      vscode.window.showInformationMessage(
        intl("module.install.done.message", { moduleName: packageName })
      );
    },
    installModules,
  };
}
