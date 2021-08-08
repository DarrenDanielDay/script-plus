import { promisify } from "util";
import G from "glob";
import * as fsextra from "fs-extra";
import * as path from "path";
import type { PathLike } from "fs";
import R, { juxt } from "ramda";

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
export { path, fsextra };
