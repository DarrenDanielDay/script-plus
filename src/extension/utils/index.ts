import type { Func } from "taio/build/types/concepts";
import type { AccessByPath, AccessPaths } from "taio/build/types/object";
import { isObjectLike } from "taio/build/utils/validator/object";
import type { PromiseHandler } from "../../common/types/promise";

export const clone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const access = <T, Path extends AccessPaths<T>>(
  source: T,
  path: Path
): AccessByPath<T, Path> => {
  let result: unknown = source;
  for (const key of path as string[]) {
    const wrappedResult = Object(result) as object;
    result = Reflect.get(wrappedResult, key, wrappedResult);
  }
  // @ts-expect-error Access result cannot be infered
  return result;
};

export const getFullPaths = (obj: unknown): string[][] => {
  if (typeof obj !== "object" || obj === null) {
    return [];
  }
  return Object.keys(obj).flatMap((key) => {
    const subPaths = getFullPaths(Reflect.get(obj, key));
    if (!subPaths.length) return [[key]];
    return subPaths.map((path) => [key, ...path]);
  });
};

export const sort = <T>(json: T): T => {
  if (Array.isArray(json)) {
    // @ts-expect-error Dynamic impl
    return json.map((item) => sort(item));
  }
  if (isObjectLike(json)) {
    // @ts-expect-error Dynamic impl
    return Object.fromEntries(
      Object.keys(json)
        .sort()
        .map<[string, unknown]>((key) => [key, sort(Reflect.get(json, key))])
    );
  }
  return json;
};
export const createPromiseHandler = <T>(): [PromiseHandler<T>, Promise<T>] => {
  let resolve: Func<[T], void>;
  let reject: Func<[unknown], void>;
  let promise = new Promise<T>((...args) => {
    [resolve, reject] = args;
  });
  return [
    {
      resolve: (result: T) => resolve(result),
      reject: (reason?: unknown) => reject(reason),
    },
    promise,
  ];
};
export const keyIn = <T>() => {
  return <K extends keyof T>(key: K) => key;
};
