import { access, getFullPaths } from "../utils";
import { uncapitalize } from "taio/build/utils/string";
import type { Join } from "taio/build/types/string";
import type { StringKey } from "taio/build/types/converts";
import { isObjectLike } from "taio/build/utils/validator/object";
import { impossible } from "../errors/internal-error";
import type { ESBuildEnv } from "@esbuild-env";
import env from "@esbuild-env";
import type { FullAccessPaths } from "../../common/types/full-access-paths";
import { namespaces } from "../modules/constant";
const commands = {
  Configuration: {
    Reset: "",
  },
  PackageManage: {
    InstallModule: "",
  },
  ScriptControl: {
    CleanUp: "",
    CleanUpAllSideEffects: "",
    Create: "",
    Delete: "",
    EditScript: "",
    Execute: "",
    ExecuteCurrentScript: "",
    ForceCheckUserScriptsFolder: "",
  },
  TreeViewControl: {
    Refresh: "",
  },
  WebviewControl: {
    Close: "",
    Open: "",
    Reload: "",
  },
};
type MapUncapitalize<Arr extends readonly string[]> = {
  [I in keyof Arr]: Arr[I] extends string ? Uncapitalize<Arr[I]> : Arr[I];
};
type CreateAccessPathObjectType<
  Path extends readonly string[],
  T
> = T extends string
  ? Join<MapUncapitalize<Path>, ".">
  : {
      [K in StringKey<T>]: CreateAccessPathObjectType<[...Path, K], T[K]>;
    };
type PrefixPath = [
  ESBuildEnv["EXTENSION_BASE_NAME"],
  typeof namespaces["commands"]
];

type CommandObject = CreateAccessPathObjectType<PrefixPath, typeof commands>;
export type Command = Join<
  [...PrefixPath, ...MapUncapitalize<FullAccessPaths<typeof commands, string>>],
  "."
>;
const [commandObject, commandList] = (() => {
  const paths = getFullPaths(commands);
  const commandObject = JSON.parse(JSON.stringify(commands)) as typeof commands;
  const commandList: string[] = [];
  for (const path of paths) {
    const commandName = [env.EXTENSION_BASE_NAME, namespaces.commands, ...path]
      .map(uncapitalize)
      .join(".");
    const lastObject: unknown = access(
      commandObject,
      // @ts-expect-error Dynamic impl
      path.slice(0, path.length - 1)
    );
    if (!isObjectLike(lastObject)) {
      return impossible();
    }
    Reflect.set(lastObject, path[path.length - 1]!, commandName);
    commandList.push(commandName);
  }
  return [
    commandObject as CommandObject,
    commandList.sort() as Command[],
  ] as const;
})();

export { commandObject as Commands, commandList as CommandList };
