import { access, getFullPaths } from "../utils";
import { uncapitalize } from "taio/build/utils/string";
import type { Join } from "taio/build/types/string";
import type { StringKey } from "taio/build/types/converts";
import { isObjectLike } from "taio/build/utils/validator/object";
import { impossible } from "../errors/internal-error";
import type { ESBuildEnv } from "@esbuild-env";
import env from "@esbuild-env";
import type { FullAccessPaths } from "../utils/types/full-access-paths";
const commands = {
  WebviewControl: {
    Close: "",
    Open: "",
    Reload: "",
  },
  ScriptControl: {
    CleanUp: "",
    CleanUpAllSideEffects: "",
    EditScript: "",
    Execute: "",
    ExecuteCurrentScript: "",
    ForceCheckUserScriptsFolder: "",
  },
  PackageManage: {
    InstallModule: "",
  },
};
type MapUncapitalize<Arr extends readonly string[]> = {
  [I in keyof Arr]: Arr[I] extends string ? Uncapitalize<Arr[I]> : Arr[I];
};
type CreateAccessPathObjectType<Path extends readonly string[], T> =
  T extends string
    ? Join<MapUncapitalize<Path>, ".">
    : {
        [K in StringKey<T>]: CreateAccessPathObjectType<[...Path, K], T[K]>;
      };
type CommandObject = CreateAccessPathObjectType<
  [ESBuildEnv["EXTENSION_BASE_NAME"], "commands"],
  typeof commands
>;
const commandRoot = { commands };
export type Command = Join<
  [
    ESBuildEnv["EXTENSION_BASE_NAME"],
    ...MapUncapitalize<FullAccessPaths<typeof commandRoot, string>>
  ],
  "."
>;
const [commandObject, commandList] = (() => {
  const paths = getFullPaths(commandRoot);
  const commandObject = JSON.parse(JSON.stringify(commands)) as typeof commands;
  const commandList: Command[] = [];
  for (const path of paths) {
    const commandName = `${env.EXTENSION_BASE_NAME}.${path
      .map(uncapitalize)
      .join(".")}`;
    const lastObject: unknown = access(
      commandObject,
      // @ts-expect-error Dynamic impl
      path.slice(1, path.length - 1)
    );
    if (!isObjectLike(lastObject)) {
      return impossible();
    }
    Reflect.set(lastObject, path[path.length - 1]!, commandName);
  }
  return [commandObject as CommandObject, commandList] as const;
})();

export { commandObject as Commands, commandList as CommandList };
