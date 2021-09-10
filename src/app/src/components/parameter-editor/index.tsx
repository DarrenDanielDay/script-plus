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
  makeStyles,
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
import { useTypedIntl } from "../../i18n/core/locale";

const useCustomStyles = makeStyles((theme) => ({
  saveFab: {
    position: "absolute",
    right: theme.spacing(2),
    top: theme.spacing(2),
  },
}));

export interface ParameterEditorProp {
  configObject: ArgumentConfig;
  description: string;
  onDone?: (fields: ArgumentConfig, description: string) => void;
}

export const ParameterEditor: React.FC<ParameterEditorProp> = ({
  configObject,
  description,
  onDone,
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const intl = useTypedIntl();
  const customClasses = useCustomStyles();
  const [fields, setFields] = useState<ArgumentConfig>(configObject);
  const fieldKeys = Object.keys(fields);
  const [scriptDescription, setScriptDescription] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  useEffect(() => {
    setFields(configObject);
  }, [configObject]);
  useEffect(() => {
    setScriptDescription(description);
  }, [description]);
  const field =
    editingFieldKey !== null ? fields[editingFieldKey] ?? null : null;
  const isNameOccupied = newFieldName in fields;
  const configNameValidateText = isNameOccupied
    ? intl("components.parameterEditor.validate.exist", { newFieldName })
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
        className={customClasses.saveFab}
      >
        <Save />
      </Fab>
      <Box>
        <TextField
          multiline
          rowsMax={3}
          style={{ width: theme.spacing(72) }}
          variant="outlined"
          label={intl("components.parameterEditor.description.label")}
          placeholder={intl(
            "components.parameterEditor.description.placeholder"
          )}
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
          <FormLabel>
            {intl("components.parameterEditor.configKey.label")}
          </FormLabel>
        </FormControl>
        <TextField
          variant="outlined"
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
          error={!!configNameValidateText}
          label={intl("components.parameterEditor.configKey.new.label")}
          placeholder={intl(
            "components.parameterEditor.configKey.new.placeholder"
          )}
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
            <InputLabel>
              {intl("components.parameterEditor.fieldEditor.picker.label")}
            </InputLabel>
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
  const intl = useTypedIntl();
  const classes = useStyles();
  return (
    <Box>
      <Box>
        <FormControl
          className={classNames(classes.formControl, classes.selectControl)}
        >
          <InputLabel>
            {intl("components.parameterEditor.fieldEditor.type.label")}
          </InputLabel>
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
          <InputLabel>
            {intl("components.parameterEditor.fieldEditor.defaultValue.label")}
          </InputLabel>
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
            <Tooltip
              title={intl(
                "components.parameterEditor.fieldEditor.enum.delete.tooltip"
              )}
            >
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
        <InputLabel>
          {intl("components.parameterEditor.fieldEditor.description.label")}
        </InputLabel>
        <Input
          placeholder={intl(
            "components.parameterEditor.fieldEditor.description.placeholder"
          )}
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
  const intl = useTypedIntl();
  const classes = useStyles();
  const [enumKey, setEnumKey] = useState("");
  const [enumValue, setEnumValue] = useState<number | string>("");
  const [enumName, setEnumName] = useState("");
  const enumKeyValidateInfo = enumKeys(enumObject ?? {}).includes(enumKey)
    ? intl(
        "components.parameterEditor.fieldEditor.enum.valueEditor.validate.name.exists",
        { enumKey }
      )
    : !/^[a-z]/i.test(enumKey)
    ? intl(
        "components.parameterEditor.fieldEditor.enum.valueEditor.validate.name.startWithWords"
      )
    : "";
  const enumValueValidateInfo = enumValues(enumObject ?? {}).includes(enumValue)
    ? intl(
        "components.parameterEditor.fieldEditor.enum.valueEditor.validate.value.exists"
      )
    : enumValue === ""
    ? intl(
        "components.parameterEditor.fieldEditor.enum.valueEditor.validate.value.notEmpty"
      )
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
        label={intl(
          "components.parameterEditor.fieldEditor.enum.valueEditor.name.label"
        )}
        error={!!enumKeyValidateInfo}
        helperText={enumKeyValidateInfo}
        value={enumKey}
        onChange={(e) => setEnumKey(e.target.value)}
      ></TextField>
      <TextField
        variant="outlined"
        className={classes.tinyFormControl}
        label={intl(
          "components.parameterEditor.fieldEditor.enum.valueEditor.value.label"
        )}
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
        label={intl(
          "components.parameterEditor.fieldEditor.enum.valueEditor.display.label"
        )}
        value={enumName}
        onChange={(e) => setEnumName(e.target.value)}
      ></TextField>
      <FormControl>
        {isAllValid ? (
          <Tooltip
            title={intl(
              "components.parameterEditor.fieldEditor.enum.valueEditor.add.tooltip"
            )}
          >
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
