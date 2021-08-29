import {
  Box,
  colors,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@material-ui/core";
import * as R from "ramda";
import {
  AddOutlined,
  DeleteOutline,
  EditOutlined,
  LaunchOutlined,
  RefreshOutlined,
  SaveAlt,
} from "@material-ui/icons";
import React, { useEffect, useState } from "react";
import type { UserScript } from "../../../../models/script";
import { ParameterEditor } from "../../components/parameter-editor";
import { setStateEffect } from "../../utils/well-typed";
import { useLoadingPipe } from "../../hooks/use-loading";
import { ListPicker } from "../../components/list-picker";
import { useStyles } from "../../components/common/common-mui-styles";
import classNames from "classnames";
import styles from "../../components/common/common.module.css";

export interface IScriptManagerProp {}

export const ScriptManager: React.FC<IScriptManagerProp> = ({}) => {
  const classes = useStyles();
  const theme = useTheme();
  const [scripts, setScripts] = useState<UserScript[]>([]);
  const [editingScript, setEditingScript] = useState<UserScript | undefined>();
  const [loading, fetchScripts] = useLoadingPipe(
    () => SessionInvoker.ScriptService.getList(),
    R.pipe(
      setStateEffect(setScripts),
      R.tap((scripts) => setEditingScript(scripts[0]))
    )
  );
  useEffect(R.pipe(fetchScripts, R.always(undefined)), []);
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptLang, setNewScriptLang] = useState<UserScript["lang"]>("ts");
  return (
    <Box>
      <Box className={styles["center-row"]}>
        <Tooltip title="import scripts">
          <IconButton
            style={{ color: theme.palette.primary.main }}
            onClick={() => SessionInvoker.ScriptService.import()}
          >
            <SaveAlt />
          </IconButton>
        </Tooltip>
        <Tooltip title="refresh list">
          <IconButton
            style={{ color: colors.green[500] }}
            onClick={fetchScripts}
            className={loading ? styles.spinning : undefined}
          >
            <RefreshOutlined></RefreshOutlined>
          </IconButton>
        </Tooltip>
        <FormControl
          className={classNames(classes.selectControl, classes.formControl)}
        >
          <InputLabel>script name</InputLabel>
          <ListPicker
            list={scripts}
            value={editingScript}
            onChange={setEditingScript}
            displayMapping={R.prop<"name", UserScript>("name")}
          ></ListPicker>
        </FormControl>
        <Tooltip title="delete">
          <IconButton
            style={{ color: colors.red[500] }}
            onClick={async () => {
              if (!editingScript) return;
              const result =
                await SessionInvoker.vscode.window.showWarningMessage(
                  `Are you sure to delete script "${editingScript.name}" ? It will be permanently lost!`,
                  { modal: true },
                  { title: "Yes" },
                  { title: "No" }
                );
              if (result?.title === "Yes") {
                await SessionInvoker.ScriptService.delete(editingScript);
                await fetchScripts();
              }
            }}
          >
            <DeleteOutline></DeleteOutline>
          </IconButton>
        </Tooltip>
        <Tooltip title="edit">
          <IconButton
            style={{ color: colors.amber[500] }}
            onClick={() =>
              editingScript &&
              SessionInvoker.ScriptService.editScript(editingScript)
            }
          >
            <EditOutlined></EditOutlined>
          </IconButton>
        </Tooltip>
        <Tooltip title="export">
          <IconButton
            style={{ color: colors.green[500] }}
            onClick={() =>
              editingScript &&
              SessionInvoker.ScriptService.export(editingScript)
            }
          >
            <LaunchOutlined></LaunchOutlined>
          </IconButton>
        </Tooltip>
      </Box>
      <Box className={styles["center-row"]}>
        <TextField
          value={newScriptName}
          onChange={(e) => setNewScriptName(e.target.value)}
          label="new script name"
        ></TextField>
        <FormControl
          className={classNames(classes.selectControl, classes.formControl)}
        >
          <InputLabel>language</InputLabel>
          <ListPicker
            list={R.identity<UserScript["lang"][]>(["ts", "js"])}
            value={newScriptLang}
            onChange={setNewScriptLang}
            displayMapping={R.identity}
          ></ListPicker>
        </FormControl>
        <IconButton
          color="primary"
          disabled={!newScriptName}
          onClick={R.pipe(
            R.always({
              argumentConfig: {},
              description: "",
              lang: newScriptLang,
              name: newScriptName,
            }),
            R.tap(async (script) => {
              await SessionInvoker.ScriptService.create(script);
              const newScripts = await fetchScripts();
              setEditingScript(newScripts.find(R.propEq("name", script.name)));
            })
          )}
        >
          <AddOutlined></AddOutlined>
        </IconButton>
      </Box>
      <Box position="relative">
        {!!editingScript && (
          <>
            <Typography variant="h6">
              Edit config of script "{editingScript.name}"
            </Typography>
            <Divider style={{ margin: `${theme.spacing(2)}px 0` }}></Divider>
            <ParameterEditor
              onDone={(config, description) => {
                SessionInvoker.ScriptService.updateScript({
                  ...editingScript,
                  description,
                  argumentConfig: config,
                });
              }}
              configObject={editingScript.argumentConfig}
            ></ParameterEditor>
          </>
        )}
      </Box>
    </Box>
  );
};
