import type { CoreAPI, CoreEvents } from "../message-protocol";
import type { PromisifyMethods } from "../../utils/types/promise";
import type { EventHub } from "../communication";
import type { Subject } from "rxjs";

declare global {
  // This is a simple implementation for calling extension API in webview.
  // See index.tsx for more details.
  var SessionInvoker: PromisifyMethods<CoreAPI>;
  var SessionHubs: EventHub<CoreEvents>;
  var $task: Subject<CoreEvents["task"]>;
}
