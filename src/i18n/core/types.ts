import type {
  CreateIntlTextKeys,
  CreateTemplateType,
  GetTemplateValue,
} from "../../utils/types/intl-types";

export type IntlTextKeys = CreateIntlTextKeys<IntlTextTemplates>;
export type IntlTextTemplates = CreateTemplateType<IntlTextFields>;
export type TemplateValues<K extends IntlTextKeys> = GetTemplateValue<
  IntlTextFields,
  K
>;
export interface IntlTextFields {
  script: {
    delete: {
      confirm: [{ scriptName: string }];
    };
  };
}
