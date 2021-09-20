import type { AnyArray } from "taio/build/types/array";
import type { AnyFunc } from "taio/build/types/concepts";
import type { Join } from "taio/build/types/string";
import { isArrayOf } from "taio/build/utils/validator/array";
import type { Validator } from "taio/build/utils/validator/common";
import { isObject } from "taio/build/utils/validator/object";
import {
  isBoolean,
  isString,
  primitiveOf,
} from "taio/build/utils/validator/primitive";
import { optional, record } from "taio/build/utils/validator/utils";
import type { CoreAPI } from "../../types/public-api";
import { invalidUsage } from "../errors/invalid-usage";
import { intl } from "../i18n/core/locale";
import { isUserScript } from "../../models/script";
import { isInstallConfig } from "../utils/node-utils";
import { globalErrorHandler } from "../utils/vscode-utils";
import type { FullAccessPaths } from "../../common/types/full-access-paths";

type MapToValidators<Arr extends AnyArray> = Extract<
  {
    [I in keyof Arr]: I extends `${number}` ? Validator<Arr[I]> : Arr[I];
  },
  unknown[]
>;
type APINames = Join<FullAccessPaths<CoreAPI, AnyFunc>, ".">;

function factory<Fn extends AnyFunc>(
  fn: Fn,
  name: APINames,
  ...validators: MapToValidators<Parameters<Fn>>
): Fn {
  // @ts-expect-error Dynamic impl
  const wrapped: Fn = async (...args: unknown[]): ReturnType<Fn> => {
    try {
      for (let i = 0; i < validators.length; i++) {
        const validator: Validator<unknown> = validators[i]!;
        const arg = args[i];
        if (!validator(arg)) {
          return invalidUsage(
            intl("api.invalidParam", { index: i, api: name })
          );
        }
      }
      return await fn(...args);
    } catch (error) {
      globalErrorHandler(error);
    }
  };
  return wrapped;
}

export function createPublicAPI(api: CoreAPI): CoreAPI {
  const nocheck = (value: unknown): value is never => !!value || !value;
  return {
    ConfigService: {
      dispose: factory(api.ConfigService.dispose, "ConfigService.dispose"),
      getConfigs: factory(
        api.ConfigService.getConfigs,
        "ConfigService.getConfigs"
      ),
      updateConfigs: factory(
        api.ConfigService.updateConfigs,
        "ConfigService.updateConfigs",
        nocheck
      ),
    },
    PackageService: {
      installExtensionDependencies: factory(
        api.PackageService.installExtensionDependencies,
        "PackageService.installExtensionDependencies",
        isObject({
          production: optional(isBoolean),
          useLock: optional(isBoolean),
        })
      ),
      installModules: factory(
        api.PackageService.installModules,
        "PackageService.installModules",
        isArrayOf(primitiveOf("string")),
        isInstallConfig,
        optional(isString),
        optional(isBoolean)
      ),
      installPackage: factory(
        api.PackageService.installPackage,
        "PackageService.installPackage",
        isString,
        isString,
        optional(isObject({ global: optional(isBoolean) }))
      ),
      listVersions: factory(
        api.PackageService.listVersions,
        "PackageService.listVersions",
        isString
      ),
    },
    ScriptService: {
      cleanUp: factory(
        api.ScriptService.cleanUp,
        "ScriptService.cleanUp",
        isString
      ),
      cleanUpAll: factory(
        api.ScriptService.cleanUpAll,
        "ScriptService.cleanUpAll",
        optional(isObject({ includeMounted: optional(isBoolean) }))
      ),
      create: factory(
        api.ScriptService.create,
        "ScriptService.create",
        isUserScript
      ),
      delete: factory(
        api.ScriptService.delete,
        "ScriptService.delete",
        isUserScript,
        optional(isBoolean)
      ),
      dispose: factory(api.ScriptService.dispose, "ScriptService.dispose"),
      editScript: factory(
        api.ScriptService.editScript,
        "ScriptService.editScript",
        isUserScript
      ),
      execute: factory(
        api.ScriptService.execute,
        "ScriptService.execute",
        isUserScript,
        record(nocheck)
      ),
      executeCurrent: factory(
        api.ScriptService.executeCurrent,
        "ScriptService.executeCurrent"
      ),
      export: factory(
        api.ScriptService.export,
        "ScriptService.export",
        isUserScript
      ),
      getLastExecutedScriptName: factory(
        api.ScriptService.getLastExecutedScriptName,
        "ScriptService.getLastExecutedScriptName"
      ),
      getList: factory(api.ScriptService.getList, "ScriptService.getList"),
      getTasks: factory(api.ScriptService.getTasks, "ScriptService.getTasks"),
      import: factory(api.ScriptService.import, "ScriptService.import"),
      mountTask: factory(
        api.ScriptService.mountTask,
        "ScriptService.mountTask",
        isString
      ),
      updateScript: factory(
        api.ScriptService.updateScript,
        "ScriptService.updateScript",
        isUserScript
      ),
      validateScriptNamePattern: factory(
        api.ScriptService.validateScriptNamePattern,
        "ScriptService.validateScriptNamePattern",
        isString
      ),
    },
    StartUpService: {
      checkAll: factory(
        api.StartUpService.checkAll,
        "StartUpService.checkAll",
        optional(isBoolean)
      ),
      checkExtensionDependencies: factory(
        api.StartUpService.checkExtensionDependencies,
        "StartUpService.checkExtensionDependencies",
        optional(isBoolean)
      ),
      checkFolder: factory(
        api.StartUpService.checkFolder,
        "StartUpService.checkFolder"
      ),
      checkVSCodeAndNodeJS: factory(
        api.StartUpService.checkVSCodeAndNodeJS,
        "StartUpService.checkVSCodeAndNodeJS"
      ),
    },
  };
}
