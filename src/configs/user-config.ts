import type { CreateTypeBySchemaType } from "taio/build/utils/json/interfaces/json-describer";
import { defineSchema } from "taio/build/utils/json/schema/schema-factory";
import { createValidatorBySchema } from "taio/build/utils/json/schema/validator-factory";
import { InstallPosition, PackageManager } from "../models/configurations";

export const scriptPlusConfigSchema = defineSchema({
  type: "object",
  fields: {
    node: {
      type: "object",
      fields: {
        packageManager: {
          type: "enum",
          enumObject: PackageManager,
          description: "Specifies the package manager to install packages.",
        },
      },
    },
    packages: {
      type: "object",
      fields: {
        installTypes: {
          type: "boolean",
        },
        installPosition: {
          type: "enum",
          enumObject: InstallPosition,
        },
      },
    },
  },
} as const);

export type ScriptPlusConfig = CreateTypeBySchemaType<
  typeof scriptPlusConfigSchema
>;

export const defaultConfig: ScriptPlusConfig = {
  node: {
    packageManager: PackageManager.yarn,
  },
  packages: {
    installPosition: InstallPosition.Local,
    installTypes: true,
  },
};

export const isScriptPlusConfig = createValidatorBySchema(
  scriptPlusConfigSchema
);
