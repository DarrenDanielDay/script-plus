import * as vscode from "vscode";
import type { CoreAPI, CoreEvents } from "../app/message-protocol";
import type { IEventHubAdapter } from "../events/event-manager";
import { createConfigService } from "./config/config-service";
import { createScriptService } from "./script/script-service";

function createCoreAPI(
  context: vscode.ExtensionContext,
  eventHub: IEventHubAdapter<CoreEvents>
): CoreAPI {
  const coreApi: CoreAPI = {
    vscode,
    ScriptService: createScriptService(context, eventHub),
    ConfigService: createConfigService(eventHub),
  };
  return coreApi;
}

export { createCoreAPI };
