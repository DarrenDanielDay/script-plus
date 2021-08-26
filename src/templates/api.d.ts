type CleanUp = () => void | Promise<void>;

export interface ScriptRunObjectResult {
  custom?: unknown;
  cleanUp?: CleanUp;
}

export type ScriptRunResult = CleanUp | ScriptRunObjectResult | void;
