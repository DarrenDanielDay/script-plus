import type { EnumUnderlayingType, StandardEnum } from "taio/build/types/enum";
import { enumKeys } from "taio/build/utils/enum";
import type { Mapper } from "taio/build/types/concepts";
import { IListPickerProp, ListPicker } from "../list-picker";
import type { StringKey } from "taio/build/types/converts";
import { TypedReflect } from "taio/build/libs/typescript/reflect";
import { keyOf } from "taio/build/utils/typed-function";
import type { OmitKey } from "taio/build/types/object";

export interface IEnumPickerProp<E extends EnumUnderlayingType>
  extends OmitKey<IListPickerProp<E>, "displayMapping" | "list" | "identity"> {
  enumObject: StandardEnum<E>;
  enumNameMapping?: Map<E, string> | Record<E, string> | Mapper<E, string>;
}

export const EnumPicker = <E extends EnumUnderlayingType>(
  props: IEnumPickerProp<E>
): JSX.Element => {
  const { value, onChange, enumObject, enumNameMapping, ...rest } = props;
  const keys = enumKeys(enumObject);
  const listPickerProps: IListPickerProp<StringKey<StandardEnum<E>>> = {
    list: keys,
    displayMapping: (key) => {
      // @ts-expect-error Index access of abstract enum object cannot be inferred
      const enumValue: E = enumObject[key];
      return enumNameMapping instanceof Map
        ? enumNameMapping.get(enumValue) ?? key
        : typeof enumNameMapping === "function"
        ? enumNameMapping(enumValue)
        : enumNameMapping?.[enumValue] ?? key;
    },
    // @ts-expect-error Index access of abstract enum object cannot be inferred
    onChange: (key) => onChange?.(enumObject[key]),
    ...rest,
  };
  if (TypedReflect.has(props, keyOf<IEnumPickerProp<E>>("value"))) {
    listPickerProps.value = keys.find((key) => enumObject[key] === value);
  }
  return ListPicker(listPickerProps);
};
