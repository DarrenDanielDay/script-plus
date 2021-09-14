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
  colors,
  Tooltip,
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
import {
  ClearAll,
  ExpandMore,
  PlayArrowRounded,
  Queue,
} from "@material-ui/icons";
import type {
  ExecutionTask,
  TaskConsoleOutput,
} from "../../../../models/execution-task";
import styles from "../../components/common/common.module.css";
import { useLoadingPipe } from "../../hooks/use-loading";
import { useTypedIntl } from "../../i18n/core/locale";
import { getDisplay } from "../../../../common/object-display";

export interface IScriptRunnerProp {}

export const ScriptRunner: React.FC<IScriptRunnerProp> = ({}) => {
  const theme = useTheme();
  const intl = useTypedIntl();
  const [script, setScript] = useState<UserScript | undefined>();
  const [argument, setArgument] = useState<PassedParameter>({});
  const [running, setRunning] = useState(false);
  const [outputs, setOutputs] = useState<TaskConsoleOutput[]>([]);
  const [exectionTask, setExectionTask] = useState<ExecutionTask | undefined>();
  const [cleaning, cleanUp] = useLoadingPipe(async () => {
    const taskId = exectionTask?.taskId;
    if (taskId) {
      await SessionInvoker.ScriptService.cleanUp(taskId);
    }
  }, noop);
  const cleanTask = async () => {
    await cleanUp();
    setExectionTask(undefined);
    setOutputs([]);
  };
  const mountTask = async (taskId: string) => {
    await window.SessionInvoker.ScriptService.mountTask(taskId);
    setExectionTask(undefined);
    setOutputs([]);
  };
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
              if (!value.hasCleanUp) {
                setExectionTask(undefined);
              }
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
                  running || cleaning ? (
                    <CircularProgress size={theme.spacing(1.5)} />
                  ) : (
                    <PlayArrowRounded />
                  )
                }
                disabled={running || cleaning}
                style={{ color: theme.palette.primary.main }}
                onClick={async () => {
                  await cleanTask();
                  const task = await SessionInvoker.ScriptService.execute(
                    script,
                    argument
                  );
                  setRunning(true);
                  setExectionTask(task);
                }}
              >
                {cleaning
                  ? intl("runner.run.cleaning")
                  : running
                  ? intl("runner.run.running")
                  : intl("runner.run.apply")}
              </Button>
            </AccordionActions>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>{intl("runner.console.title")}</Typography>
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
                          ? val.payload.map((v) => getDisplay(v)).join(", ")
                          : getDisplay(val)}
                      </Typography>
                    </div>
                  );
                })}
              </div>
            </AccordionDetails>
            <AccordionActions>
              <Tooltip title={intl("runner.mount.tooltip")}>
                <Button
                  style={{ color: colors.yellow[400] }}
                  startIcon={<Queue />}
                  onClick={() => exectionTask && mountTask(exectionTask.taskId)}
                  disabled={cleaning || running}
                >
                  {intl("runner.mount.button")}
                </Button>
              </Tooltip>
              <Button
                color="secondary"
                startIcon={<ClearAll />}
                onClick={cleanTask}
                disabled={cleaning || running}
              >
                {cleaning
                  ? intl("runner.cleanUp.cleaning")
                  : intl("runner.cleanUp.apply")}
              </Button>
            </AccordionActions>
          </Accordion>
        </>
      )}
    </Box>
  );
};
