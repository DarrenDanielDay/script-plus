import type { Func } from "taio/build/types/concepts";
import * as vscode from "vscode";
import * as commandGenerator from "../commands/generator";
import * as configGenerator from "../configs/generator";
import { readFile, writeFile } from "../modules/vscode-utils";
import type { ExtensionPackageJSON } from "../types/vscode-package-json";
import { sort } from "../utils";

export async function generate(context: vscode.ExtensionContext) {
  const extensionUri = context.extensionUri;
  const packageJsonUri = vscode.Uri.joinPath(extensionUri, "package.json");
  const packageNlsJsonUri = vscode.Uri.joinPath(
    extensionUri,
    "package.nls.json"
  );
  await normalize<ExtensionPackageJSON>(
    packageJsonUri,
    commandGenerator.normalizePackageJson,
    configGenerator.normalizePackageJson
  );
  await normalize<Record<string, string>>(
    packageNlsJsonUri,
    commandGenerator.normalizeNlsJson,
    configGenerator.normalizeNlsJson,
    sort
  );
}

async function normalize<T>(uri: vscode.Uri, ...normalizers: Func<[T], T>[]) {
  const original = JSON.parse(await readFile(uri)) as T;
  await writeFile(
    uri,
    JSON.stringify(
      normalizers.reduce((prev, normalizer) => normalizer(prev), original),
      undefined,
      2
    ) + "\n"
  );
}
