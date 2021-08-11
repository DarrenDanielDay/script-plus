export interface IPickerProps<T> {
  value?: T;
  onChange?: (value: T) => void;
}
