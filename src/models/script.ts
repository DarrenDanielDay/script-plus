import type { StandardEnum } from "taio/build/types/enum";
import { isObject } from "taio/build/utils/validator/object";
import { isEnumObject } from "taio/build/utils/validator/enum";
import {
  defineValidator,
  is,
  optional,
  record,
} from "taio/build/utils/validator/utils";
import {
  isBoolean,
  isNumber,
  isString,
  isUndefined,
  primitiveOf,
} from "taio/build/utils/validator/primitive";
import {
  isAnyOf,
  isUnionThat,
  unionOf,
} from "taio/build/utils/validator/array";

export interface EnumOptions {
  enumObject: StandardEnum<number | string>;
  enumNameMapping?: Record<number | string, string>;
}

export const isEnumOptions = defineValidator<EnumOptions>(
  isObject({
    enumObject: isEnumObject,
    enumNameMapping: record(primitiveOf("string")),
  })
);

export type ArgumentField =
  | BooleanArugmentField
  | EnumArugmentField
  | NumberArugmentField
  | StringArugmentField;

export interface BaseArgumentField {
  type: "boolean" | "enum" | "number" | "string";
  description?: string;
  defaultValue: boolean | number | string;
  enumOptions?: EnumOptions;
}
export const isBaseArgumentField = defineValidator<BaseArgumentField>(
  isObject({
    type: isAnyOf(...(["boolean", "enum", "number", "string"] as const)),
    description: optional(primitiveOf("string")),
    defaultValue: unionOf(
      primitiveOf("boolean"),
      primitiveOf("number"),
      primitiveOf("string")
    ),
    enumOptions: optional(isEnumOptions),
  })
);
export interface StringArugmentField extends BaseArgumentField {
  type: "string";
  defaultValue: string;
  enumOptions: undefined;
}
export const isStringArgumentField = defineValidator<StringArugmentField>(
  isObject({
    type: is("string"),
    defaultValue: isString,
    description: optional(isString),
    enumOptions: isUndefined,
  })
);

export interface NumberArugmentField extends BaseArgumentField {
  type: "number";
  defaultValue: number;
  enumOptions: undefined;
}
export const isNumberArgumentField = defineValidator<NumberArugmentField>(
  isObject({
    type: is("number"),
    defaultValue: isNumber,
    description: optional(isString),
    enumOptions: isUndefined,
  })
);

export interface BooleanArugmentField extends BaseArgumentField {
  type: "boolean";
  defaultValue: boolean;
  enumOptions: undefined;
}
export const isBooleanArgumentField = defineValidator<BooleanArugmentField>(
  isObject({
    type: is("boolean"),
    defaultValue: isBoolean,
    description: optional(isString),
    enumOptions: isUndefined,
  })
);
export interface EnumArugmentField extends BaseArgumentField {
  type: "enum";
  defaultValue: number | string;
  enumOptions: EnumOptions;
}
export const isEnumArgumentField = defineValidator<EnumArugmentField>(
  isObject({
    type: is("enum"),
    defaultValue: isUnionThat(isString, isNumber),
    description: optional(isString),
    enumOptions: isObject({
      enumObject: isEnumObject,
      enumNameMapping: optional(record(isString)),
    }),
  })
);
export const isArgumentField = defineValidator<ArgumentField>(
  isUnionThat(
    isStringArgumentField,
    isNumberArgumentField,
    isBooleanArgumentField,
    isEnumArgumentField
  )
);
export interface UserScript {
  name: string;
  description: string;
  lang: "js" | "ts";
  argumentConfig: Record<string, ArgumentField>;
}
export const isUserScript = defineValidator<UserScript>(
  isObject({
    name: isString,
    lang: isAnyOf(...(["js", "ts"] as const)),
    description: isString,
    argumentConfig: record(isArgumentField),
  })
);
export type ScriptParameter = Record<string, boolean | number | string>;
