import type { Func } from "taio/build/types/concepts";
import { globalErrorHandler } from "../modules/vscode-utils";

let done: Func<[], void>;

const readyState = new Promise<void>((resolve) => {
  done = resolve;
});

export function ready() {
  done();
}

export function factory(handler: Func<[], unknown>, silent?: boolean) {
  return async () => {
    await readyState;
    try {
      return await handler();
    } catch (error) {
      if (!silent) {
        globalErrorHandler(error);
      }
    }
  };
}
