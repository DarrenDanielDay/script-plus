import type { AnyArray } from "taio/build/types/array";
import type { Join, Split } from "taio/build/types/string";

type FullAccessPaths<T> = T extends object
  ? {
      [K in keyof T]: [K, ...FullAccessPaths<T[K]>];
    }[keyof T]
  : [];

type WeakAccessByPath<T, Path extends readonly string[]> = Path extends [
  infer F,
  ...infer R
]
  ? F extends keyof T
    ? R extends readonly string[]
      ? WeakAccessByPath<T[F], R>
      : never
    : never
  : T;
export type IntlTextKeys = Join<FullAccessPaths<IntlTextTemplates>, ".">;
export type TemplateValues<K extends IntlTextKeys> = WeakAccessByPath<
  IntlTextFields,
  Split<K, ".">
> extends readonly [infer T]
  ? T
  : never;
type CreateTemplateType<T> = T extends AnyArray
  ? string
  : {
      [K in keyof T]: CreateTemplateType<T[K]>;
    };

export type IntlTextTemplates = CreateTemplateType<IntlTextFields>;

export interface IntlTextFields {
  menu: {
    runScript: [];
    manageScript: [];
    manageModules: [];
  };
  runner: {
    run: {
      apply: [];
      running: [];
      cleaning: [];
    };
    console: {
      title: [];
    };
    mount: {
      button: [];
      tooltip: [];
    };
    cleanUp: {
      cleaning: [];
      apply: [];
    };
  };
}
