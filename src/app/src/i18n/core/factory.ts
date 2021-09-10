import { isObjectLike } from "taio/build/utils/validator/object";
import { isString } from "taio/build/utils/validator/primitive";
import type { IntlTextKeys, IntlTextTemplates } from "./types";

export function createMessages(
  templates: IntlTextTemplates
): Record<IntlTextKeys, string> {
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
