import type {
  GetTemplateValue,
  CreateIntlTextKeys,
  CreateTemplateType,
} from "../../../../common/types/intl-types";

export type IntlTextKeys = CreateIntlTextKeys<IntlTextTemplates>;
export type IntlTextTemplates = CreateTemplateType<IntlTextFields>;
export type TemplateValues<K extends IntlTextKeys> = GetTemplateValue<
  IntlTextFields,
  K
>;

export interface IntlTextFields {
  components: {
    parameterEditor: {
      configKey: {
        label: [];
        new: {
          label: [];
          placeholder: [];
        };
      };
      description: {
        label: [];
        placeholder: [];
      };
      fieldEditor: {
        defaultValue: {
          label: [];
        };
        description: {
          label: [];
          placeholder: [];
        };
        enum: {
          delete: {
            tooltip: [];
          };
          valueEditor: {
            add: {
              tooltip: [];
            };
            display: {
              label: [];
            };
            name: {
              label: [];
            };
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
            value: {
              label: [];
            };
          };
        };
        picker: {
          label: [];
        };
        type: {
          label: [];
        };
      };
      validate: {
        exist: [{ newFieldName: string }];
      };
    };
    picker: {
      script: {
        empty: [];
        label: [];
      };
    };
    skeleton: {
      loading: [];
    };
  };
  manager: {
    module: {
      id: {
        label: [];
      };
      install: {
        apply: [];
        installing: [];
      };
      options: {
        installTypes: [{ moduleId: string }];
      };
      scope: {
        label: [];
        mapping: {
          global: [];
          local: [];
        };
      };
      version: {
        label: [];
      };
    };
    script: {
      delete: {
        tooltip: [];
      };
      edit: {
        tooltip: [];
      };
      explore: {
        rootFolder: [];
      };
      export: {
        tooltip: [];
      };
      import: {
        tooltip: [];
      };
      new: {
        language: {
          label: [];
        };
        name: {
          label: [];
        };
      };
      params: {
        title: [{ scriptName: string }];
      };
      picker: {
        label: [];
      };
      refresh: {
        tooltip: [];
      };
    };
  };
  menu: {
    manageModules: [];
    manageScript: [];
    runScript: [];
  };
  runner: {
    cleanUp: {
      apply: [];
      cleaning: [];
    };
    console: {
      title: [];
    };
    mount: {
      button: [];
      tooltip: [];
    };
    preset: {
      auto: {
        description: [];
        name: {
          label: [];
          hint: [];
        };
        scope: [];
        title: [];
      };
      label: [];
      load: {
        one: [];
      };
      save: {
        as: [];
        help: [];
        name: [];
        title: [];
      };
    };
    run: {
      apply: [];
      cleaning: [];
      running: [];
    };
  };
}
