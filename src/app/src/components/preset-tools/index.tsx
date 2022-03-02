import {
  Box,
  FormGroup,
  FormControl,
  FormLabel,
  TextField,
  IconButton,
  InputLabel,
  colors,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@material-ui/core";
import {
  Check,
  Close,
  DeleteOutlined,
  LaunchOutlined,
  SaveOutlined,
} from "@material-ui/icons";
import * as R from "ramda";
import React, { useEffect, useState } from "react";
import { noop } from "taio/build/utils/typed-function";
import { createFutureValue } from "../../../../common/shared-utils";
import type {
  PassedParameter,
  PresetArgument,
  UserScript,
} from "../../../../models/script";
import { useTypedIntl } from "../../i18n/core/locale";
import { setStateEffect } from "../../utils/well-typed";
import { useStyles } from "../common/common-mui-styles";
import { ListPicker } from "../list-picker";

interface SaveArgumentsPayload {
  name: string;
}

interface ISaveArgumentsModalProps {
  open: boolean;
  onSave: (payload: SaveArgumentsPayload) => void;
  onCancel: () => void;
}

const SaveArgumentsModal: React.FC<ISaveArgumentsModalProps> = ({
  open,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const intl = useTypedIntl();
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{intl("runner.preset.save.title")}</DialogTitle>
      <DialogContent>
        <FormGroup>
          <FormControl>
            <FormLabel>{intl("runner.preset.save.name")}</FormLabel>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              helperText={intl("runner.preset.save.help")}
            />
          </FormControl>
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <IconButton color="primary" onClick={onCancel}>
          <Close />
        </IconButton>
        <IconButton
          color="primary"
          onClick={() => {
            onSave({ name });
          }}
        >
          <Check />
        </IconButton>
      </DialogActions>
    </Dialog>
  );
};

export interface IPresetToolsProp {
  script: UserScript;
  currentArguments: PassedParameter;
  onLoadPreset: (preset: PresetArgument) => void;
}

export const PresetTools: React.FC<IPresetToolsProp> = ({
  script,
  currentArguments,
  onLoadPreset,
}) => {
  const classes = useStyles();
  const intl = useTypedIntl();
  const presets = script.presetArgs ?? [];
  const [presetSelectValue, setPresetSelectValue] = useState<
    PresetArgument | undefined
  >();
  useEffect(() => {
    setPresetSelectValue((previous) =>
      script.presetArgs?.find((preset) => preset.name === previous?.name)
    );
  }, [script]);
  useEffect(() => {
    presetSelectValue && onLoadPreset(presetSelectValue);
  }, [presetSelectValue]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(() =>
    createFutureValue<SaveArgumentsPayload>()
  );

  const askForSave = () => {
    const newPending = createFutureValue<SaveArgumentsPayload>();
    setPending(newPending);
    setOpen(true);
    return newPending.promise;
  };
  return (
    <Box>
      <SaveArgumentsModal
        open={open}
        onSave={R.pipe(pending.done, R.F, setStateEffect(setOpen))}
        onCancel={R.pipe(R.F, setStateEffect(setOpen), pending.abort)}
      />
      {!!presets.length && (
        <FormControl className={classes.selectControl}>
          <InputLabel>{intl("runner.preset.label")}</InputLabel>
          <ListPicker
            list={presets}
            displayMapping={(arg) => arg.name}
            identity={(a, b) => a.name === b.name}
            value={presetSelectValue}
            onChange={setPresetSelectValue}
          />
        </FormControl>
      )}
      {!!presetSelectValue && (
        <>
          <IconButton
            style={{ color: colors.amber[400] }}
            onClick={() =>
              window.SessionInvoker.ScriptService.updateScript({
                ...script,
                presetArgs: presets.map((preset) =>
                  preset.name === presetSelectValue.name
                    ? {
                        ...preset,
                        args: currentArguments,
                      }
                    : preset
                ),
              })
            }
          >
            <SaveOutlined />
          </IconButton>
          <IconButton
            style={{ color: colors.red[500] }}
            onClick={() =>
              window.SessionInvoker.ScriptService.updateScript({
                ...script,
                presetArgs: presets.filter(
                  (preset) => preset.name !== presetSelectValue!.name
                ),
              })
            }
          >
            <DeleteOutlined />
          </IconButton>
        </>
      )}
      {!!Object.keys(currentArguments).length && (
        <Tooltip title={intl("runner.preset.save.as")}>
          <IconButton
            style={{ color: colors.blue[500] }}
            onClick={() =>
              askForSave()
                .then(({ name }) => {
                  window.SessionInvoker.ScriptService.updateScript({
                    ...script,
                    presetArgs: [
                      ...presets,
                      {
                        name,
                        args: currentArguments,
                      },
                    ],
                  });
                })
                .catch(noop)
            }
          >
            <LaunchOutlined />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
