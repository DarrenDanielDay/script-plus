import { enumKeys, enumValues } from "taio/build/utils/enum";
import * as vscode from "vscode";
import type { ScriptService } from "../app/message-protocol";
import type { ExecutionTask } from "../models/execution-task";
import type {
  ArgumentConfig,
  ArgumentField,
  PassedParameter,
  UserScript,
} from "../models/script";

export async function askScript({
  scriptService,
}: {
  scriptService: ScriptService;
}) {
  const scriptList = await scriptService.getList();
  const result = await vscode.window.showQuickPick(
    scriptList.map<vscode.QuickPickItem & { script: UserScript }>((script) => ({
      label: script.name,
      description: script.description || undefined,
      script,
    })),
    {
      placeHolder: "Input to search",
      canPickMany: false,
      title: "Select a script",
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
  const pickOptions: vscode.QuickPickOptions = {
    title: field.description ?? `Give the value of "${fieldKey}"`,
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
          description: `${
            field.enumOptions.enumNameMapping?.[value] ?? ""
          }(value = ${value})`,
        })),
        pickOptions
      )
      .then((result) => result?.value);
  }
  const inputOptions: vscode.InputBoxOptions = {
    title: field.description,
    value: `${field.defaultValue}`,
  };
  if (field.type === "number") {
    return vscode.window
      .showInputBox({
        ...inputOptions,
        validateInput(value) {
          return isNaN(+value) ? "Must be a valid number" : "";
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

export async function execute({
  scriptService,
}: {
  scriptService: ScriptService;
}) {
  const script = await askScript({ scriptService });
  if (!script) {
    return;
  }
  const params = await askParameters({ argConfig: script.argumentConfig });
  if (!params) {
    return;
  }
  return scriptService.execute(script, params);
}

async function askTasks({ scriptService }: { scriptService: ScriptService }) {
  const tasks = await scriptService.getTasks();
  return vscode.window
    .showQuickPick<vscode.QuickPickItem & { task: ExecutionTask }>(
      tasks.map((task) => ({
        label: `${task.taskName} (taskId=${task.taskId}, startTime=${task.startTime})`,
        task,
      })),
      {
        canPickMany: true,
        title: "Select tasks",
      }
    )
    .then((tasks) => tasks?.map((task) => task.task));
}

export async function cleanUp({
  scriptService,
}: {
  scriptService: ScriptService;
}) {
  const tasks = await askTasks({ scriptService });
  if (tasks) {
    await Promise.all(tasks.map((task) => scriptService.cleanUp(task.taskId)));
  }
}
