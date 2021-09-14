import { isPrimitive, isSymbol } from "taio/build/utils/validator/primitive";

export function getDisplay(obj: unknown): string {
  if (isPrimitive(obj)) {
    if (isSymbol(obj)) {
      return obj.toString();
    }
    return `${obj}`;
  }
  try {
    return JSON.stringify(
      obj,
      (_key, value) =>
        isSymbol(value)
          ? value.toString()
          : typeof value === "function"
          ? `${value}`
          : value,
      2
    );
  } catch (error) {
    return `${obj}`;
  }
}
