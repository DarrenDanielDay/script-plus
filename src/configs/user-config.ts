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
          description: "Auto install `@types` for packages.",
        },
        installPosition: {
          type: "enum",
          enumObject: InstallPosition,
          description: `Position to install packages.
When set to \`local\`, packages will be installed in extension global storage.
When set to \`global\`, packages will be installed in the pacakge manager's global folder.`,
        },
        includePrerelease: {
          type: "boolean",
          description: `Whether to include pre-release version of packages in module search.
When set to true, the version list of large packages may be very long.`,
        },
      },
    },
    startUp: {
      type: "object",
      fields: {
        autoCheck: {
          type: "boolean",
          description: "Whether to check folder on activate.",
        },
        warnLocale: {
          type: "boolean",
          description: "Whether to show locale warning on start up.",
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
    includePrerelease: false,
  },
  startUp: {
    autoCheck: true,
    warnLocale: true,
  },
};

export const isScriptPlusConfig = createValidatorBySchema(
  scriptPlusConfigSchema
);
