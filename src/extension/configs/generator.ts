import env from "@esbuild-env";
import { TypedObject } from "taio/build/libs/typescript/object";
import { enumValues } from "taio/build/utils/enum";
import type { JSONSchema } from "taio/build/utils/json/interfaces/json-describer";
import { isString } from "taio/build/utils/validator/primitive";
import type { Normalizer } from "../debug/generator";
import { invalidUsage } from "../errors/invalid-usage";
import { namespaces } from "../modules/constant";
import type {
  ConfigItem,
  ExtensionPackageJSON,
} from "../../types/vscode-package-json";
import type { ExtensionPackageNlsJSON } from "../../types/vscode-package-nls-json";
import { access, clone, getFullPaths } from "../utils";
import { defaultConfig, scriptPlusConfigSchema } from "./user-config";

export const normalizePackageJson: Normalizer<ExtensionPackageJSON> = (
  packageJson
) => {
  const cloned = clone(packageJson);
  cloned.contributes.configuration ??= {
    title: env.EXTENSION_NAME,
    properties: {},
  };
  const paths = getFullPaths(defaultConfig);
  cloned.contributes.configuration.properties = TypedObject.fromEntries(
    paths.map<readonly [string, ConfigItem]>((path) => {
      // @ts-expect-error Dynamic impl
      const value: never = access(defaultConfig, path);
      const schema = accessSchema(scriptPlusConfigSchema, path);
      const configKey = getConfigKey(path);
      const configItem: ConfigItem = {
        description: `%${configKey}%`,
        type:
          schema.type === "enum" || schema.type === "literal"
            ? "string"
            : schema.type === "object" ||
              schema.type === "tuple" ||
              schema.type === "union" ||
              schema.type === "null"
            ? invalidUsage("Not supported schema type")
            : schema.type,
        enum:
          schema.type === "enum"
            ? enumValues(schema.enumObject).filter(isString)
            : undefined,
        default: value,
        ...schema.vscodeConfigMeta,
      };
      return [configKey, configItem] as const;
    })
  );
  return cloned;
};

export const normalizeNlsJson: Normalizer<ExtensionPackageNlsJSON> = (
  nlsJson
) => {
  const result = clone(nlsJson);
  for (const path of getFullPaths(defaultConfig)) {
    const configKey = getConfigKey(path);
    result[configKey] ??= `%${configKey}%`;
  }
  return result;
};

const getConfigKey = (path: string[]) => {
  return [env.EXTENSION_BASE_NAME, namespaces.configs, ...path].join(".");
};

const accessSchema = (schema: JSONSchema, path: string[]): JSONSchema => {
  const [key, ...rest] = path;
  if (schema.type === "object") {
    return accessSchema(schema.fields[key], rest);
  }
  if (!path.length) {
    return schema;
  }
  return invalidUsage("Invalid config schema");
};
