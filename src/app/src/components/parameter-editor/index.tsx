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
  Tooltip,
  FormLabel,
  Fab,
  useTheme,
} from "@material-ui/core";
import { AddOutlined, DeleteOutlined, Save } from "@material-ui/icons";
import classNames from "classnames";
import * as R from "ramda";
import React, { useEffect, useState } from "react";
import type { EnumUnderlayingType, StandardEnum } from "taio/build/types/enum";
import { enumKeys, enumValues } from "taio/build/utils/enum";
import { die } from "taio/build/utils/internal/exceptions";
import { isNumber, isString } from "taio/build/utils/validator/primitive";
import type { ArgumentConfig, ArgumentField } from "../../../../models/script";
import { assertNonNullish } from "../../utils/well-typed";
import commonStyles from "../common/common.module.css";
import { EnumPicker } from "../enum-picker";
import { ListPicker } from "../list-picker";
import styles from "./style.module.css";
import { useStyles } from "../common/common-mui-styles";

export interface ParameterEditorProp {
  configObject: ArgumentConfig;
  onDone?: (fields: ArgumentConfig, description: string) => void;
}

export const ParameterEditor: React.FC<ParameterEditorProp> = ({
  configObject,
  onDone,
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const [fields, setFields] = useState<ArgumentConfig>(configObject);
  const fieldKeys = Object.keys(fields);
  const [scriptDescription, setScriptDescription] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  useEffect(() => {
    setFields(configObject);
  }, [configObject]);
  const field =
    editingFieldKey !== null ? fields[editingFieldKey] ?? null : null;
  const isNameOccupied = newFieldName in fields;
  const configNameValidateText = isNameOccupied
    ? `"${newFieldName}" already exist.`
    : "";
  const handleFieldEdit: OnFieldEditCallback = (fieldKey, editedField) =>
    setFields((fields) => ({ ...fields, [fieldKey]: editedField }));

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
    setEditingFieldKey(newFieldName);
  };
  return (
    <Box>
      <Fab
        color="primary"
        onClick={() => onDone?.(fields, scriptDescription)}
        className={classes.saveFab}
      >
        <Save />
      </Fab>
      <Box>
        <TextField
          multiline
          rowsMax={3}
          style={{ width: theme.spacing(72) }}
          variant="outlined"
          label="script description"
          placeholder="Input some description for this script"
          value={scriptDescription}
          onChange={(e) => setScriptDescription(e.target.value)}
        ></TextField>
      </Box>
      <Box
        className={classNames(
          commonStyles["center-row"],
          styles["config-name-edit-row"]
        )}
      >
        <FormControl className={classes.formControl}>
          <FormLabel>Add new</FormLabel>
        </FormControl>
        <TextField
          variant="outlined"
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
          error={!!configNameValidateText}
          label="config key"
          placeholder="Input new key"
          helperText={configNameValidateText}
        ></TextField>
        <IconButton
          onClick={handleAddField}
          disabled={!!configNameValidateText || !newFieldName}
          color="primary"
        >
          <AddOutlined></AddOutlined>
        </IconButton>
      </Box>
      <Box>
        {!!fieldKeys.length && (
          <FormControl
            className={classNames(classes.formControl, classes.selectControl)}
          >
            <InputLabel>config keys</InputLabel>
            <ListPicker
              list={Object.keys(fields)}
              displayMapping={R.identity}
              value={editingFieldKey ?? ""}
              onChange={(fieldKey) => setEditingFieldKey(fieldKey)}
            ></ListPicker>
          </FormControl>
        )}
        {editingFieldKey != null && !!fieldKeys.length && (
          <FormControl className={classes.formControl}>
            <IconButton
              style={{ color: colors.red[500] }}
              onClick={() => {
                assertNonNullish(editingFieldKey);
                setFields((fields) => R.omit([editingFieldKey], fields));
                setEditingFieldKey(null);
              }}
            >
              <DeleteOutlined></DeleteOutlined>
            </IconButton>
          </FormControl>
        )}
      </Box>
      <Box>
        {editingFieldKey != null && field != null && (
          <FieldEditor
            name={editingFieldKey}
            field={field}
            onFieldEdit={handleFieldEdit}
          ></FieldEditor>
        )}
      </Box>
    </Box>
  );
};

type OnFieldEditCallback = (fieldKey: string, field: ArgumentField) => void;

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
  return (
    <Box>
      <Box>
        <FormControl
          className={classNames(classes.formControl, classes.selectControl)}
        >
          <InputLabel>type</InputLabel>
          <EnumPicker
            value={field.type}
            enumObject={ConfigTypeEnum}
            onChange={(type) => {
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
              onFieldEdit?.(name, newField);
            }}
          ></EnumPicker>
        </FormControl>
        <FormControl className={classNames(classes.tinyFormControl)}>
          <InputLabel>default value</InputLabel>
          {field.type === "number" ? (
            <Input
              type="number"
              value={field.defaultValue}
              onChange={(e) =>
                onFieldEdit?.(name, {
                  ...field,
                  defaultValue: +e.target.value,
                })
              }
            ></Input>
          ) : field.type === "string" ? (
            <Input
              value={field.defaultValue}
              onChange={(e) =>
                onFieldEdit?.(name, {
                  ...field,
                  defaultValue: e.target.value,
                })
              }
            ></Input>
          ) : field.type === "boolean" ? (
            <ListPicker
              list={[false, true]}
              displayMapping={String}
              value={field.defaultValue}
              onChange={(value) =>
                onFieldEdit?.(name, {
                  ...field,
                  defaultValue: value,
                })
              }
            ></ListPicker>
          ) : (
            <Select
              value={field.defaultValue}
              onChange={(e) =>
                onFieldEdit?.(name, {
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
                  const newEnumObject = R.omit(
                    [
                      isNumber(field.defaultValue)
                        ? field.defaultValue + ""
                        : undefined,
                      enumKeys(field.enumOptions.enumObject).find(
                        R.compose(
                          R.equals(field.defaultValue),
                          R.prop(R.__, field.enumOptions.enumObject)
                        )
                      ),
                    ].filter(isString),
                    field.enumOptions.enumObject
                  );
                  return onFieldEdit?.(name, {
                    ...field,
                    defaultValue: enumValues(newEnumObject).find(R.T) ?? "",
                    enumOptions: {
                      enumObject: newEnumObject,
                      enumNameMapping: R.omit(
                        [
                          enumValues(field.enumOptions.enumObject)
                            .find(R.equals(field.defaultValue))
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
            enumObject={field.enumOptions.enumObject}
            onAdd={(key, value, display) => {
              console.log("add");
              onFieldEdit?.(name, {
                ...field,
                enumOptions: {
                  enumNameMapping: {
                    ...field.enumOptions.enumNameMapping,
                    [value]: display || key,
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
            onFieldEdit?.(name, {
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
  enumObject?: StandardEnum<EnumUnderlayingType>;
}

export const EnumValueEditor: React.FC<IEnumValueEditorProp> = ({
  onAdd,
  enumObject,
}) => {
  const classes = useStyles();
  const [enumKey, setEnumKey] = useState("");
  const [enumValue, setEnumValue] = useState<number | string>("");
  const [enumName, setEnumName] = useState("");
  const enumKeyValidateInfo = enumKeys(enumObject ?? {}).includes(enumKey)
    ? `name "${enumKey}" already exists`
    : !/^[a-z]/i.test(enumKey)
    ? "name should start with words"
    : "";
  const enumValueValidateInfo = enumValues(enumObject ?? {}).includes(enumValue)
    ? `value ${enumValue} already exists`
    : enumValue === ""
    ? "value should not be empty"
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
    <Box className={commonStyles["center-row"]}>
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
  return !isNaN(+strOrNumber) && strOrNumber !== "";
}

function enumValueDisplay(strOrNumber: string | number) {
  return isNumberLike(strOrNumber) ? +strOrNumber + "" : `"${strOrNumber}"`;
}
