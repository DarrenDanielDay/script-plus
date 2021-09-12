import env from "@esbuild-env";
import type { ExtensionPackageJSON } from "../types/vscode-package-json";
import { clone } from "../utils";
import { CommandList } from "./names";

export function normalizePackageJson(
  packageJson: ExtensionPackageJSON
): ExtensionPackageJSON {
  const cloned = clone(packageJson);
  cloned.activationEvents = CommandList.map(
    (command) => `onCommand:${command}`
  );
  cloned.contributes ??= {};
  cloned.contributes.commands = CommandList.map((command) => ({
    command,
    title: `%${command}%`,
  }));
  return cloned;
}

export function normalizeNlsJson(
  nlsJson: Record<string, string>
): Record<string, string> {
  const result = clone(nlsJson);
  for (const command of CommandList) {
    if (command in result) {
      continue;
    }
    result[command] = `${env.EXTENSION_NAME}:`;
  }
  return result;
}
