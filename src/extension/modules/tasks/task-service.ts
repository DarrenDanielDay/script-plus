import { TypedObject } from "taio/build/libs/typescript/object";
import type { Func } from "taio/build/types/concepts";
import type { WithoutKey } from "taio/build/types/object";
import { impossible } from "../../errors/internal-error";
import { createPromiseHandler, keyIn } from "../../utils";
import type {
  AsyncResult,
  PromiseHandler,
} from "../../../common/types/promise";
import { randomString } from "../../utils/node-utils";
export enum TaskState {
  Pending = 0,
  Running = 1,
  Aborted = 2,
  Done = 3,
}
export interface Task<S> {
  data?: S;
  taskId: string;
  state: TaskState;
}
export interface TaskService<P, T, R> {
  create(param: P): Promise<string>;
  getTasks(): Promise<Task<T>[]>;
  killTask(id: string, reason: string): Promise<void>;
  waitForResult(id: string): Promise<R>;
}

export function createTaskService<P, S, R>(
  factory: Func<[P, PromiseHandler<R>], AsyncResult<S>>,
  terminator: Func<[Task<S>], AsyncResult<void>>
): TaskService<P, S, R> {
  const tasks = new Map<string, Task<S>>();
  const promises = new Map<string, [Promise<R>, PromiseHandler<R>]>();
  function drop(id: string) {
    promises.delete(id);
    tasks.delete(id);
  }
  const taskService: TaskService<P, S, R> = {
    async create(param) {
      let id = randomString(8);
      while (tasks.has(id)) {
        id = randomString(8);
      }
      const task: WithoutKey<Task<S>, "taskId"> = { state: TaskState.Pending };
      TypedObject.defineProperty(task, keyIn<Task<S>>()("taskId"), {
        writable: false,
        value: id,
      });
      task.state = TaskState.Pending;
      tasks.set(id, task);
      const [handler, promise] = createPromiseHandler<R>();
      const done = (result: R) => {
        process.nextTick(() => {
          task.state = TaskState.Done;
          handler.resolve(result);
          drop(id);
        });
      };
      const abort = (error: unknown) => {
        process.nextTick(() => {
          task.state = TaskState.Aborted;
          handler.reject(error);
          drop(id);
        });
      };
      (async () => {
        const data = await factory(param, { resolve: done, reject: abort });
        task.data = data;
        task.state = TaskState.Running;
      })();
      promises.set(id, [promise, handler]);
      return id;
    },
    async getTasks() {
      return [...tasks].map(([, v]) => v);
    },
    async killTask(id, reason) {
      const task = tasks.get(id);
      if (!task) {
        return;
      }
      task.state = TaskState.Aborted;
      await terminator(task);
      const [, handler] = promises.get(id) ?? [];
      handler?.reject(reason);
      tasks.delete(id);
    },
    async waitForResult(id) {
      return (
        promises.get(id)?.[0] ?? impossible(`Task id "${id}" does not exist.`)
      );
    },
  };
  return taskService;
}
