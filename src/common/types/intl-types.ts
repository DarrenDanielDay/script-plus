import type { AnyArray } from "taio/build/types/array";
import type { Join, Split } from "taio/build/types/string";
import type { FullAccessPaths, WeakAccessByPath } from "./full-access-paths";

export type CreateTemplateType<T> = T extends AnyArray
  ? string
  : {
      [K in keyof T]: CreateTemplateType<T[K]>;
    };
export type CreateIntlTextKeys<Template extends Record<string, unknown>> = Join<
  // @ts-expect-error TypeScript Limitation
  FullAccessPaths<Template, string>,
  "."
>;
export type GetTemplateValue<Fields, K extends string> = WeakAccessByPath<
  Fields,
  Split<K, ".">
>;
