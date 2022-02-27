import type { Validator } from "taio/build/utils/validator/common";
import { CustomError, factory, validatorFactory } from "./common";

const $InvalidUsage: unique symbol = Symbol();
export interface InvalidUsageError extends CustomError<typeof $InvalidUsage> {}
export const isInvalidUsage: Validator<InvalidUsageError> =
  validatorFactory($InvalidUsage);
export const invalidUsage = (message: string): never => {
  throw factory($InvalidUsage, message);
};
