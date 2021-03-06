import * as R from "ramda";
import { useState } from "react";
import type { AnyArray } from "taio/build/types/array";
import type { Func } from "taio/build/types/concepts";

export const useLoadingPipe = <P extends AnyArray, T, R>(
  getter: Func<P, Promise<T>>,
  reciever: Func<[T], R>
) => {
  const [loading, setLoading] = useState(false);
  const fire: Func<P, Promise<R>> = R.pipe(getter, (promise) =>
    promise.then(reciever).finally(R.pipe(R.F, setLoading))
  );
  const doFire = (...args: P) => {
    setLoading(true);
    return fire(...args);
  };
  return [loading, doFire] as const;
};
