import type {
  GetTemplateValue,
  CreateIntlTextKeys,
  CreateTemplateType,
} from "../../../../utils/types/intl-types";

export type TemplateValues<K extends IntlTextKeys> = GetTemplateValue<
  IntlTextFields,
  K
>;
export type IntlTextKeys = CreateIntlTextKeys<IntlTextTemplates>;
export type IntlTextTemplates = CreateTemplateType<IntlTextFields>;

export interface IntlTextFields {
  components: {
    picker: {
      script: {
        empty: [];
        label: [];
      };
    };
    parameterEditor: {
      validate: {
        exist: [{ newFieldName: string }];
      };
      description: {
        label: [];
        placeholder: [];
      };
      configKey: {
        label: [];
        new: {
          label: [];
          placeholder: [];
        };
      };
      fieldEditor: {
        type: {
          label: [];
        };
        picker: {
          label: [];
        };
        defaultValue: {
          label: [];
        };
        enum: {
          delete: {
            tooltip: [];
          };
          valueEditor: {
            validate: {
              name: {
                exists: [{ enumKey: string }];
                startWithWords: [];
              };
              value: {
                exists: [{ enumValue: string }];
                notEmpty: [];
              };
            };
            name: {
              label: [];
            };
            value: {
              label: [];
            };
            display: {
              label: [];
            };
            add: {
              tooltip: [];
            };
          };
        };
        description: {
          label: [];
          placeholder: [];
        };
      };
    };
    skeleton: {
      loading: [];
    };
  };
  menu: {
    runScript: [];
    manageScript: [];
    manageModules: [];
  };
  runner: {
    run: {
      apply: [];
      running: [];
      cleaning: [];
    };
    console: {
      title: [];
    };
    mount: {
      button: [];
      tooltip: [];
    };
    cleanUp: {
      cleaning: [];
      apply: [];
    };
  };
  manager: {
    script: {
      import: {
        tooltip: [];
      };
      refresh: {
        tooltip: [];
      };
      picker: {
        label: [];
      };
      delete: {
        tooltip: [];
      };
      edit: {
        tooltip: [];
      };
      export: {
        tooltip: [];
      };
      new: {
        name: {
          label: [];
        };
        language: {
          label: [];
        };
      };
      params: {
        title: [{ scriptName: string }];
      };
    };
    module: {
      id: {
        label: [];
      };
      version: {
        label: [];
      };
      install: {
        installing: [];
        apply: [];
      };
      scope: {
        label: [];
        mapping: {
          local: [];
          global: [];
        };
      };
      options: {
        installTypes: [{ moduleId: string }];
      };
    };
  };
}
