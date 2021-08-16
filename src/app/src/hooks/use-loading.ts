import * as R from "ramda";
import { useCallback, useState } from "react";
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

export function useLoadingPipe<T>(
  getter: Func<[], Promise<T>>,
  reciever: Func<[T], void>
) {
  const [loading, setLoading] = useState(false);
  const fire = R.pipe(R.T, setLoading, getter, (promise) =>
    promise.then(reciever).finally(R.pipe(R.F, setLoading))
  );
  return [loading, fire] as const;
}
