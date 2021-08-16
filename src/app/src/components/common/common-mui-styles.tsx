import { makeStyles } from "@material-ui/core";

export const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
  },
  tinyFormControl: {
    margin: theme.spacing(1),
    width: theme.spacing(15),
  },
  textAreaControl: {
    width: theme.spacing(48),
  },
  selectControl: {
    width: theme.spacing(12),
  },
  saveFab: {
    position: "absolute",
    right: theme.spacing(2),
    top: theme.spacing(2),
  },
}));
