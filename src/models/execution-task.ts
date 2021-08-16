import { isObject } from "taio/build/utils/validator/object";
import { isString } from "taio/build/utils/validator/primitive";
import { defineValidator } from "taio/build/utils/validator/utils";

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
