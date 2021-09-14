export type Promisify<T> = T extends PromiseLike<unknown> ? T : Promise<T>;
export type PromisifyMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer Params) => infer Result
    ? (...args: Params) => Promisify<Result>
    : PromisifyMethods<T[K]>;
};
export type AsyncResult<T> = PromiseLike<T> | T;
export interface PromiseHandler<R> {
  resolve: (result: R) => void;
  reject: (error?: unknown) => void;
}
