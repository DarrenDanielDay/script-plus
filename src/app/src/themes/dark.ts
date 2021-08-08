import { createMuiTheme } from "@material-ui/core";

export const darkTheme = createMuiTheme({
  palette: {
    common: { black: "rgba(0, 0, 0, 1)", white: "#fff" },
    background: {
      paper: "rgba(37, 37, 38, 1)",
      default: "rgba(255, 255, 255, 1)",
    },
    primary: {
      light: "rgba(110, 198, 255, 1)",
      main: "rgba(0, 159, 255, 1)",
      dark: "rgba(0, 105, 192, 1)",
      contrastText: "rgba(224, 224, 224, 1)",
    },
    secondary: {
      light: "rgba(67, 160, 71, 1)",
      main: "rgba(46, 112, 49, 1)",
      dark: "rgba(104, 179, 107, 1)",
      contrastText: "rgba(224, 224, 224, 1)",
    },
    error: {
      light: "#e57373",
      main: "#f44336",
      dark: "#d32f2f",
      contrastText: "#fff",
    },
    text: {
      primary: "rgba(224, 224, 224, 1)",
      secondary: "rgba(192, 192, 192, 1)",
      disabled: "rgba(240, 172, 172, 1)",
      hint: "rgba(255, 255, 255, 1)",
    },
  },
});
