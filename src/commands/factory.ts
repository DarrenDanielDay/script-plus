import type { Func } from "taio/build/types/concepts";
import { globalErrorHandler } from "../modules/vscode-utils";

export function factory(handler: Func<[], unknown>, silent?: boolean) {
  return async () => {
    try {
      return await handler();
    } catch (error) {
      if (!silent) {
        globalErrorHandler(error);
      }
    }
  };
}
