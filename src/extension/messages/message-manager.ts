import type { IModuleManager } from "../modules/module-manager";
import type { IEventHubAdapter } from "../events/event-manager";
import type { Event, Message, Request } from "../../app/communication";
import { globalErrorHandler } from "../utils/vscode-utils";

const isMessage = (obj: unknown): obj is Message<unknown> => {
  return (
    typeof obj === "object" &&
    !!obj &&
    typeof Reflect.get(obj, "id") === "number" &&
    typeof Reflect.get(obj, "type") === "string" &&
    !!Reflect.get(obj, "payload")
  );
};
const isRequest = (obj: unknown): obj is Request<unknown[]> => {
  return (
    isMessage(obj) &&
    obj.type === "request" &&
    typeof obj.payload === "object" &&
    !!obj.payload &&
    Array.isArray(Reflect.get(obj.payload, "args"))
  );
};
const isEvent = (obj: unknown): obj is Event<unknown> => {
  return isMessage(obj) && obj.type === "event";
};
export const createMessageHandler = <APIs, Events>({
  eventAdapter,
  moduleManager,
}: {
  moduleManager: IModuleManager<APIs>;
  eventAdapter: IEventHubAdapter<Events>;
}) => {
  return async (e: unknown) => {
    try {
      if (isRequest(e)) {
        return await moduleManager.requestHandler(e.payload.path, e);
      }
      if (isEvent(e)) {
        return eventAdapter.eventHandler(e);
      }
    } catch (error) {
      globalErrorHandler(error);
    }
  };
};
