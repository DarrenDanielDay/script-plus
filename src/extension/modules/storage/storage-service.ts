import { isObject } from "taio/build/utils/validator/object";
import { isString } from "taio/build/utils/validator/primitive";
import { defineValidator, optional } from "taio/build/utils/validator/utils";
import * as vscode from "vscode";
import { namespaces, paths } from "../constant";

export interface ScriptPlusGlobalStates {
  lastExecutedScript: string;
}

const isScriptPlusGlobalStates = defineValidator<
  Partial<ScriptPlusGlobalStates>
>(
  isObject({
    lastExecutedScript: optional(isString),
  })
);

export interface StorageService {
  basedOnScripts(...fragments: string[]): vscode.Uri;
  getGlobalStates(): Partial<ScriptPlusGlobalStates>;
  updateGlobalState(patch: Partial<ScriptPlusGlobalStates>): Promise<void>;
}

export const createStorageService = (
  context: vscode.ExtensionContext
): StorageService => {
  const storageService: StorageService = {
    basedOnScripts(...fragments) {
      return vscode.Uri.joinPath(
        context.globalStorageUri,
        paths.userScripts,
        ...fragments
      );
    },
    getGlobalStates() {
      const globalState = context.globalState.get(namespaces.globalStates);
      return isScriptPlusGlobalStates(globalState) ? globalState : {};
    },
    async updateGlobalState(patch) {
      await context.globalState.update(
        namespaces.globalStates,
        Object.assign(storageService.getGlobalStates(), patch)
      );
    },
  };
  return storageService;
};
