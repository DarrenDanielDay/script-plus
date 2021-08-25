import React, { useEffect, useState } from "react";
import * as R from "ramda";
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme,
} from "@material-ui/core";
import type {
  ArgumentConfig,
  ArgumentField,
  PassedParameter,
  UserScript,
} from "../../../../models/script";
import { ParameterInput } from "../../components/parameter-input";
import { ScriptPicker } from "../../components/script-picker";
import { setStateEffect } from "../../utils/well-typed";
import { noop } from "taio/build/utils/typed-function";
import { ExpandMore, PlayArrowRounded } from "@material-ui/icons";
import type {
  ExecutionTask,
  TaskConsoleOutput,
} from "../../../../models/execution-task";
import styles from "../../components/common/common.module.css";

export interface IScriptRunnerProp {}

export const ScriptRunner: React.FC<IScriptRunnerProp> = ({}) => {
  const theme = useTheme();
  const [script, setScript] = useState<UserScript | undefined>();
  const [argument, setArgument] = useState<PassedParameter>({});
  const [running, setRunning] = useState(false);
  const [outputs, setOutputs] = useState<TaskConsoleOutput[]>([]);
  const [exectionTask, setExectionTask] = useState<ExecutionTask | undefined>();
  useEffect(
    !script
      ? noop
      : R.pipe(
          R.always(undefined),
          setStateEffect(setExectionTask),
          R.always(script),
          R.prop<"argumentConfig", UserScript>("argumentConfig"),
          R.map<ArgumentConfig, PassedParameter>(
            R.prop<"defaultValue", ArgumentField>("defaultValue")
          ),
          setStateEffect(setArgument),
          noop
        ),
    [script]
  );
  useEffect(
    !exectionTask || !running
      ? noop
      : R.pipe(R.always(exectionTask), (task) =>
          SessionHubs.on("task", (value) => {
            if (task.taskId !== value.taskId) return;
            if (value.type === "terminate") {
              setRunning(false);
              return;
            }
            if (value.type === "output") {
              setOutputs((outputs) => [...outputs, value.output]);
              return;
            }
          })
        ),
    [running, exectionTask]
  );
  return (
    <Box>
      <ScriptPicker value={script} onChange={setScript}></ScriptPicker>
      {!!script && (
        <>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>{script.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ParameterInput
                arugmentConfig={script.argumentConfig}
                value={argument}
                onChange={setArgument}
              ></ParameterInput>
            </AccordionDetails>
            <AccordionActions>
              <Button
                startIcon={
                  running ? (
                    <CircularProgress size={theme.spacing(1.5)} />
                  ) : (
                    <PlayArrowRounded />
                  )
                }
                disabled={running}
                style={{ color: theme.palette.primary.main }}
                onClick={async () => {
                  setOutputs([]);
                  const task = await SessionInvoker.ScriptService.execute(
                    script,
                    argument
                  );
                  setRunning(true);
                  setExectionTask(task);
                }}
              >
                Run
              </Button>
            </AccordionActions>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Console</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <div className={styles["max-width"]}>
                {outputs.map((val, i) => {
                  return (
                    <div
                      style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                      key={i}
                    >
                      <Typography variant="h6" display="block" gutterBottom>
                        [ {val.level.toUpperCase()} ]{": "}
                        {Array.isArray(val.payload)
                          ? val.payload
                              .map((v) =>
                                typeof v === "string"
                                  ? v
                                  : JSON.stringify(v, undefined, 2)
                              )
                              .join(", ")
                          : JSON.stringify(val.payload, undefined, 2)}
                      </Typography>
                    </div>
                  );
                })}
              </div>
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </Box>
  );
};
