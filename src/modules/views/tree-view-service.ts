import type * as vscode from "vscode";
import { Commands } from "../../commands/names";
import type { UserScript } from "../../models/script";
import type { ScriptService } from "../../types/public-api";

export interface TreeViewService {
  createProvider(): vscode.TreeDataProvider<UserScript>;
}

export function createTreeViewService(script: ScriptService): TreeViewService {
  const treeViewService: TreeViewService = {
    createProvider() {
      return {
        getTreeItem(script) {
          return {
            label: script.name,
            tooltip: script.description,
            command: {
              command: Commands.ScriptControl.Execute,
              title: "Execute Script",
            },
          };
        },
        getChildren() {
          return script.getList();
        },
      };
    },
  };
  return treeViewService;
}
