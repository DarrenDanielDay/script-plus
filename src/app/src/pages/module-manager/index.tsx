import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  CircularProgress,
  useTheme,
} from "@material-ui/core";
import { AddOutlined, RefreshOutlined } from "@material-ui/icons";
import React, { useEffect, useRef, useState } from "react";
import { useLoadingPipe } from "../../hooks/use-loading";
import { useStyles } from "../../components/common/common-mui-styles";
import styles from "../../components/common/common.module.css";
import { ListPicker } from "../../components/list-picker";
import * as R from "ramda";
import { debounceTime, filter, Subject } from "rxjs";
import classNames from "classnames";
import { isString } from "taio/build/utils/validator/primitive";

export const ModuleManager: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const moduleIdInput$ = useRef<Subject<string>>();
  const [moduleId, setModuleId] = useState("");
  const [versions, setVersions] = useState<string[]>([]);
  const [version, setVersion] = useState("");
  const [loading, fire] = useLoadingPipe(
    () => {
      const packagePromise = SessionInvoker.ScriptService.installPackage(
        moduleId,
        version,
        { global: true }
      );
      const typesPromise = moduleId.startsWith("@types")
        ? Promise.resolve()
        : SessionInvoker.ScriptService.installPackage(`@types/${moduleId}`, "");
      return Promise.all([packagePromise, typesPromise]);
    },
    () => {
      SessionInvoker.vscode.window.showInformationMessage(
        `Module "${moduleId}" installed`,
        {}
      );
    }
  );
  const [versionSearching, getVersions] = useLoadingPipe(
    async (moduleId: string) =>
      moduleId ? SessionInvoker.ScriptService.listVersions(moduleId) : [],
    setVersions
  );
  useEffect(() => {
    moduleIdInput$.current = new Subject<string>();
    const moduleIdInput$$ = moduleIdInput$.current
      .pipe(debounceTime(1000), filter(isString))
      .subscribe((moduleId) => getVersions(moduleId));
    return () => moduleIdInput$$.unsubscribe();
  }, []);
  return (
    <Box className={styles["center-row"]}>
      <FormControl className={classes.formControl}>
        <FormLabel>npm package/module name</FormLabel>
        <Input
          value={moduleId}
          onChange={(e) => {
            setModuleId(e.target.value);
            moduleIdInput$.current?.next(e.target.value);
          }}
        ></Input>
      </FormControl>
      <FormControl
        className={classNames(classes.formControl, classes.selectControl)}
      >
        <FormLabel>version</FormLabel>
        {versionSearching ? (
          <CircularProgress />
        ) : (
          <ListPicker
            value={version}
            onChange={setVersion}
            list={versions}
            displayMapping={R.identity}
          ></ListPicker>
        )}
      </FormControl>
      <FormControl className={classes.formControl}>
        <Button
          color="primary"
          variant="outlined"
          onClick={fire}
          disabled={loading || !moduleId}
          style={{ color: theme.palette.primary.main }}
          startIcon={
            loading ? (
              <RefreshOutlined className={styles.spinning}></RefreshOutlined>
            ) : (
              <AddOutlined></AddOutlined>
            )
          }
        >
          {loading ? "Installing" : "Install"}
        </Button>
      </FormControl>
    </Box>
  );
};
