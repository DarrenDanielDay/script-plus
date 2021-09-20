import type { StringKey } from "taio/build/types/converts";

export type FullAccessPaths<T, Leaf> = T extends Leaf
  ? []
  : {
      [K in StringKey<T>]: [K, ...FullAccessPaths<T[K], Leaf>];
    }[StringKey<T>];
export type WeakAccessByPath<T, Path extends readonly string[]> = Path extends [
  infer F,
  ...infer R
]
  ? F extends keyof T
    ? R extends readonly string[]
      ? WeakAccessByPath<T[F], R>
      : never
    : never
  : T;
