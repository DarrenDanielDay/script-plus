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
  actions: {
    module: {
      install: {
        moduleId: {
          placeholder: [];
          promote: [];
        };
        version: {
          pick: {
            title: [{ moduleId: string }];
          };
          search: {
            canceled: [{ moduleId: string }];
            searching: [{ moduleId: string }];
          };
        };
      };
    };
    script: {
      ask: {
        parameter: {
          enum: {
            description: [{ displayName: string; value: string }];
          };
          title: [{ fieldKey: string }];
          validate: {
            shouldBeNumber: [];
          };
        };
        script: {
          placeholder: [];
          title: [];
        };
        task: {
          label: [ExecutionTask];
          title: [];
        };
      };
    };
  };
  api: {
    invalidParam: [{ index: number; api: string }];
  };
  common: {
    ask: {
      no: [];
      yes: [];
    };
    promote: {
      reportIssue: [];
    };
  };
  config: {
    check: {
      maybeCrashed: [];
    };
  };
  module: {
    install: {
      done: {
        message: [{ moduleName: string }];
      };
    };
    notFound: [{ moduleId: string }];
  };
  node: {
    packageManager: {
      noManager: [];
      useNpmInstead: [];
    };
  };
  script: {
    check: {
      progress: {
        checkingStorageFolder: [];
        checkingVersions: [];
        title: [];
      };
    };
    create: {
      code: {
        generate: {
          unexpectedArgumentType: [];
          unexpectedEnumType: [];
        };
      };
      validate: {
        name: [{ special: string }];
      };
    };
    delete: {
      confirm: [{ scriptName: string }];
      done: [{ scriptName: string }];
      notFound: [{ scriptName: string }];
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
    executeCurrent: {
      cleanUpNow: {
        promote: [ExecutionTask];
      };
    };
    export: {
      dependencies: {
        unresolved: [{ dependencies: string }];
      };
      title: [{ scriptName: string }];
    };
    import: {
      invalid: {
        bundle: [{ fileName: string }];
      };
      title: [];
    };
    install: {
      abort: {
        message: [{ scriptName: string }];
      };
      dependencies: {
        promote: [{ scriptName: string; dependencies: string }];
      };
      exists: {
        overwrite: [];
        promote: [{ scriptName: string }];
        rename: [];
      };
      rename: {
        promote: [{ scriptName: string }];
        validate: {
          exists: [{ value: string }];
        };
      };
    };
    invalid: {
      scriptObject: [];
    };
    logging: {
      createPackageJson: [];
      installDependencies: [{ scriptName: string }];
      installModule: [{ moduleName: string }];
      invalidPackageJson: [{ fileName: string }];
    };
    meta: {
      invalidFile: [];
    };
  };
  webview: {
    attach: {
      moreThanOnce: [];
      noPanel: [];
    };
    reload: {
      beforeOpen: [];
      dev: {
        serverNotReady: [];
      };
    };
  };
}
