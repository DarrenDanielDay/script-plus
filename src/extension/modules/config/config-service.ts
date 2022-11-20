import * as vscode from "vscode";
import type { ConfigService, CoreEvents } from "../../../types/public-api";
import { isScriptPlusConfig } from "../../configs/user-config";
import { getConfigs, updateConfig } from "../../utils/vscode-utils";
import type { IEventHubAdapter } from "../../events/event-manager";
import { intl } from "../../i18n/core/locale";
import { impossible } from "../../errors/internal-error";
import { inject } from "func-di";
import { configService, eventHub } from "../tokens";

const createConfigService = (
  eventHub: IEventHubAdapter<CoreEvents>
): ConfigService => {
  const disposable = vscode.workspace.onDidChangeConfiguration(() => {
    const nowConfig = getConfigs();
    eventHub.dispatcher.emit("config", { fullConfig: nowConfig });
  });
  return {
    dispose() {
      disposable.dispose();
    },
    async getConfigs() {
      const vscodeConfig = getConfigs();
      const config: unknown = JSON.parse(JSON.stringify(vscodeConfig));
      return isScriptPlusConfig(config)
        ? config
        : impossible(intl("config.check.maybeCrashed"));
    },
    async updateConfigs(patch, scope) {
      await updateConfig(patch, scope && vscode.ConfigurationTarget[scope]);
    },
  };
};

export const configServiceImpl = inject({ eventHub }).implements(
  configService,
  ({ eventHub }) => createConfigService(eventHub)
);
