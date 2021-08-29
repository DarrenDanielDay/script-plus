import { promisify } from "util";
import G from "glob";
import * as fsextra from "fs-extra";
import * as path from "path";
import * as fs from "fs";
import type { PathLike } from "fs";
import * as R from "ramda";
import * as child_process from "child_process";
import { platform } from "os";
import { isString } from "taio/build/utils/validator/primitive";
export const existFile = (pathLike: PathLike) =>
  fsextra.promises
    .stat(pathLike)
    .then((stat) => stat.isFile())
    .catch(R.F);

export const existDir = (pathLike: PathLike) =>
  fsextra.promises
    .stat(pathLike)
    .then((stat) => stat.isDirectory())
    .catch(R.F);

export const glob = promisify(G);
export { fs, path, fsextra };
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
export const installPackages = (
  moduleIds: string[],
  config: { cwd: string; global?: boolean }
) =>
  execFile(
    yarn,
    [config.global && "global", "add", ...moduleIds].filter(isString),
    {
      cwd: config.cwd,
    }
  );
