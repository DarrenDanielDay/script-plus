import type { AccessByPath, AccessPaths } from "taio/build/types/object";

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
