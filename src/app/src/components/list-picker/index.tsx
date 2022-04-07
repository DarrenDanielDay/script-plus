import {
  MenuItem,
  MenuItemProps,
  Select,
  SelectProps,
} from "@material-ui/core";
import React, { useMemo } from "react";
import { TypedObject } from "taio/build/libs/typescript/object";
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

const ListPicker = <T extends unknown>(
  params: IListPickerProp<T>
): JSX.Element => {
  const {
    list,
    onChange,
    displayMapping,
    identity = Object.is,
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

interface ListPickerStatic {
  key<T extends object>(key: keyof T): PickerMemo<T>;
}

TypedObject.defineProperty(ListPicker, "key", {
  get:
    () =>
    <T extends object>(key: keyof T) =>
    (a: T, b: T) =>
      Object.is(a[key], b[key]),
});

const ListPickerAlias: typeof ListPicker & ListPickerStatic = ListPicker;

export { ListPickerAlias as ListPicker };
