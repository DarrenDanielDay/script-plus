import {
  MenuItem,
  MenuItemProps,
  Select,
  SelectProps,
} from "@material-ui/core";
import React from "react";
import { TypedReflect } from "taio/build/libs/typescript/reflect";
import type { Mapper } from "taio/build/types/concepts";
import { keyOf } from "taio/build/utils/typed-function";
import type { IPickerProps } from "../common/schema";

export interface IListPickerProp<T> extends IPickerProps<T> {
  list: Iterable<T>;
  displayMapping: Mapper<T, React.ReactNode>;
  selectProps?: Omit<SelectProps, keyof IPickerProps<T>>;
  menuProps?: Omit<MenuItemProps, "value">;
}

export const ListPicker = <T extends unknown>(
  params: IListPickerProp<T>
): JSX.Element => {
  const { list, value, onChange, displayMapping, selectProps, menuProps } =
    params;
  const selectProp: SelectProps = {
    ...selectProps,
    onChange: (e) => {
      // @ts-expect-error Generic value cannot be inferred
      onChange?.(e.target.value);
    },
  };
  if (TypedReflect.has(params, keyOf<IListPickerProp<T>>("value"))) {
    selectProp.value = value;
  }
  const renderingList = [...list];
  return (
    <Select {...selectProp}>
      {renderingList.map((item, i) => (
        // @ts-expect-error
        <MenuItem {...menuProps} value={item} key={i}>
          {displayMapping(item)}
        </MenuItem>
      ))}
    </Select>
  );
};
