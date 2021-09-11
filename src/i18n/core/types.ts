import type { ExecutionTask } from "../../models/execution-task";
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
  common: {
    promote: {
      reportIssue: [];
    };
  };
  actions: {
    script: {
      ask: {
        script: {
          placeholder: [];
          title: [];
        };
        parameter: {
          title: [{ fieldKey: string }];
          enum: {
            description: [{ displayName: string; value: string }];
          };
          validate: {
            shouldBeNumber: [];
          };
        };
        task: {
          label: [ExecutionTask];
          title: [];
        };
      };
    };
    module: {
      install: {
        moduleId: {
          promote: [];
          placeholder: [];
        };
        version: {
          search: {
            searching: [{ moduleId: string }];
            canceled: [{ moduleId: string }];
          };
          pick: {
            title: [{ moduleId: string }];
          };
        };
      };
    };
  };
  config: {
    check: {
      maybeCrashed: [];
    };
  };
  script: {
    logging: {
      createPackageJson: [];
      installDependencies: [{ scriptName: string }];
    };
    invalid: {
      scriptObject: [];
    };
    create: {
      code: {
        generate: {
          unexpectedEnumType: [];
          unexpectedArgumentType: [];
        };
      };
      validate: {
        name: [{ special: string }];
      };
    };
    delete: {
      confirm: [{ scriptName: string }];
      notFound: [{ scriptName: string }];
    };
    meta: {
      invalidFile: [];
    };
    execute: {
      consoleMethodHasToBeFunction: [{ methodName: string }];
      invalid: {
        script: {
          format: [{ scriptName: string }];
          returnValue: [];
        };
      };
      task: {
        invalid: {
          notFound: [{ taskId: string }];
          running: [{ taskId: string }];
        };
      };
    };
    import: {
      invalid: {
        bundle: [{ fileName: string }];
      };
    };
    install: {
      exists: {
        promote: [{ scriptName: string }];
        overwrite: [];
        rename: [];
      };
      rename: {
        promote: [{ scriptName: string }];
        validate: {
          exists: [{ value: string }];
        };
      };
      abort: {
        message: [{ scriptName: string }];
      };
      dependencies: {
        promote: [{ scriptName: string; dependencies: string }];
      };
    };
  };
  module: {
    notFound: [{ moduleId: string }];
  };
  node: {
    packageManager: {
      noManager: [];
      useNpmInstead: [];
    };
  };
}
