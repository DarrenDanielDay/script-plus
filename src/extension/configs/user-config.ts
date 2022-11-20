/// <reference path="../../types/esbuild-env.d.ts" />
import env from "@esbuild-env";
import type { CreateTypeBySchemaType } from "taio/build/utils/json/interfaces/json-describer";
import { defineSchema } from "taio/build/utils/json/schema/schema-factory";
import { createValidatorBySchema } from "taio/build/utils/json/schema/validator-factory";
import {
  DependencyStrategy,
  InstallPosition,
  PackageManagerKind,
  TransformerKind,
} from "../../models/configurations";
declare module "taio/build/utils/json/interfaces/json-describer" {
  interface BaseSchema {
    vscodeConfigMeta?: {
      markdownDescription?: string;
      items?: object;
    };
  }
}

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
        autoScripts: {
          type: "array",
          vscodeConfigMeta:
            env.ENV === "dev"
              ? {
                  markdownDescription: `\
Expecting an array of object with the following shape:

\`\`\`ts
interface AutoRunOptions {
  /**
   * The user script name.
   */
  script: string;
  /**
   * Falsy value like \`null\` or empty string, or not provided, means the default parameter.
   * String value means the \`preset\` name.
   * Object value means the parameter instance.
   */
  parameter: string | object | null;
}
\`\`\`

Since it's not a simple array, currently \`vscode\` does not support to edit it directly in the settings UI. 

You can edit it in \`settings.json\` or add one at the "run script" page in [webview panel](command:script-plus.commands.webviewControl.open).

Currently the webview panel does not support to remove auto scripts.
`,
                  items: {
                    type: "object",
                    properties: {
                      script: {
                        description: "The user script name.",
                        title: "The user script name.",
                        type: "string",
                      },
                      parameter: {
                        anyOf: [
                          { type: "string" },
                          { type: "object" },
                          { type: "null" },
                        ],
                        description: `Falsy value like \`null\` or empty string, or not provided, means the default parameter.

String value means the \`preset\` name.

Object value means the parameter instance.
                        `,
                        title: "The parameter to run script.",
                      },
                    },
                    required: ["script"],
                  },
                }
              : undefined,
          item: {
            type: "object",
            fields: {
              script: {
                type: "string",
              },
              parameter: {
                type: "union",
                unions: [
                  {
                    type: "string",
                  },
                  {
                    type: "object",
                    fields: {},
                  },
                  {
                    type: "null",
                  },
                ],
              },
            },
          },
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
    autoScripts: [],
    warnLocale: true,
    checkExtensionDependencies: false,
  },
};

export const isScriptPlusConfig = createValidatorBySchema(
  scriptPlusConfigSchema
);
