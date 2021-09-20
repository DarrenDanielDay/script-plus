import type { Validator } from "taio/build/utils/validator/common";
import { CustomError, factory, validatorFactory } from "./common";
const $InternalError: unique symbol = Symbol();
export interface InternalError extends CustomError<typeof $InternalError> {}
export const isInternalError: Validator<InternalError> =
  validatorFactory($InternalError);
function interanlError(message?: string): InternalError {
  return factory($InternalError, message);
}
export function impossible(message?: string): never {
  throw interanlError(message);
}
