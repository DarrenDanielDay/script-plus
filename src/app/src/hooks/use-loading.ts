import * as R from "ramda";
import { useCallback, useState } from "react";
import type { AnyArray } from "taio/build/types/array";
import type { Func } from "taio/build/types/concepts";
import { useSafeState } from "./use-safe-state";

export function useLoading(): [
  boolean,
  (handler: () => Promise<void>) => Promise<void>,
  React.Dispatch<React.SetStateAction<boolean>>
] {
  const [loading, setLoading] = useSafeState(false);
  const loadingScope = useCallback(async (handler: () => Promise<void>) => {
    try {
      setLoading(true);
      await handler();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  return [loading, loadingScope, setLoading];
}

export function useLoadingPipe<P extends AnyArray, T, R>(
  getter: Func<P, Promise<T>>,
  reciever: Func<[T], R>
) {
  const [loading, setLoading] = useState(false);
  const fire: Func<P, Promise<R>> = R.pipe(getter, (promise) =>
    promise.then(reciever).finally(R.pipe(R.F, setLoading))
  );
  const doFire = (...args: P) => {
    setLoading(true);
    return fire(...args);
  };
  return [loading, doFire] as const;
}
