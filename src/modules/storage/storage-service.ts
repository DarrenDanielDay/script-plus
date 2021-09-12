import type { StorageService } from "../../types/public-api";
import * as vscode from "vscode";
import { paths } from "../constant";

export function createStorageService(
  context: vscode.ExtensionContext
): StorageService {
  function basedOnScripts(...fragments: string[]) {
    return vscode.Uri.joinPath(
      context.globalStorageUri,
      paths.userScripts,
      ...fragments
    );
  }
  return {
    basedOnScripts,
  };
}
