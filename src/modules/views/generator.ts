import env from "@esbuild-env";
import { Commands } from "../../commands/names";
import type { Normalizer } from "../../debug/generator";
import type { ExtensionPackageJSON } from "../../types/vscode-package-json";
import { clone } from "../../utils";
import { treeViewId } from "./tree-view-service";

export const normalizePackageJson: Normalizer<ExtensionPackageJSON> = (
  packageJson
) => {
  const cloned = clone(packageJson);
  cloned.contributes.menus ??= {};
  cloned.contributes.menus["view/item/context"] = [
    {
      command: Commands.ScriptControl.EditScript,
      group: "inline",
      when: `view == ${treeViewId}`,
    },
    {
      command: Commands.ScriptControl.Delete,
      group: "inline",
      when: `view == ${treeViewId}`,
    },
    {
      command: Commands.ScriptControl.Execute,
      group: "inline",
      when: `view == ${treeViewId}`,
    },
  ];
  cloned.contributes.menus["view/title"] = [
    {
      command: Commands.TreeViewControl.Refresh,
      group: "navigation",
      when: `view == ${treeViewId}`,
    },
    {
      command: Commands.ScriptControl.Create,
      group: "navigation",
      when: `view == ${treeViewId}`,
    },
    {
      command: Commands.WebviewControl.Open,
      group: "navigation",
      when: `view == ${treeViewId}`,
    },
  ];
  cloned.contributes.views ??= {};
  cloned.contributes.views[env.EXTENSION_BASE_NAME] = [
    {
      id: treeViewId,
      name: "Start Here",
    },
  ];
  return cloned;
};
