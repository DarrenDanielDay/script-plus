import type { CreateTypeBySchemaType } from "taio/build/utils/json/interfaces/json-describer";
import { defineSchema } from "taio/build/utils/json/schema/schema-factory";
import { createValidatorBySchema } from "taio/build/utils/json/schema/validator-factory";
import {
  DependencyStrategy,
  InstallPosition,
  PackageManagerKind,
  TransformerKind,
} from "../../models/configurations";

export const scriptPlusConfigSchema = defineSchema({
  type: "object",
  fields: {
    node: {
      type: "object",
      fields: {
        packageManager: {
          type: "enum",
          enumObject: PackageManagerKind,
        },
      },
    },
    packages: {
      type: "object",
      fields: {
        dependencyStrategy: {
          type: "enum",
          enumObject: DependencyStrategy,
        },
        installTypes: {
          type: "boolean",
        },
        installPosition: {
          type: "enum",
          enumObject: InstallPosition,
        },
        includePrerelease: {
          type: "boolean",
        },
      },
    },
    script: {
      type: "object",
      fields: {
        transformer: {
          type: "enum",
          enumObject: TransformerKind,
        },
      },
    },
    startUp: {
      type: "object",
      fields: {
        autoCheck: {
          type: "boolean",
        },
        warnLocale: {
          type: "boolean",
        },
        checkExtensionDependencies: {
          type: "boolean",
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
    packageManager: PackageManagerKind.yarn,
  },
  packages: {
    dependencyStrategy: DependencyStrategy.AlwaysLatest,
    installPosition: InstallPosition.Local,
    installTypes: true,
    includePrerelease: false,
  },
  script: {
    transformer: TransformerKind.esbuild,
  },
  startUp: {
    autoCheck: true,
    warnLocale: true,
    checkExtensionDependencies: false,
  },
};

export const isScriptPlusConfig = createValidatorBySchema(
  scriptPlusConfigSchema
);
