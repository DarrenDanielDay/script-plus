import { promisify } from "util";
import G from "glob";
import * as path from "path";
import * as fs from "fs";
import * as R from "ramda";
import * as child_process from "child_process";
import { platform } from "os";
import { isBoolean, isString } from "taio/build/utils/validator/primitive";
import { defineValidator, optional } from "taio/build/utils/validator/utils";
import { isObject } from "taio/build/utils/validator/object";

export const glob = promisify(G);
export { fs, path };
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
const yarn = platform() === "win32" ? "yarn.cmd" : "yarn";
const npm = platform() === "win32" ? "npm.cmd" : "npm";
export interface InstallConfig {
  cwd: string;
  global?: boolean;
}
export const isInstallConfig = defineValidator<InstallConfig>(
  isObject({
    cwd: isString,
    global: optional(isBoolean),
  })
);

export type Installer = (
  moduleIds: string[],
  config: InstallConfig
) => child_process.PromiseWithChild<{
  stdout: string;
  stderr: string;
}>;

export const yarnAddPackages: Installer = (
  moduleIds: string[],
  config: InstallConfig
) =>
  execFile(
    yarn,
    [config.global && "global", "add", ...moduleIds].filter(isString),
    {
      cwd: config.cwd,
    }
  );

export const npmInstallPackages: Installer = (
  moduleIds: string[],
  config: InstallConfig
) =>
  execFile(
    npm,
    ["install", config.global && "-g", ...moduleIds].filter(isString),
    {
      cwd: config.cwd,
    }
  );

export const detectYarn = () => execFile(yarn, ["-v"]).then(R.T).catch(R.F);

export const detectNpm = () => execFile(npm, ["-v"]).then(R.T).catch(R.F);
