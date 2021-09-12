import env from "@esbuild-env";
import type { Func } from "taio/build/types/concepts";
import { globalErrorHandler } from "../modules/vscode-utils";
import { startUp } from "../start/start-up";

export function handlerFactory(handler: Func<[], unknown>, silent?: boolean) {
  return async () => {
    const pendings = [startUp.ready];
    if (env.ENV === "dev") {
      pendings.push((await import("../start/dev")).devServer.ready);
    }
    await Promise.all(pendings);
    try {
      return await handler();
    } catch (error) {
      if (!silent) {
        globalErrorHandler(error);
      }
    }
  };
}
