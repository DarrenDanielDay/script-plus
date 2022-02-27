import type { Func, Mapper } from "taio/build/types/concepts";
import * as vscode from "vscode";
import * as commandGenerator from "../commands/generator";
import * as configGenerator from "../configs/generator";
import * as treeViewGenerator from "../modules/views/generator";
import { readFile, writeFile } from "../utils/vscode-utils";
import type { ExtensionPackageJSON } from "../../types/vscode-package-json";
import { sort } from "../utils";

export type Normalizer<T> = Mapper<T, T>;

export const generate = async (context: vscode.ExtensionContext) => {
  const extensionUri = context.extensionUri;
  const packageJsonUri = vscode.Uri.joinPath(extensionUri, "package.json");
  const packageNlsJsonUri = vscode.Uri.joinPath(
    extensionUri,
    "package.nls.json"
  );
  await normalize<ExtensionPackageJSON>(
    packageJsonUri,
    commandGenerator.normalizePackageJson,
    configGenerator.normalizePackageJson,
    treeViewGenerator.normalizePackageJson
  );
  await normalize<Record<string, string>>(
    packageNlsJsonUri,
    commandGenerator.normalizeNlsJson,
    configGenerator.normalizeNlsJson,
    sort
  );
};

const normalize = async <T>(
  uri: vscode.Uri,
  ...normalizers: Func<[T], T>[]
) => {
  const original = JSON.parse(await readFile(uri)) as T;
  await writeFile(
    uri,
    JSON.stringify(
      normalizers.reduce((prev, normalizer) => normalizer(prev), original),
      undefined,
      2
    ) + "\n"
  );
};
