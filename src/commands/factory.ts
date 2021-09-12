import type { Func } from "taio/build/types/concepts";
import { globalErrorHandler } from "../modules/vscode-utils";

let startUpCheckDone: Func<[], void>;
let devConfigDone: Func<[], void>;
const startUpReadyState = new Promise<void>((resolve) => {
  startUpCheckDone = resolve;
});
const devConfigReadyState = new Promise<void>((resolve) => {
  devConfigDone = resolve;
});

export function startUpReady() {
  startUpCheckDone();
}

export function devConfigReady() {
  devConfigDone();
}

export function handlerFactory(handler: Func<[], unknown>, silent?: boolean) {
  return async () => {
    await Promise.all([startUpReadyState, devConfigReadyState]);
    try {
      return await handler();
    } catch (error) {
      if (!silent) {
        globalErrorHandler(error);
      }
    }
  };
}
