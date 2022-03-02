import type { CoreAPI, CoreEvents } from "../../types/public-api";
import type { PromisifyMethods } from "../../common/types/promise";
import type { EventHub } from "../communication";
import type { Subject } from "rxjs";
import { Locales } from "../../models/locales";

declare global {
  // This is a simple implementation for calling extension API in webview.
  // See index.tsx for more details.
  var SessionInvoker: PromisifyMethods<CoreAPI>;
  var SessionHubs: EventHub<CoreEvents>;
  var $locale: Subject<Locales>;
}
