import React, { useState } from "react";
import { AppBar, Box, Tab, Tabs, ThemeProvider } from "@material-ui/core";
import { darkTheme } from "./themes/dark";
import SwipeableViews from "react-swipeable-views";
import { ScriptRunner } from "./pages/script-runner";
import { ScriptManager } from "./pages/script-manager";
import { ModuleManager } from "./pages/module-manager";
import { IntlProvider } from "react-intl";
import {
  useLazyLoadLocaleMessages,
  useLocale,
  useTypedIntl,
} from "./i18n/core/locale";
const theme = darkTheme;
export const App: React.FC = () => {
  const locale = useLocale();
  const messages = useLazyLoadLocaleMessages(locale);
  return !!messages ? (
    <IntlProvider locale={locale} messages={messages}>
      <ThemeProvider theme={theme}>
        <Layout></Layout>
      </ThemeProvider>
    </IntlProvider>
  ) : null;
};
const Layout: React.FC = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const intl = useTypedIntl();
  return (
    <>
      <AppBar position="static" color="default">
        <Tabs
          value={activeTabIndex}
          indicatorColor="primary"
          onChange={(_, index: number) => setActiveTabIndex(index)}
        >
          <Tab label={intl("menu.runScript")} value={0}></Tab>
          <Tab label={intl("menu.manageScript")} value={1}></Tab>
          <Tab label={intl("menu.manageModules")} value={2}></Tab>
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
    </>
  );
};
