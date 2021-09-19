import * as vscode from "vscode";
import type { UserScript } from "../../models/script";
import type { ScriptService } from "../../types/public-api";

export interface TreeViewService {
  createProvider(): vscode.TreeDataProvider<UserScript>;
  refresh(): Promise<void>;
}

export function createTreeViewService(
  scriptService: ScriptService
): TreeViewService {
  const eventEmitter = new vscode.EventEmitter<UserScript | undefined | void>();
  const treeViewService: TreeViewService = {
    createProvider() {
      return {
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
    },
    async refresh() {
      eventEmitter.fire();
    },
  };
  return treeViewService;
}
