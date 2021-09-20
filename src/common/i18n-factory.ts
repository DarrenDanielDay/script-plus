import { isObjectLike } from "taio/build/utils/validator/object";
import { isString } from "taio/build/utils/validator/primitive";
import type { CreateIntlTextKeys } from "./types/intl-types";

export function createMessages<T extends Record<string, unknown>>(
  templates: T
): Record<CreateIntlTextKeys<T>, string> {
  const result = {};
  const path: string[] = [];
  const walk = (node: unknown) => {
    if (isString(node)) {
      Reflect.set(result, path.join("."), node);
    }
    if (isObjectLike(node)) {
      for (const [key, value] of Object.entries(node)) {
        path.push(key);
        walk(value);
      }
    }
    path.pop();
  };
  walk(templates);
  // @ts-expect-error Dynamic impl
  return result;
}
