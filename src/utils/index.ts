import type { AccessByPath, AccessPaths } from "taio/build/types/object";

export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function access<T, Path extends AccessPaths<T>>(
  source: T,
  path: Path
): AccessByPath<T, Path> {
  let result: unknown = source;
  for (const key of path as string[]) {
    const wrappedResult = Object(result) as object;
    result = Reflect.get(wrappedResult, key, wrappedResult);
  }
  // @ts-expect-error Access result cannot be infered
  return result;
}

export function getFullPaths(obj: unknown): string[][] {
  if (typeof obj !== "object" || obj === null) {
    return [];
  }
  return Object.keys(obj).flatMap((key) => {
    const subPaths = getFullPaths(Reflect.get(obj, key));
    if (!subPaths.length) return [[key]];
    return subPaths.map((path) => [key, ...path]);
  });
}
