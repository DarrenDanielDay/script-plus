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
  Typography,
  Divider,
} from "@material-ui/core";
import {
  Autorenew,
  Check,
  Close,
  DeleteOutlined,
  LaunchOutlined,
  SaveOutlined,
} from "@material-ui/icons";
import * as R from "ramda";
import React, { useEffect, useState } from "react";
import { noop } from "taio/build/utils/typed-function";
import type {
  PassedParameter,
  PresetArgument,
  UserScript,
} from "../../../../models/script";
import type { ConfigScope } from "../../../../types/public-api";
import { IPromoteModalProps, usePromote } from "../../hooks/use-promote";
import { useTypedIntl } from "../../i18n/core/locale";
import { useStyles } from "../common/common-mui-styles";
import { ListPicker } from "../list-picker";

interface SaveArgumentsPayload {
  name: string;
}
interface ISaveArgumentsModalProps
  extends IPromoteModalProps<SaveArgumentsPayload> {}

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

interface ISaveAutoScriptPayload {
  parameter: string | false;
  scope: ConfigScope;
}
const scopes: ConfigScope[] = ["Global", "Workspace", "WorkspaceFolder"];
interface ISaveAutoScriptModal
  extends IPromoteModalProps<ISaveAutoScriptPayload> {}

const SaveAutoScriptModal: React.FC<ISaveAutoScriptModal> = ({
  open,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<ConfigScope>("Workspace");
  const intl = useTypedIntl();
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{intl("runner.preset.auto.title")}</DialogTitle>
      <DialogContent>
        <Typography>{intl("runner.preset.auto.description")}</Typography>
        <Divider></Divider>
        <FormGroup>
          <TextField
            label={intl("runner.preset.auto.name.label")}
            value={name}
            variant="outlined"
            onChange={(e) => setName(e.target.value)}
            helperText={intl("runner.preset.auto.name.hint")}
          />
          <Divider></Divider>
          <FormControl>
            <FormLabel>{intl("runner.preset.auto.scope")}</FormLabel>
            <ListPicker
              value={scope}
              onChange={setScope}
              displayMapping={R.identity}
              list={scopes}
            ></ListPicker>
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
            onSave({ scope, parameter: name ? name : false });
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
  const savePreset = usePromote(SaveArgumentsModal);
  const saveAuto = usePromote(SaveAutoScriptModal);
  return (
    <Box>
      {savePreset.view}
      {saveAuto.view}
      {!!presets.length && (
        <FormControl className={classes.selectControl}>
          <InputLabel>{intl("runner.preset.label")}</InputLabel>
          <ListPicker
            list={presets}
            displayMapping={(arg) => arg.name}
            identity={ListPicker.key("name")}
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
              savePreset
                .askForSave()
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
      <Tooltip title={intl("runner.preset.auto.title")}>
        <IconButton
          style={{ color: colors.blue[500] }}
          onClick={async () => {
            const { parameter, scope } = await saveAuto.askForSave();
            if (parameter) {
              await window.SessionInvoker.ScriptService.updateScript({
                ...script,
                presetArgs: [
                  ...presets,
                  {
                    name: parameter,
                    args: currentArguments,
                  },
                ],
              });
            }
            const currentAutoScripts =
              await window.SessionInvoker.ScriptService.getAutoList();
            await window.SessionInvoker.ScriptService.updateAutoScripts(
              [
                ...currentAutoScripts,
                {
                  parameter: parameter ? parameter : currentArguments,
                  script: script.name,
                },
              ],
              scope
            );
          }}
        >
          <Autorenew />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
