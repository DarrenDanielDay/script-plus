import { Box, Button, TextField } from "@material-ui/core";
import { AddOutlined, RefreshOutlined } from "@material-ui/icons";
import React, { useState } from "react";
import { useLoadingPipe } from "../../hooks/use-loading";
import styles from "../common/common.module.css";

export const ModuleManager: React.FC = () => {
  const [moduleId, setModuleId] = useState("");
  const [loading, fire] = useLoadingPipe(
    () =>
      Promise.all([
        SessionInvoker.ScriptService.installPackage(moduleId),
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
        value={moduleId}
        onChange={(e) => setModuleId(e.target.value)}
        label="module identifier"
        helperText="npm package name, e.g. glob"
        disabled={loading}
      ></TextField>
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
    </Box>
  );
};
