import React, { useState } from "react";
import { AppBar, Box, Tab, Tabs, ThemeProvider } from "@material-ui/core";
import { darkTheme } from "./themes/dark";
import SwipeableViews from "react-swipeable-views";
import { ScriptRunner } from "./components/script-runner";
import { ScriptManager } from "./components/script-manager";

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
        </Tabs>
      </AppBar>
      <SwipeableViews index={activeTabIndex} onChangeIndex={setActiveTabIndex}>
        <Box>
          <ScriptRunner></ScriptRunner>
        </Box>
        <Box position="relative">
          <ScriptManager></ScriptManager>
        </Box>
      </SwipeableViews>
    </ThemeProvider>
  );
};
