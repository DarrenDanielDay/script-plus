import {
  MenuItem,
  MenuItemProps,
  Select,
  SelectProps,
} from "@material-ui/core";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { Func, Mapper } from "taio/build/types/concepts";
import type { IPickerProps } from "../common/schema";

type PickerMemo<T> = Func<[a: T, b: T], boolean>;

export interface IListPickerProp<T> extends IPickerProps<T> {
  list: Iterable<T>;
  displayMapping: Mapper<T, React.ReactNode>;
  identity?: PickerMemo<T>;
  selectProps?: Omit<SelectProps, keyof IPickerProps<T>>;
  menuProps?: Omit<MenuItemProps, "value">;
}

export const ListPicker = <T extends unknown>(
  params: IListPickerProp<T>
): JSX.Element => {
  const {
    list,
    onChange,
    displayMapping,
    identity = R.identity as PickerMemo<T>,
    selectProps,
    menuProps,
  } = params;
  const renderingList = [...list];
  const paramsValue = params.value;
  const value =
    useMemo(
      () =>
        paramsValue == null
          ? ""
          : renderingList.find((item) => identity(item, paramsValue)),
      [list, paramsValue]
    ) ?? "";
  const selectProp: SelectProps = {
    ...selectProps,
    value,
    onChange: (e) => {
      // @ts-expect-error Generic value cannot be inferred
      onChange?.(e.target.value);
    },
  };
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
