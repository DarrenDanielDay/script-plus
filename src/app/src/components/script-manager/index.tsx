import {
  Box,
  colors,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  TextField,
  Typography,
  useTheme,
} from "@material-ui/core";
import * as R from "ramda";
import {
  AddOutlined,
  DeleteOutline,
  RefreshOutlined,
} from "@material-ui/icons";
import React, { useEffect, useState } from "react";
import type { UserScript } from "../../../../models/script";
import { ParameterEditor } from "../parameter-editor";
import { setStateEffect } from "../../utils/well-typed";
import { useLoadingPipe } from "../../hooks/use-loading";
import { ListPicker } from "../list-picker";
import styles from "../common/common.module.css";
import { useStyles } from "../common/common-mui-styles";
import classNames from "classnames";

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
      R.always(undefined),
      setStateEffect(setEditingScript)
    )
  );
  useEffect(R.pipe(fetchScripts, R.always(undefined)), []);
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptLang, setNewScriptLang] = useState<UserScript["lang"]>("ts");
  return (
    <Box>
      <Box className={styles["center-row"]}>
        <IconButton
          style={{ color: colors.green[500] }}
          onClick={fetchScripts}
          className={loading ? styles.spinning : undefined}
        >
          <RefreshOutlined></RefreshOutlined>
        </IconButton>
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
        <IconButton
          style={{ color: colors.red[500] }}
          onClick={() =>
            editingScript &&
            SessionInvoker.ScriptService.delete(editingScript).then(
              fetchScripts
            )
          }
        >
          <DeleteOutline></DeleteOutline>
        </IconButton>
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
            R.tap((script) =>
              SessionInvoker.ScriptService.create(script).then(fetchScripts)
            )
          )}
        >
          <AddOutlined></AddOutlined>
        </IconButton>
      </Box>
      <Box>
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
