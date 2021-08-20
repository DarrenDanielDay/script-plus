import React, { useState } from "react";
import { AppBar, Box, Tab, Tabs, ThemeProvider } from "@material-ui/core";
import { darkTheme } from "./themes/dark";
import SwipeableViews from "react-swipeable-views";
import { ScriptRunner } from "./pages/script-runner";
import { ScriptManager } from "./pages/script-manager";
import { ModuleManager } from "./pages/module-manager";

const theme = darkTheme;

export const App: React.FC = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" color="default">
        <Tabs
          value={activeTabIndex}
          indicatorColor="primary"
          onChange={(_, index: number) => setActiveTabIndex(index)}
        >
          <Tab label="run script" value={0}></Tab>
          <Tab label="manage script" value={1}></Tab>
          <Tab label="manage modules" value={2}></Tab>
        </Tabs>
      </AppBar>
      <SwipeableViews index={activeTabIndex} onChangeIndex={setActiveTabIndex}>
        <Box>
          <ScriptRunner></ScriptRunner>
        </Box>
        <Box>
          <ScriptManager></ScriptManager>
        </Box>
        <Box>
          <ModuleManager></ModuleManager>
        </Box>
      </SwipeableViews>
    </ThemeProvider>
  );
};
