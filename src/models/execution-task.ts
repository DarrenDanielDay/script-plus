import { identity } from "taio/build/libs/custom/functions/identity";
import { isAnyOf, isUnionThat } from "taio/build/utils/validator/array";
import { isObject } from "taio/build/utils/validator/object";
import {
  isBoolean,
  isString,
  isUndefined,
} from "taio/build/utils/validator/primitive";
import {
  defineValidator,
  is,
  optional,
} from "taio/build/utils/validator/utils";
import type {
  CleanUp,
  ScriptRunObjectResult,
  ScriptRunResult,
} from "../extension/templates/api";

const nocheck = (obj: unknown): obj is unknown => !obj || !!obj;
export interface ExecutionTask {
  taskId: string;
  taskName: string;
  startTime: string;
}

export const isExecutionTask = defineValidator<ExecutionTask>(
  isObject({
    taskId: isString,
    taskName: isString,
    startTime: isString,
  })
);

interface TaskExecutionMessage {
  type: string;
  taskId: string;
}

type LogLevels = keyof Pick<
  Console,
  "debug" | "error" | "info" | "log" | "warn"
>;

export interface TaskConsoleOutput {
  level: LogLevels;
  payload: unknown;
}

export const isLogLevel = defineValidator<LogLevels>(
  isAnyOf(...identity<LogLevels[]>(["debug", "error", "info", "log", "warn"]))
);
const isTaskConsoleOutput = defineValidator<TaskConsoleOutput>(
  isObject({
    level: isLogLevel,
    payload: nocheck,
  })
);

export interface TaskExecutionOutput extends TaskExecutionMessage {
  type: "output";
  output: TaskConsoleOutput;
}

export const isTaskExecutionOutput = defineValidator<TaskExecutionOutput>(
  isObject({
    type: is("output"),
    taskId: isString,
    output: isTaskConsoleOutput,
  })
);

export interface TaskExecutionTerminateSignal extends TaskExecutionMessage {
  type: "terminate";
  result: unknown;
  hasCleanUp: boolean;
}

export const isTaskExecutionTerminateSignal =
  defineValidator<TaskExecutionTerminateSignal>(
    isObject({
      type: is("terminate"),
      taskId: isString,
      result: nocheck,
      hasCleanUp: isBoolean,
    })
  );

export type TaskExecutionSignal =
  | TaskExecutionOutput
  | TaskExecutionTerminateSignal;

export const isCleanUp = (obj: unknown): obj is CleanUp =>
  typeof obj === "function";
export const isScriptRunResultObject = defineValidator<ScriptRunObjectResult>(
  isObject({
    custom: nocheck,
    cleanUp: optional(isCleanUp),
  })
);

export const isScriptRunResult = defineValidator<ScriptRunResult>(
  isUnionThat(isScriptRunResultObject, isCleanUp, isUndefined)
);
