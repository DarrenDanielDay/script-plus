import env from "@esbuild-env";
import type { Normalizer } from "../debug/generator";
import type {
  CommandConfig,
  ExtensionPackageJSON,
} from "../../types/vscode-package-json";
import type { ExtensionPackageNlsJSON } from "../../types/vscode-package-nls-json";
import { clone } from "../utils";
import { Command, CommandList, Commands } from "./names";
import runIcon from "../../../assets/icons/run.svg";
import editIcon from "../../../assets/icons/edit.svg";
import deleteIcon from "../../../assets/icons/delete.svg";
import addIcon from "../../../assets/icons/add.svg";
import refreshIcon from "../../../assets/icons/refresh.svg";
import launchIcon from "../../../assets/icons/launch.svg";

const commandIcons: Partial<Record<Command, CommandConfig["icon"]>> = {
  [Commands.ScriptControl.Create]: {
    dark: addIcon,
    light: addIcon,
  },
  [Commands.ScriptControl.Delete]: {
    dark: deleteIcon,
    light: deleteIcon,
  },
  [Commands.ScriptControl.EditScript]: {
    dark: editIcon,
    light: editIcon,
  },
  [Commands.ScriptControl.Execute]: {
    dark: runIcon,
    light: runIcon,
  },
  [Commands.TreeViewControl.Refresh]: {
    dark: refreshIcon,
    light: refreshIcon,
  },
  [Commands.WebviewControl.Open]: {
    dark: launchIcon,
    light: launchIcon,
  },
};

export const normalizePackageJson: Normalizer<ExtensionPackageJSON> = (
  packageJson
) => {
  const cloned = clone(packageJson);
  cloned.activationEvents = CommandList.map(
    (command) => `onCommand:${command}`
  );
  cloned.contributes ??= {};
  cloned.contributes.commands = CommandList.map((command) => {
    const commandConfig: CommandConfig = {
      command,
      title: `%${command}%`,
    };
    const icon = commandIcons[command];
    if (icon) {
      commandConfig.icon = icon;
    }
    return commandConfig;
  });
  return cloned;
};

export const normalizeNlsJson: Normalizer<ExtensionPackageNlsJSON> = (
  nlsJson
) => {
  const result = clone(nlsJson);
  for (const command of CommandList) {
    if (command in result) {
      continue;
    }
    result[command] = `${env.EXTENSION_NAME}:`;
  }
  return result;
};
