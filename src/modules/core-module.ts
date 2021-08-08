import * as vscode from "vscode";
import type { CoreAPI } from "../app/message-protocol";
import { createScriptService } from "./script/script-service";

function createCoreAPI(context: vscode.ExtensionContext): CoreAPI {
  const coreApi: CoreAPI = {
    vscode,
    ScriptService: createScriptService(context),
  };
  return coreApi;
}

export { createCoreAPI };
