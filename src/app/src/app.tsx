import React from "react";
import { ThemeProvider } from "@material-ui/core";
import { ParameterEditor } from "./components/parameter-editor";
import { darkTheme } from "./themes/dark";

const theme = darkTheme;

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <ParameterEditor></ParameterEditor>
    </ThemeProvider>
  );
};
