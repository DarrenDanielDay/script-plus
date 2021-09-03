import type { StandardEnum } from "taio/build/types/enum";
import type { Validator } from "taio/build/utils/validator/common";
import { isObject } from "taio/build/utils/validator/object";
import { TypedObject } from "taio/build/libs/typescript/object";
import { isArrayOf } from "taio/build/utils/validator/array";
import { isEnumOf } from "taio/build/utils/validator/enum";
import { isNull, primitiveOf } from "taio/build/utils/validator/primitive";

export enum PackageManager {
  npm = "npm",
  yarn = "yarn",
}

type JSSchema =
  | JSArraySchema
  | JSBooleanSchema
  | JSEnumSchema
  | JSNullSchema
  | JSNumberSchema
  | JSObjectSchema
  | JSStringSchema;

interface BaseSchema {
  description?: string;
}

interface JSStringSchema extends BaseSchema {
  type: "string";
}

interface JSNumberSchema extends BaseSchema {
  type: "number";
}

interface JSBooleanSchema extends BaseSchema {
  type: "boolean";
}

interface JSNullSchema extends BaseSchema {
  type: "null";
}

interface JSEnumSchema extends BaseSchema {
  type: "enum";
  enumObject: StandardEnum<string>;
}

interface JSArraySchema extends BaseSchema {
  type: "array";
  item: JSSchema;
}

interface JSObjectSchema extends BaseSchema {
  type: "object";
  fields: Record<string, JSSchema>;
}

function defineSchema<T extends JSSchema>(schema: T): T {
  return schema;
}

function createValidator<T>(schema: JSSchema): Validator<T> {
  if (schema.type === "object") {
    const entries = TypedObject.entries(
      schema.fields as Record<keyof T, JSSchema>
    );
    const obj = entries.reduce<
      {
        [K in keyof T]: Validator<T[K]>;
      }
    >((acc, [key, subschema]) => {
      acc[key] = createValidator(subschema);
      return acc;
      // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    }, {} as never);
    return isObject(obj);
  }
  if (schema.type === "array") {
    // @ts-expect-error Dynamic impl
    return isArrayOf(createValidator(schema.item));
  }
  if (schema.type === "enum") {
    // @ts-expect-error Dynamic impl
    return isEnumOf(schema.enumObject);
  }
  if (schema.type === "null") {
    // @ts-expect-error Dynamic impl
    return isNull;
  }
  // @ts-expect-error Dynamic impl
  return primitiveOf(schema.type);
}

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
  },
} as const);

type GetConfigType<T extends JSSchema> = T extends JSStringSchema
  ? string
  : T extends JSNumberSchema
  ? number
  : T extends JSBooleanSchema
  ? boolean
  : T extends JSNullSchema
  ? null
  : T extends JSEnumSchema
  ? T["enumObject"] extends StandardEnum<infer E>
    ? E
    : never
  : T extends JSArraySchema
  ? GetConfigType<T["item"]>[]
  : T extends JSObjectSchema
  ? {
      -readonly [K in keyof T["fields"]]: GetConfigType<T["fields"][K]>;
    }
  : never;

export type ScriptPlusConfig = GetConfigType<typeof scriptPlusConfigSchema>;

export const defaultConfig: ScriptPlusConfig = {
  node: {
    packageManager: PackageManager.yarn,
  },
};

export const isScriptPlusConfig = createValidator<ScriptPlusConfig>(
  scriptPlusConfigSchema
);
