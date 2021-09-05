import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  useTheme,
  Checkbox,
  FormControlLabel,
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
import { Skeleton } from "../../components/skeleton";
import { EnumPicker } from "../../components/enum-picker";
import { InstallPosition } from "../../../../models/configurations";
import type { Mapper } from "taio/build/types/concepts";
import type { ScriptPlusConfig } from "../../../../configs/user-config";
export const ModuleManager: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const moduleIdInput$ = useRef<Subject<string>>();
  const [moduleId, setModuleId] = useState("");
  const [versions, setVersions] = useState<string[]>([]);
  const [version, setVersion] = useState("");
  const [includeTypes, setIncludeTypes] = useState(true);
  const [installPosition, setInstallPosition] = useState(InstallPosition.Local);
  const [installing, install] = useLoadingPipe(
    () => {
      const packagePromise = SessionInvoker.ScriptService.installPackage(
        moduleId,
        version,
        { global: installPosition === InstallPosition.Global }
      );
      const typesPromise = includeTypes
        ? SessionInvoker.ScriptService.installPackage(`@types/${moduleId}`, "")
        : Promise.resolve();
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
  const [configLoading, getConfig] = useLoadingPipe(
    () => SessionInvoker.ConfigService.getConfigs(),
    R.pipe(
      R.identity<Mapper<ScriptPlusConfig, ScriptPlusConfig>>(R.identity),
      R.tap((config) => setIncludeTypes(config.packages.installTypes)),
      R.tap((config) => setInstallPosition(config.packages.installPosition))
    )
  );
  useEffect(() => {
    getConfig();
    moduleIdInput$.current = new Subject<string>();
    const moduleIdInput$$ = moduleIdInput$.current
      .pipe(debounceTime(1000), filter(isString))
      .subscribe((moduleId) => getVersions(moduleId));
    const configChangeSubscribeCleanUp = SessionHubs.on(
      "config",
      ({ fullConfig }) => {
        setIncludeTypes(fullConfig.packages.installTypes);
        setInstallPosition(fullConfig.packages.installPosition);
      }
    );
    return () => {
      moduleIdInput$$.unsubscribe();
      configChangeSubscribeCleanUp();
    };
  }, []);
  return configLoading ? null : (
    <Box>
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
            <Skeleton width={100} height={theme.spacing(6)}></Skeleton>
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
            onClick={install}
            disabled={installing || !moduleId}
            style={{ color: theme.palette.primary.main }}
            startIcon={
              installing ? (
                <RefreshOutlined className={styles.spinning}></RefreshOutlined>
              ) : (
                <AddOutlined></AddOutlined>
              )
            }
          >
            {installing ? "Installing" : "Install"}
          </Button>
        </FormControl>
      </Box>
      <Box>
        <FormControl
          className={classNames(classes.formControl, classes.selectControl)}
        >
          <FormLabel>Install scope</FormLabel>
          <EnumPicker
            value={installPosition}
            onChange={(position) =>
              SessionInvoker.ConfigService.updateConfigs({
                packages: { installPosition: position },
              })
            }
            enumObject={InstallPosition}
            enumNameMapping={{
              [InstallPosition.Local]: "extension",
              [InstallPosition.Global]: "global",
            }}
          ></EnumPicker>
        </FormControl>
        {moduleId && (
          <FormControl className={classes.formControl}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeTypes}
                  onChange={(e) => {
                    SessionInvoker.ConfigService.updateConfigs({
                      packages: { installTypes: e.target.checked },
                    });
                  }}
                ></Checkbox>
              }
              label={`also install @types/${moduleId} for typings`}
            ></FormControlLabel>
          </FormControl>
        )}
      </Box>
    </Box>
  );
};
