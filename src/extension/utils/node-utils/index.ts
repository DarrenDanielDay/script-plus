import { promisify } from "util";
import G from "glob";
import * as path from "path";
import * as R from "ramda";
import * as child_process from "child_process";
import { platform } from "os";
import { isBoolean, isString } from "taio/build/utils/validator/primitive";
import {
  defineValidator,
  optional,
  record,
} from "taio/build/utils/validator/utils";
import { isObject } from "taio/build/utils/validator/object";
import { PackageManagerKind } from "../../../models/configurations";

export const glob = promisify(G);
export { path };
const uppers = R.map(
  R.pipe(R.add("A".charCodeAt(0)), String.fromCharCode),
  R.range(0, 26)
);
const lowers = R.map(R.toLower, uppers);
const chars = R.concat(uppers, lowers);
const indexBy = R.curryN(2, (chars: string[], index: number) => chars[index]!);
export const randomString = R.pipe(
  R.range(0),
  R.map(
    R.pipe(
      Math.random,
      R.multiply,
      R.applyTo(chars.length),
      Math.floor,
      indexBy(chars)
    )
  ),
  R.join("")
);
export const execFile = promisify(child_process.execFile);
export interface AddPackageConfig {
  cwd: string;
  global?: boolean;
}

export const isInstallConfig = defineValidator<AddPackageConfig>(
  isObject({
    cwd: isString,
    global: optional(isBoolean),
  })
);

export interface ProcessOutput {
  stdout: string;
  stderr: string;
}

export interface DependencyInstallConfig {
  production?: boolean;
  useLock?: boolean;
  cwd: string;
}

export interface PackageManager {
  readonly type: PackageManagerKind;
  addPackage(
    moduleIds: string[],
    config: AddPackageConfig
  ): child_process.PromiseWithChild<ProcessOutput>;
  detect(): Promise<boolean>;
  install(
    config: DependencyInstallConfig
  ): child_process.PromiseWithChild<ProcessOutput>;
}

export const yarn = ((): PackageManager => {
  const yarnExecutable = platform() === "win32" ? "yarn.cmd" : "yarn";
  return {
    get type() {
      return PackageManagerKind.yarn;
    },
    addPackage(moduleIds, config) {
      return execFile(
        yarnExecutable,
        [config.global && "global", "add", ...moduleIds].filter(isString),
        {
          cwd: config.cwd,
        }
      );
    },
    async detect() {
      try {
        await execFile(yarnExecutable, ["-v"]);
        return true;
      } catch {
        return false;
      }
    },
    install({ production, useLock, cwd }) {
      return execFile(
        yarnExecutable,
        ["install", production && "--prod", !useLock && "--no-lockfile"].filter(
          isString
        ),
        { cwd }
      );
    },
  };
})();

export const npm = ((): PackageManager => {
  const npmExecutable = platform() === "win32" ? "npm.cmd" : "npm";
  return {
    get type() {
      return PackageManagerKind.npm;
    },
    addPackage(moduleIds, config) {
      return execFile(
        npmExecutable,
        ["install", config.global && "-g", ...moduleIds].filter(isString),
        {
          cwd: config.cwd,
        }
      );
    },
    async detect() {
      try {
        await execFile(npmExecutable, ["-v"]);
        return true;
      } catch {
        return false;
      }
    },
    install({ production, useLock }) {
      return execFile(
        npmExecutable,
        [
          "install",
          production && "--production",
          !useLock && "--package-lock=false",
        ].filter(isString)
      );
    },
  };
})();

interface ReferencedPackageJsonPart {
  version: string;
  name: string;
  dependencies?: Record<string, string>;
}

const isPackageJson = defineValidator<ReferencedPackageJsonPart>(
  isObject({
    name: isString,
    version: isString,
    dependencies: optional(record(isString)),
  })
);

export function parsePackageJson(
  text: string
): ReferencedPackageJsonPart | undefined {
  try {
    const json: unknown = JSON.parse(text);
    if (isPackageJson(json)) {
      return json;
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
}
