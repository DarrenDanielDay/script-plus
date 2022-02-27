import * as vscode from "vscode";
import type { UserScript } from "../../../models/script";
import type { ScriptService } from "../../../types/public-api";

export interface TreeViewService {
  createProvider(): vscode.TreeDataProvider<UserScript>;
  refresh(): void;
  register(): void;
}

export const treeViewId = "script-plus.view.startup";

export const createTreeViewService = (
  scriptService: ScriptService
): TreeViewService => {
  const eventEmitter = new vscode.EventEmitter<UserScript | undefined | void>();
  let registered = false;
  let provider: vscode.TreeDataProvider<UserScript> | undefined = undefined;
  const treeViewService: TreeViewService = {
    createProvider() {
      provider ??= {
        getTreeItem(script) {
          return {
            id: script.name,
            label: script.name,
            tooltip: script.description,
          };
        },
        getChildren() {
          return scriptService.getList();
        },
        onDidChangeTreeData: eventEmitter.event,
      };
      return provider;
    },
    refresh() {
      eventEmitter.fire();
    },
    register() {
      if (registered) {
        return;
      }
      registered = true;
      vscode.window.registerTreeDataProvider(
        treeViewId,
        treeViewService.createProvider()
      );
    },
  };
  return treeViewService;
};
