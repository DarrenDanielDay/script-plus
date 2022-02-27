import type * as vscode from "vscode";
import type { Event, EventHub } from "../../app/communication";
import { json } from "../../app/src/json-serializer";
import type { PropertyKeys } from "../../common/types/property-key";

export interface IEventDispatcher<T> extends EventHub<T>, vscode.Disposable {
  onEach(
    handler: (event: PropertyKeys<T>, value: T[PropertyKeys<T>]) => void
  ): void;
  offEach(
    handler: (event: PropertyKeys<T>, value: T[PropertyKeys<T>]) => void
  ): void;
}

export const createDispatcher = <T>(): IEventDispatcher<T> => {
  const handlersMap = new Map<
    PropertyKeys<T>,
    Set<(value: T[PropertyKeys<T>]) => void>
  >();

  const handlers = new Set<
    (event: PropertyKeys<T>, value: T[PropertyKeys<T>]) => void
  >();
  const onEach = (
    handler: (event: PropertyKeys<T>, value: T[PropertyKeys<T>]) => void
  ) => {
    handlers.add(handler);
  };
  const offEach = (
    handler: (event: PropertyKeys<T>, value: T[PropertyKeys<T>]) => void
  ) => {
    handlers.delete(handler);
  };
  const on = <K extends PropertyKeys<T>>(
    event: K,
    handler: (value: T[K]) => void
  ): (() => void) => {
    handlersMap.has(event) || handlersMap.set(event, new Set());
    // @ts-expect-error Key mapping
    handlersMap.get(event)!.add(handler);
    return () => off(event, handler);
  };
  const off = <K extends PropertyKeys<T>>(
    event: K,
    handler: (value: T[K]) => void
  ): void => {
    handlersMap.has(event) || handlersMap.set(event, new Set());
    // @ts-expect-error Key mapping
    handlersMap.get(event)!.delete(handler);
  };
  const emit = <K extends PropertyKeys<T>>(event: K, value: T[K]): void => {
    handlers.forEach((handler) => handler.call(undefined, event, value));
    handlersMap
      .get(event)
      ?.forEach((handler) => handler.call(undefined, value));
  };
  return {
    dispose() {
      handlersMap.clear();
      handlers.clear();
    },
    on,
    off,
    emit,
    onEach,
    offEach,
  };
};

export interface IEventHubAdapter<T> extends vscode.Disposable {
  panels: Set<vscode.WebviewPanel>;
  dispatcher: IEventDispatcher<T>;
  eventHandler: (event: Event<unknown>) => void;
  attach(panel: vscode.WebviewPanel): void;
  detach(panel: vscode.WebviewPanel): void;
}

export const createEventHubAdapter = <T>(): IEventHubAdapter<T> => {
  const panels = new Set<vscode.WebviewPanel>();
  const dispatcher = createDispatcher<T>();
  const eventHandler = (event: Event<unknown>) => {
    // @ts-expect-error Cannot expect the name to be statically checked
    dispatcher.emit(event.name, event.payload);
  };
  dispatcher.onEach((name, payload) => {
    panels.forEach((panel) => {
      const event: Event<unknown> = {
        id: 0,
        name,
        payload,
        type: "event",
      };
      panel.webview.postMessage(json.serialize(event));
    });
  });
  const adapter: IEventHubAdapter<T> = {
    panels,
    dispatcher,
    dispose() {
      dispatcher.dispose();
    },
    attach(panel) {
      panels.add(panel);
    },
    detach(panel) {
      panels.delete(panel);
    },
    eventHandler,
  };
  return adapter;
};
