import {
  makeStyles,
  Box,
  IconButton,
  colors,
  FormControl,
  InputLabel,
} from "@material-ui/core";
import { RefreshOutlined } from "@material-ui/icons";
import * as R from "ramda";
import React, { useEffect, useState } from "react";
import { noop } from "taio/build/utils/typed-function";
import type { UserScript } from "../../../../models/script";
import { useLoadingPipe } from "../../hooks/use-loading";
import { useTypedIntl } from "../../i18n/core/locale";
import { isNonNullish, setStateEffect } from "../../utils/well-typed";
import styles from "../common/common.module.css";
import type { IPickerProps } from "../common/schema";
import { ListPicker } from "../list-picker";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
  },
  selectControl: {
    margin: theme.spacing(1),
    width: theme.spacing(15),
  },
}));

export interface IScriptPickerProp
  extends IPickerProps<UserScript | undefined> {}

export const ScriptPicker: React.FC<IScriptPickerProp> = ({ onChange }) => {
  const classes = useStyles();
  const intl = useTypedIntl();
  const [scriptList, setScriptList] = useState<UserScript[]>([]);
  const [script, setScript] = useState<UserScript | undefined>(undefined);
  const setFilteredScripts = R.when(
    isNonNullish,
    R.compose(onChange ?? noop, setStateEffect(setScript))
  );
  const [loading, fetchWithLoading] = useLoadingPipe(
    () => SessionInvoker.ScriptService.getList(),
    // TODO: use React.startTransition with React 18
    (newScripts) => {
      setScriptList(newScripts);
      setFilteredScripts(
        newScripts.find((newScript) => newScript.name === script?.name) ??
          newScripts[0]
      );
    }
  );
  useEffect(
    R.pipe(fetchWithLoading, () =>
      window.SessionHubs.on("script-list-update", fetchWithLoading)
    ),
    []
  );
  return (
    <Box className={styles["center-row"]}>
      <IconButton
        style={{ color: colors.green[600] }}
        onClick={fetchWithLoading}
        disabled={loading}
        className={loading ? styles.spinning : undefined}
      >
        <RefreshOutlined></RefreshOutlined>
      </IconButton>
      {script == null ? (
        intl("components.picker.script.empty")
      ) : (
        <FormControl className={classes.selectControl}>
          <InputLabel>{intl("components.picker.script.label")}</InputLabel>
          <ListPicker
            list={scriptList}
            value={script}
            onChange={setFilteredScripts}
            displayMapping={R.prop<"name", UserScript>("name")}
            identity={ListPicker.key("name")}
          ></ListPicker>
        </FormControl>
      )}
    </Box>
  );
};
