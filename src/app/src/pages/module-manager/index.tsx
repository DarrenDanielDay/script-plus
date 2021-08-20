import { Box, Button, FormControl, TextField } from "@material-ui/core";
import { AddOutlined, RefreshOutlined } from "@material-ui/icons";
import React, { useState } from "react";
import { useLoadingPipe } from "../../hooks/use-loading";
import { useStyles } from "../../components/common/common-mui-styles";
import styles from "../../components/common/common.module.css";

export const ModuleManager: React.FC = () => {
  const classes = useStyles();
  const [moduleId, setModuleId] = useState("");
  const [loading, fire] = useLoadingPipe(
    () =>
      Promise.all([
        SessionInvoker.ScriptService.installPackage(moduleId, { global: true }),
        SessionInvoker.ScriptService.installPackage(`@types/${moduleId}`),
      ]),
    () => {
      SessionInvoker.vscode.window.showInformationMessage(
        `Module "${moduleId}" installed`,
        {}
      );
    }
  );
  return (
    <Box className={styles["center-row"]}>
      <TextField
        className={classes.formControl}
        value={moduleId}
        onChange={(e) => setModuleId(e.target.value)}
        label="package/module identifier"
        placeholder="example: glob@latest"
        helperText="The package will be installed globally. Version specifier is optional."
        disabled={loading}
      ></TextField>
      <FormControl className={classes.formControl}>
        <Button
          color="primary"
          variant="outlined"
          onClick={fire}
          disabled={loading || !moduleId}
          startIcon={
            loading ? (
              <RefreshOutlined className={styles.spinning}></RefreshOutlined>
            ) : (
              <AddOutlined></AddOutlined>
            )
          }
        >
          Install
        </Button>
      </FormControl>
    </Box>
  );
};
