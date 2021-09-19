import { Commands } from "../../commands/names";
import type { Normalizer } from "../../debug/generator";
import type { ExtensionPackageJSON } from "../../types/vscode-package-json";
import { clone } from "../../utils";

export const normalizePackageJson: Normalizer<ExtensionPackageJSON> = (
  packageJson
) => {
  const cloned = clone(packageJson);
  cloned.contributes.menus ??= {};
  cloned.contributes.menus["view/item/context"] = [
    {
      command: Commands.ScriptControl.EditScript,
      group: "inline",
    },
    {
      command: Commands.ScriptControl.Delete,
      group: "inline",
    },
    {
      command: Commands.ScriptControl.Execute,
      group: "inline",
    },
  ];
  cloned.contributes.menus["view/title"] = [
    {
      command: Commands.TreeViewControl.Refresh,
      group: "navigation",
    },
    {
      command: Commands.ScriptControl.Create,
      group: "navigation",
    },
    {
      command: Commands.WebviewControl.Open,
      group: "navigation",
    },
  ];
  return cloned;
};
