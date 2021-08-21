import { typed } from "taio/build/utils/typed-function";
import { isAnyOf } from "taio/build/utils/validator/array";
import { isObject } from "taio/build/utils/validator/object";
import { isString } from "taio/build/utils/validator/primitive";
import { defineValidator, is } from "taio/build/utils/validator/utils";

export interface ExecutionTask {
  taskId: string;
  taskName: string;
}

export const isExecutionTask = defineValidator<ExecutionTask>(
  isObject({
    taskId: isString,
    taskName: isString,
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
  isAnyOf(...typed<LogLevels[]>(["debug", "error", "info", "log", "warn"]))
);
const isTaskConsoleOutput = defineValidator<TaskConsoleOutput>(
  isObject({
    level: isLogLevel,
    payload: (obj): obj is unknown => !obj || !!obj,
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
}

export const isTaskExecutionTerminateSignal =
  defineValidator<TaskExecutionTerminateSignal>(
    isObject({
      type: is("terminate"),
      taskId: isString,
    })
  );

export type TaskExecutionSignal =
  | TaskExecutionOutput
  | TaskExecutionTerminateSignal;
