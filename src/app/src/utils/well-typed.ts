import * as R from "ramda";
import type React from "react";
import { isNullish } from "taio/build/utils/validator/primitive";
import { assertThat } from "taio/build/utils/validator/utils";

declare module "ramda" {
  export function prop<P extends keyof T, T>(key: P): (value: T) => T[P];
}

// @ts-expect-error Type predicate cannot be inherited
export const isNonNullish: <T>(value: T) => value is NonNullable<T> = R.compose(
  R.not,
  isNullish
);
export const assertNonNullish: <T>(
  value: T
) => asserts value is NonNullable<T> = assertThat(isNonNullish);
export const setStateEffect: <T>(
  fn: React.Dispatch<React.SetStateAction<T>>
) => (value: T) => T = R.tap;
