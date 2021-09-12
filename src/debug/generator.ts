import type { Func } from "taio/build/types/concepts";
import * as vscode from "vscode";
import { normalizeNlsJson, normalizePackageJson } from "../commands/generator";
import { readFile, writeFile } from "../modules/vscode-utils";
import type { ExtensionPackageJSON } from "../types/vscode-package-json";

export async function generate(context: vscode.ExtensionContext) {
  const extensionUri = context.extensionUri;
  const packageJsonUri = vscode.Uri.joinPath(extensionUri, "package.json");
  const packageNlsJsonUri = vscode.Uri.joinPath(
    extensionUri,
    "package.nls.json"
  );
  await normalize<ExtensionPackageJSON>(packageJsonUri, normalizePackageJson);
  await normalize<Record<string, string>>(packageNlsJsonUri, normalizeNlsJson);
}

async function normalize<T>(uri: vscode.Uri, normalizer: Func<[T], T>) {
  const original = JSON.parse(await readFile(uri)) as T;
  await writeFile(uri, JSON.stringify(normalizer(original)));
}
