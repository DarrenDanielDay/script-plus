import type { Func } from "taio/build/types/concepts";
import type { StringKey } from "taio/build/types/converts";
import type { AnyMessage, Event, Request, Response } from "../communication";
import type { CoreEvents } from "../../types/public-api";
import { json } from "./json-serializer";
if (typeof acquireVsCodeApi !== "function") {
  alert(
    "You need to run this app in vscode's webview. Some APIs are not available in browsers."
  );
  // Polyfill to prevent errors.
  (() => {
    let _state: unknown;
    window.acquireVsCodeApi = () => ({
      getState() {
        return _state;
      },
      setState(state) {
        _state = state;
      },
      postMessage() {
        console.warn("vscode.postMessage is not available");
      },
    });
  })();
}

window.vscodeAPI = acquireVsCodeApi();

export interface PromiseHandler<T> {
  resolve(data: T): void;
  reject(error?: unknown): void;
}

export interface IMessageManager<T> {
  handlerMap: Partial<{
    [K in StringKey<T>]: Set<Func<[T[K]], void>>;
  }>;
  messageQueue: Map<number, PromiseHandler<unknown>>;
  readonly seq: number;
  enqueue(handler: PromiseHandler<unknown>): number;
  accept(seq: number, payload: unknown): void;
  abort(seq: number, error?: unknown): void;
  request(path: string[], payload: unknown[]): Promise<Response<unknown>>;
  dispatchToExtension<K extends StringKey<T>>(name: K, payload: T[K]): void;
  onEvent<K extends StringKey<T>>(
    name: K,
    handler: (value: T[K]) => void
  ): () => void;
  offEvent<K extends StringKey<T>>(
    name: K,
    handler: (value: T[K]) => void
  ): void;
  listener: (event: { data: AnyMessage }) => void;
}

export const createMessageManager = <T>(): IMessageManager<T> => {
  type EventNames = StringKey<T>;
  let _seq = 0;
  const messageQueue = new Map<number, PromiseHandler<unknown>>();
  const handlerMap: Partial<{
    [K in EventNames]: Set<Func<[T[K]], void>>;
  }> = {};
  const getNextSeq = () => {
    return _seq++;
  };
  const listener = (event: { data: AnyMessage }) => {
    const message = json.parse(event.data) as AnyMessage;
    if (message.type === "response") {
      instance.accept(message.id, message.payload.data);
    } else if (message.type === "error") {
      instance.abort(
        message.id,
        message.payload.error ?? message.payload.message
      );
    } else if (message.type === "event") {
      // @ts-expect-error Cannot expect the name to be statically checked.
      dispatchEvent(message.name, message.payload);
    }
  };
  const dispatchEvent = <K extends EventNames>(
    name: K,
    payload: T[K]
  ): void => {
    instance.handlerMap[name]?.forEach((handler) => {
      handler.call(undefined, payload);
    });
  };
  const enqueue = (handler: PromiseHandler<unknown>) => {
    const nextSeq = getNextSeq();
    messageQueue.set(nextSeq, handler);
    return nextSeq;
  };
  const accept = (seq: number, payload: unknown) => {
    const { resolve } = messageQueue.get(seq) ?? {};
    resolve?.(payload);
    messageQueue.delete(seq);
  };
  const abort = (seq: number, error?: unknown) => {
    const { reject } = messageQueue.get(seq) ?? {};
    reject?.(error);
    messageQueue.delete(seq);
  };
  const request = async (
    path: string[],
    payload: unknown[]
  ): Promise<Response<unknown>> => {
    return new Promise((resolve, reject) => {
      const id = enqueue({ resolve, reject });
      const request: Request<unknown[]> = {
        payload: {
          path,
          args: payload,
        },
        id,
        type: "request",
      };
      window.vscodeAPI.postMessage(json.serialize(request));
    });
  };

  const dispatchToExtension = <K extends EventNames>(
    name: K,
    payload: T[K]
  ): void => {
    const event: Event<T[K]> = {
      id: 0,
      name,
      payload,
      type: "event",
    };

    window.vscodeAPI.postMessage(json.serialize(event));
  };

  const onEvent = <K extends EventNames>(
    name: K,
    handler: (value: T[K]) => void
  ) => {
    handlerMap[name] ??= new Set();
    handlerMap[name]!.add(handler);
    return () => offEvent(name, handler);
  };

  const offEvent = <K extends EventNames>(
    name: K,
    handler: (value: T[K]) => void
  ) => {
    handlerMap[name] ??= new Set();
    handlerMap[name]!.delete(handler);
  };
  const instance: IMessageManager<T> = {
    get handlerMap() {
      return handlerMap;
    },
    get messageQueue() {
      return messageQueue;
    },
    get seq() {
      return _seq;
    },
    enqueue,
    listener,
    accept,
    abort,
    request,
    dispatchToExtension,
    onEvent,
    offEvent,
  };
  return instance;
};

export const globalMessageManager = createMessageManager<CoreEvents>();
