import { TypedObject } from "taio/build/libs/typescript/object";
import { isIntersectionThat } from "taio/build/utils/validator/array";
import type { Validator } from "taio/build/utils/validator/common";
import { isObject } from "taio/build/utils/validator/object";
import { isString } from "taio/build/utils/validator/primitive";
import {
  defineValidator,
  is,
  optional,
} from "taio/build/utils/validator/utils";

export const isError = defineValidator<Error>(
  isObject({
    message: isString,
    name: isString,
    stack: optional(isString),
  })
);

export interface CustomError<Mark extends symbol> extends Error {
  $mark: Mark;
}

export const factory = <Mark extends symbol>(mark: Mark, message?: string) => {
  const error = new Error(message);
  TypedObject.defineProperty(error, "$mark", { value: mark });
  return error;
};

export const validatorFactory = <Mark extends symbol>(
  mark: Mark
): Validator<CustomError<Mark>> => {
  return isIntersectionThat(
    isError,
    isObject<Pick<CustomError<Mark>, "$mark">>({ $mark: is(mark) })
  );
};
