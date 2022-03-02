import React from "react";
import * as R from "ramda";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Input,
  InputLabel,
} from "@material-ui/core";
import classNames from "classnames";
import { die } from "taio/build/utils/internal/exceptions";
import { isUnionThat } from "taio/build/utils/validator/array";
import { isNumber, isString } from "taio/build/utils/validator/primitive";
import {
  ArgumentConfig,
  isBooleanArgumentField,
  isEnumArgumentField,
  isNumberArgumentField,
  isStringArgumentField,
  PassedParameter,
} from "../../../../models/script";
import { useStyles } from "../common/common-mui-styles";
import type { IPickerProps } from "../common/schema";
import { EnumPicker } from "../enum-picker";

export interface IParameterInputProp
  extends Required<IPickerProps<PassedParameter>> {
  arugmentConfig: ArgumentConfig;
}

export const ParameterInput: React.FC<IParameterInputProp> = ({
  value,
  onChange,
  arugmentConfig,
}) => {
  const classes = useStyles();
  return (
    <Box>
      {Object.entries(arugmentConfig).map(([fieldKey, field], i) => {
        const fieldValue = value[fieldKey];
        if (isBooleanArgumentField(field)) {
          return (
            <Box key={i}>
              <FormControl className={classes.formControl}>
                <FormControlLabel
                  label={fieldKey}
                  control={
                    <Checkbox
                      checked={!!fieldValue}
                      onChange={(_, bool) =>
                        onChange({ ...value, [fieldKey]: bool })
                      }
                    />
                  }
                />
                <FormHelperText>{field.description}</FormHelperText>
              </FormControl>
            </Box>
          );
        }
        return (
          <Box key={i}>
            <FormControl
              className={classNames(
                R.filter(Boolean, [
                  classes.formControl,
                  isEnumArgumentField(field)
                    ? classes.selectControl
                    : undefined,
                ])
              )}
            >
              <InputLabel>{fieldKey}</InputLabel>
              {isStringArgumentField(field) ? (
                <Input
                  value={fieldValue ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, [fieldKey]: `${e.target.value}` })
                  }
                ></Input>
              ) : isNumberArgumentField(field) ? (
                <Input
                  type="number"
                  value={fieldValue ?? 0}
                  onChange={(e) =>
                    onChange({ ...value, [fieldKey]: +e.target.value })
                  }
                ></Input>
              ) : isEnumArgumentField(field) ? (
                <EnumPicker
                  enumObject={field.enumOptions.enumObject}
                  enumNameMapping={field.enumOptions.enumNameMapping}
                  value={
                    isUnionThat(isString, isNumber)(fieldValue)
                      ? fieldValue
                      : ""
                  }
                  onChange={(e) => onChange({ ...value, [fieldKey]: e })}
                ></EnumPicker>
              ) : (
                die()
              )}
              <FormHelperText>{field.description}</FormHelperText>
            </FormControl>
          </Box>
        );
      })}
    </Box>
  );
};
