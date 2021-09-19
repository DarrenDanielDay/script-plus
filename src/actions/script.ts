import { enumKeys, enumValues } from "taio/build/utils/enum";
import * as vscode from "vscode";
import type { CoreAPI } from "../types/public-api";
import { intl } from "../i18n/core/locale";
import { ExecutionTask, isExecutionTask } from "../models/execution-task";
import {
  ArgumentConfig,
  ArgumentField,
  isPassedParameter,
  isUserScript,
  PassedParameter,
  UserScript,
} from "../models/script";
import { typed } from "taio/build/utils/typed-function";
import { isArrayOf } from "taio/build/utils/validator/array";

export async function askScript(api: CoreAPI) {
  const scriptList = await api.ScriptService.getList();
  const lastExecutedScriptName =
    await api.ScriptService.getLastExecutedScriptName();
  let lastExecutedScript = scriptList.find(
    (script) => script.name === lastExecutedScriptName
  );
  type ScriptQuickPickItem = vscode.QuickPickItem & {
    script: UserScript;
  };

  const result = await vscode.window.showQuickPick<ScriptQuickPickItem>(
    [
      ...(lastExecutedScript
        ? [
            typed<ScriptQuickPickItem>({
              label: lastExecutedScript.name,
              description: lastExecutedScript.description || undefined,
              script: lastExecutedScript,
              detail: intl("actions.script.ask.script.suggestion.lastExecuted"),
            }),
          ]
        : []),
      ...scriptList.map((script) => ({
        label: script.name,
        description: script.description || undefined,
        script,
      })),
    ],
    {
      placeHolder: intl("actions.script.ask.script.placeholder"),
      canPickMany: false,
      title: intl("actions.script.ask.script.title"),
      matchOnDescription: true,
    }
  );
  if (result) {
    return result.script;
  }
}

export async function askParameters({
  argConfig,
}: {
  argConfig: ArgumentConfig;
}) {
  const passed: PassedParameter = {};
  for (const [key, field] of Object.entries(argConfig)) {
    const result = await askParameter(field, key);
    if (result == null) {
      return undefined;
    }
    passed[key] = result;
  }
  return passed;
}

function askParameter(field: ArgumentField, fieldKey: string) {
  const parameterPromote =
    (field.description ?? "") ||
    intl("actions.script.ask.parameter.title", { fieldKey });
  const pickOptions: vscode.QuickPickOptions = {
    title: parameterPromote,
    matchOnDetail: true,
    canPickMany: false,
  };
  if (field.type === "boolean") {
    return vscode.window
      .showQuickPick<vscode.QuickPickItem & { bool: boolean }>(
        [
          {
            label: "true",
            bool: true,
          },
          {
            label: "false",
            bool: false,
          },
        ],
        pickOptions
      )
      .then((result) => result?.bool);
  }
  if (field.type === "enum") {
    return vscode.window
      .showQuickPick<vscode.QuickPickItem & { value: number | string }>(
        enumValues(field.enumOptions.enumObject).map((value) => ({
          label:
            enumKeys(field.enumOptions.enumObject).find(
              (key) => field.enumOptions.enumObject[key] === value
            ) ?? `${value}`,
          value,
          description: intl("actions.script.ask.parameter.enum.description", {
            value: value.toString(),
            displayName: field.enumOptions.enumNameMapping?.[value] ?? "",
          }),
        })),
        pickOptions
      )
      .then((result) => result?.value);
  }
  const inputOptions: vscode.InputBoxOptions = {
    title: parameterPromote,
    value: `${field.defaultValue}`,
  };
  if (field.type === "number") {
    return vscode.window
      .showInputBox({
        ...inputOptions,
        validateInput(value) {
          return isNaN(+value)
            ? intl("actions.script.ask.parameter.validate.shouldBeNumber")
            : "";
        },
      })
      .then((value) => {
        if (value !== undefined) return +value;
      });
  }
  return vscode.window.showInputBox({
    ...inputOptions,
  });
}

export async function execute(
  api: CoreAPI,
  script?: unknown,
  params?: unknown
) {
  script ??= await askScript(api);
  if (!isUserScript(script)) {
    return;
  }
  params ??= await askParameters({ argConfig: script.argumentConfig });
  if (!isPassedParameter(params)) {
    return;
  }
  return api.ScriptService.execute(script, params);
}

async function askTasks(api: CoreAPI) {
  const tasks = await api.ScriptService.getTasks();
  return vscode.window
    .showQuickPick<vscode.QuickPickItem & { task: ExecutionTask }>(
      tasks.map((task) => ({
        label: intl("actions.script.ask.task.label", task),
        task,
      })),
      {
        canPickMany: true,
        title: intl("actions.script.ask.task.title"),
      }
    )
    .then((tasks) => tasks?.map((task) => task.task));
}

export async function cleanUp(api: CoreAPI, tasks?: unknown) {
  tasks ??= await askTasks(api);
  if (isArrayOf(isExecutionTask)(tasks)) {
    await Promise.all(
      tasks.map((task) => api.ScriptService.cleanUp(task.taskId))
    );
  }
}

export async function create(api: CoreAPI) {
  const lang = (
    await vscode.window.showQuickPick<
      vscode.QuickPickItem & { label: UserScript["lang"] }
    >([{ label: "js" }, { label: "ts" }], {
      canPickMany: false,
      title: intl("actions.script.ask.script.new.lang.promote"),
    })
  )?.label;
  if (!lang) {
    return;
  }
  const list = await api.ScriptService.getList();
  const names = new Set(list.map((script) => script.name));
  const name = await vscode.window.showInputBox({
    title: intl("actions.script.ask.script.new.name.promote"),
    validateInput(value) {
      return (
        api.ScriptService.validateScriptNamePattern(value) ||
        (names.has(value)
          ? intl("actions.script.ask.script.new.name.duplicate", {
              scriptName: value,
            })
          : "")
      );
    },
  });
  if (!name) {
    return;
  }
  return api.ScriptService.create({
    name,
    lang,
    description: "",
    argumentConfig: {},
  });
}

export async function deleteScript(api: CoreAPI, script?: unknown) {
  script ??= await askScript(api);
  if (isUserScript(script)) {
    await api.ScriptService.delete(script);
  }
}

export async function edit(api: CoreAPI, script?: unknown) {
  script ??= await askScript(api);
  if (isUserScript(script)) {
    await api.ScriptService.editScript(script);
  }
}
