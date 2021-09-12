import { spawn } from "child_process";
import { platform } from "os";
import { resolve } from "path";
// TODO: Use same version of snowpack
import {
  startServer,
  loadConfiguration,
} from "../../node_modules/snowpack/lib/index.js";
const yarn = platform() === "win32" ? "yarn.cmd" : "yarn";
const projectRoot = resolve(process.cwd(), "..", "..");
(async () => {
  const config = await loadConfiguration({});
  await startServer({ config });
  const now = new Date();
  const nowString = `${now.toLocaleTimeString()}`;
  process.stdout.write(
    `${nowString} - Starting compilation in watch mode...\n\n`
  );
  process.stdout.write(
    `${nowString} - Found 0 errors. Watching for file changes.\n\n`
  );
  const esbuildProcess = spawn(yarn, ["watch:esbuild"], {
    cwd: projectRoot,
  });
  esbuildProcess.stdout.pipe(process.stdout);
  esbuildProcess.stderr.pipe(process.stderr);
  const extensionTypesProcess = spawn(yarn, ["watch:types"], {
    cwd: projectRoot,
  });
  extensionTypesProcess.stdout.pipe(process.stdout);
  extensionTypesProcess.stderr.pipe(process.stderr);
  const uiTypesWatchProcess = spawn(yarn, ["watch:types"]);
  uiTypesWatchProcess.stdout.pipe(process.stdout);
  uiTypesWatchProcess.stderr.pipe(process.stderr);
})();
