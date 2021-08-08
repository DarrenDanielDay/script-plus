import {
  Box,
  colors,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Input,
  InputLabel,
  makeStyles,
  useTheme,
  Tooltip,
} from "@material-ui/core";
import { AddOutlined, DeleteOutlined } from "@material-ui/icons";
import classNames from "classnames";
import { compose, equals, omit, prop, T, __ } from "ramda";
import React, { useState } from "react";
import type { EnumUnderlayingType, StandardEnum } from "taio/build/types/enum";
import { enumKeys, enumValues } from "taio/build/utils/enum";
import { die } from "taio/build/utils/internal/exceptions";
import { isAnyOf } from "taio/build/utils/validator/array";
import { isNumber, isString } from "taio/build/utils/validator/primitive";
import type { ArgumentField } from "../../../../models/script";
import styles from "../common/common.module.css";

export interface ParameterEditorProp {
  onParametersChange?: (params: Record<string, ArgumentField>) => void;
  onDone?: (params?: Record<string, ArgumentField>) => void;
}

const useStyles = makeStyles((theme) => ({
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
}));

export const ParameterEditor: React.FC<ParameterEditorProp> = ({}) => {
  const [fields, setFields] = useState<Record<string, ArgumentField>>({});
  const [newFieldName, setNewFieldName] = useState("");
  const isNameOccupied = newFieldName in fields;
  const handleFieldEdit: OnFieldEditCallback = (
    type,
    fieldKey,
    editedField
  ) => {
    console.log(editedField);
    switch (type) {
      case "update":
        setFields((fields) => ({ ...fields, [fieldKey]: editedField }));
        break;
      case "delete":
        setFields((fields) => omit([fieldKey], fields));
      default:
        break;
    }
  };
  const handleAddField = () => {
    if (!newFieldName) return;
    setFields((fields) => ({
      ...fields,
      [newFieldName]: {
        type: "string",
        defaultValue: "",
        description: "",
        enumOptions: undefined,
      },
    }));
    setNewFieldName("");
  };
  return (
    <Box padding margin>
      <Box className={styles["center-row"]}>
        <TextField
          variant="outlined"
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
          error={isNameOccupied}
          label="config name"
          placeholder="Input new config name"
          helperText={isNameOccupied ? `"${newFieldName}" already exist.` : ""}
        ></TextField>
        <IconButton
          onClick={handleAddField}
          disabled={!newFieldName}
          color="primary"
        >
          <AddOutlined></AddOutlined>
        </IconButton>
      </Box>
      <Box>
        {Object.entries(fields).map(([name, field], i) => (
          <FieldEditor
            key={i}
            name={name}
            field={field}
            onFieldEdit={handleFieldEdit}
          ></FieldEditor>
        ))}
      </Box>
    </Box>
  );
};

type OnFieldEditCallback = (
  type: "update" | "delete",
  fieldKey: string,
  field: ArgumentField
) => void;

export interface IFieldEditorProp {
  name: string;
  field: ArgumentField;
  onFieldEdit?: OnFieldEditCallback;
}

export enum ConfigTypeEnum {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Enum = "enum",
}

export const FieldEditor: React.FC<IFieldEditorProp> = ({
  name,
  field,
  onFieldEdit,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  return (
    <Box>
      <Box>
        <FormControl className={classes.tinyFormControl}>
          <InputLabel>config name</InputLabel>
          <Input
            value={name}
            disabled
            style={{ color: theme.palette.text.primary }}
          ></Input>
        </FormControl>
        <FormControl className={classes.formControl}>
          <Tooltip title="delete field">
            <IconButton
              style={{ color: colors.red[500] }}
              onClick={() => onFieldEdit?.("delete", name, field)}
            >
              <DeleteOutlined></DeleteOutlined>
            </IconButton>
          </Tooltip>
        </FormControl>
        <FormControl
          className={classNames(classes.formControl, classes.selectControl)}
        >
          <InputLabel>type</InputLabel>
          <Select
            label="type"
            value={field.type}
            onChange={(e) => {
              const { value: type } = e.target;
              if (
                !isAnyOf(
                  ...(enumValues(ConfigTypeEnum) as ArgumentField["type"][])
                )(type)
              ) {
                return;
              }
              let newField: ArgumentField = { ...field };
              newField.type = type;
              switch (type) {
                case "enum":
                  newField.enumOptions = {
                    enumObject: {},
                    enumNameMapping: {},
                  };
                  break;
                case "boolean":
                  newField.defaultValue = false;
                  break;
                case "number":
                  newField.defaultValue = 0;
                  break;
                case "string":
                  newField.defaultValue = "";
                  break;
                default:
                  die();
              }
              onFieldEdit?.("update", name, newField);
            }}
          >
            {enumKeys(ConfigTypeEnum).map((key, i) => (
              <MenuItem key={i} value={ConfigTypeEnum[key]}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl className={classNames(classes.tinyFormControl)}>
          <InputLabel>default value</InputLabel>
          {field.type === "number" ? (
            <Input
              type="number"
              value={field.defaultValue}
              onChange={(e) =>
                onFieldEdit?.("update", name, {
                  ...field,
                  defaultValue: +e.target.value,
                })
              }
            ></Input>
          ) : field.type === "string" ? (
            <Input
              value={field.defaultValue}
              onChange={(e) =>
                onFieldEdit?.("update", name, {
                  ...field,
                  defaultValue: e.target.value,
                })
              }
            ></Input>
          ) : field.type === "boolean" ? (
            <Select
              value={+field.defaultValue}
              onChange={(e) =>
                onFieldEdit?.("update", name, {
                  ...field,
                  defaultValue: !!e.target.value,
                })
              }
            >
              <MenuItem value={0}>false</MenuItem>
              <MenuItem value={1}>true</MenuItem>
            </Select>
          ) : (
            <Select
              value={field.defaultValue}
              onChange={(e) =>
                onFieldEdit?.("update", name, {
                  ...field,
                  // @ts-expect-error Enum cannot be infered
                  defaultValue: e.target.value,
                })
              }
            >
              {enumKeys(field.enumOptions.enumObject).map((key, i) => (
                <MenuItem key={i} value={field.enumOptions.enumObject[key]}>
                  {field.enumOptions.enumNameMapping?.[
                    field.enumOptions.enumObject[key]!
                  ] ?? key}
                  ({enumValueDisplay(field.enumOptions.enumObject[key]!)})
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>
        {field.type === "enum" && (
          <FormControl className={classes.formControl}>
            <Tooltip title="Delete selected enum">
              <IconButton
                style={{ color: colors.red[500] }}
                onClick={() => {
                  const newEnumObject = omit(
                    [
                      isNumber(field.defaultValue)
                        ? field.defaultValue + ""
                        : undefined,
                      enumKeys(field.enumOptions.enumObject).find(
                        compose(
                          equals(field.defaultValue),
                          prop(__, field.enumOptions.enumObject)
                        )
                      ),
                    ].filter(isString),
                    field.enumOptions.enumObject
                  );
                  return onFieldEdit?.("update", name, {
                    ...field,
                    defaultValue: enumValues(newEnumObject).find(T) ?? "",
                    enumOptions: {
                      enumObject: newEnumObject,
                      enumNameMapping: omit(
                        [
                          enumValues(field.enumOptions.enumObject)
                            .find(equals(field.defaultValue))
                            ?.toString(),
                        ].filter(isString),
                        field.enumOptions.enumNameMapping ?? {}
                      ),
                    },
                  });
                }}
              >
                <DeleteOutlined></DeleteOutlined>
              </IconButton>
            </Tooltip>
          </FormControl>
        )}
      </Box>
      <Box>
        {field.type === "enum" && (
          <EnumValueEditor
            currentEnum={field.enumOptions.enumObject}
            onAdd={(key, value, display) => {
              console.log("add");
              onFieldEdit?.("update", name, {
                ...field,
                enumOptions: {
                  enumNameMapping: {
                    ...field.enumOptions.enumNameMapping,
                    [value]: display,
                  },
                  enumObject: Object.assign(
                    {
                      ...field.enumOptions.enumObject,
                    },
                    isNumberLike(value)
                      ? { [value.toString()]: key, [key]: value }
                      : { [key]: value }
                  ),
                },
              });
            }}
          />
        )}
      </Box>
      <FormControl
        className={classNames(classes.formControl, classes.textAreaControl)}
      >
        <InputLabel>description</InputLabel>
        <Input
          placeholder="A description for this config field"
          value={field.description}
          multiline
          rows={2}
          onChange={(e) =>
            onFieldEdit?.("update", name, {
              ...field,
              description: e.target.value,
            })
          }
        ></Input>
      </FormControl>
    </Box>
  );
};

export interface IEnumValueEditorProp {
  onAdd?: (
    enumName: string,
    enumValue: number | string,
    displayName: string
  ) => void;
  currentEnum?: StandardEnum<EnumUnderlayingType>;
}

export const EnumValueEditor: React.FC<IEnumValueEditorProp> = ({
  onAdd,
  currentEnum,
}) => {
  const classes = useStyles();
  const [enumKey, setEnumKey] = useState("");
  const [enumValue, setEnumValue] = useState<number | string>("");
  const [enumName, setEnumName] = useState("");
  const enumKeyValidateInfo = enumKeys(currentEnum ?? {}).includes(enumKey)
    ? `name "${enumKey}" already exists`
    : !/^[a-z]/i.test(enumKey)
    ? "name should start with words"
    : "";
  const enumValueValidateInfo = enumValues(currentEnum ?? {}).includes(
    enumValue
  )
    ? `value ${enumValue} already exists`
    : "";
  const isAllValid = !enumValueValidateInfo && !enumKeyValidateInfo;
  const renderDeleteEnumButton = () => (
    <IconButton
      color="primary"
      disabled={!isAllValid}
      onClick={() => {
        onAdd?.(enumKey, enumValue, enumName);
        setEnumKey("");
        setEnumValue("");
        setEnumName("");
      }}
    >
      <AddOutlined></AddOutlined>
    </IconButton>
  );
  return (
    <Box className={styles["center-row"]}>
      <TextField
        variant="outlined"
        className={classes.tinyFormControl}
        label="enum name"
        error={!!enumKeyValidateInfo}
        helperText={enumKeyValidateInfo}
        value={enumKey}
        onChange={(e) => setEnumKey(e.target.value)}
      ></TextField>
      <TextField
        variant="outlined"
        className={classes.tinyFormControl}
        label="enum value"
        error={!!enumValueValidateInfo}
        helperText={enumValueValidateInfo}
        value={enumValue}
        onChange={(e) =>
          setEnumValue(
            isNumberLike(e.target.value) ? +e.target.value : e.target.value + ""
          )
        }
      ></TextField>
      <TextField
        variant="outlined"
        className={classes.tinyFormControl}
        label="enum display"
        value={enumName}
        onChange={(e) => setEnumName(e.target.value)}
      ></TextField>
      <FormControl>
        {isAllValid ? (
          <Tooltip title="Add enum value definition">
            {renderDeleteEnumButton()}
          </Tooltip>
        ) : (
          renderDeleteEnumButton()
        )}
      </FormControl>
    </Box>
  );
};
function isNumberLike(strOrNumber: string | number) {
  return !isNaN(+strOrNumber);
}

function enumValueDisplay(strOrNumber: string | number) {
  return isNumberLike(strOrNumber) ? +strOrNumber + "" : `"${strOrNumber}"`;
}
