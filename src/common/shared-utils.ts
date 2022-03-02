import type { Func } from "taio/build/types/concepts";
import { isObjectLike } from "taio/build/utils/validator/object";
import {
  isPrimitive,
  isString,
  isSymbol,
} from "taio/build/utils/validator/primitive";
import type { CreateIntlTextKeys } from "./types/intl-types";

export const getDisplay = (obj: unknown): string => {
  if (isPrimitive(obj)) {
    if (isSymbol(obj)) {
      return obj.toString();
    }
    return `${obj}`;
  }
  try {
    return JSON.stringify(
      obj,
      (_key, value) =>
        isSymbol(value)
          ? value.toString()
          : typeof value === "function"
          ? `${value}`
          : value,
      2
    );
  } catch (error) {
    return `${obj}`;
  }
};

export const createPending = () => {
  let resolve: Func<[], void>;
  let reject: Func<[unknown], void>;
  let promise = new Promise<void>((...args) => {
    [resolve, reject] = args;
  });
  return {
    done: () => resolve(),
    abort: (reason?: unknown) => reject(reason),
    ready: promise,
  };
};

export const createFutureValue = <T>() => {
  let resolve: Func<[T], void>;
  let reject: Func<[unknown], void>;
  let promise = new Promise<T>((...args) => {
    [resolve, reject] = args;
  });
  return {
    done: (value: T) => resolve(value),
    abort: (reason?: unknown) => reject(reason),
    promise,
  };
};

export const createMessages = <T extends Record<string, unknown>>(
  templates: T
): Record<CreateIntlTextKeys<T>, string> => {
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
};
