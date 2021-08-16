import React, { useEffect, useState } from "react";
import * as R from "ramda";
import { Box } from "@material-ui/core";
import type {
  ArgumentConfig,
  ArgumentField,
  PassedParameter,
  UserScript,
} from "../../../../models/script";
import { ParameterInput } from "../parameter-input";
import { ScriptPicker } from "../script-picker";
import { setStateEffect } from "../../utils/well-typed";
import { noop } from "taio/build/utils/typed-function";

export interface IScriptRunnerProp {}

export const ScriptRunner: React.FC<IScriptRunnerProp> = ({}) => {
  const [script, setScript] = useState<UserScript | undefined>();
  const [argument, setArgument] = useState<PassedParameter>({});
  useEffect(
    !script
      ? noop
      : R.pipe(
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
  const { argumentConfig } = script || {};

  return (
    <Box>
      <ScriptPicker value={script} onChange={setScript}></ScriptPicker>
      {!!argumentConfig && (
        <ParameterInput
          arugmentConfig={argumentConfig}
          value={argument}
          onChange={setArgument}
        ></ParameterInput>
      )}
    </Box>
  );
};
