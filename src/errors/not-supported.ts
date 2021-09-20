import type { Validator } from "taio/build/utils/validator/common";
import { CustomError, factory, validatorFactory } from "./common";

const $NotSupported: unique symbol = Symbol();
export interface NotSupportedError extends CustomError<typeof $NotSupported> {}
export const isNotSupported: Validator<NotSupportedError> =
  validatorFactory($NotSupported);
export function notSupported(message: string): never {
  throw factory($NotSupported, message);
}
